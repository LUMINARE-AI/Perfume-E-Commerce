import crypto from "crypto";
import { razorpay } from "../services/razorpay.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import Order from "../models/order.model.js";
import { User } from "../models/user.model.js";

// CREATE RAZORPAY ORDER (NO DB ORDER YET)
export const createRazorpayOrder = asyncHandler(async (req, res) => {
  const { shippingAddress, shippingFee } = req.body;

  if (!shippingAddress) {
    throw new ApiError(400, "Shipping address required");
  }

  // User cart fetch
  const user = await User.findById(req.user._id).populate("cart.product");

  const cartItems = user.cart;

  if (!cartItems.length) {
    throw new ApiError(400, "Cart is empty");
  }

  // Calculate prices
  const itemsPrice = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const totalPrice = itemsPrice + (shippingFee || 0);

  // Create Razorpay order
  const razorpayOrder = await razorpay.orders.create({
    amount: Math.round(totalPrice * 100),
    currency: "INR",
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        shippingAddress,
        shippingFee,
        totalPrice,
      },
      "Razorpay order created"
    )
  );
});

// VERIFY PAYMENT AND CREATE DB ORDER
export const verifyRazorpayPayment = asyncHandler(async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    shippingAddress,
    shippingFee,
  } = req.body;

  // SIGNATURE VERIFY
  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    throw new ApiError(400, "Payment verification failed");
  }

  const payment = await razorpay.payments.fetch(razorpay_payment_id);

  if (payment.status !== "captured") {
    throw new ApiError(400, "Payment not successful");
  }

  // Fetch cart
  const user = await User.findById(req.user._id).populate("cart.product");

  const cartItems = user.cart;

  if (!cartItems.length) {
    throw new ApiError(400, "Cart is empty");
  }

  // Calculate prices again (ANTI TAMPERING)
  const itemsPrice = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const totalPrice = itemsPrice + (shippingFee || 0);

  // Create order now
  const order = await Order.create({
    user: req.user._id,
    items: cartItems.map((item) => ({
      product: item.product._id,
      name: item.product.name,
      image: item.product.images?.[0],
      price: item.product.price,
      qty: item.quantity,
    })),
    shippingAddress,
    paymentMethod: "PREPAID",
    itemsPrice,
    shippingPrice: shippingFee,
    totalPrice,
    isPaid: true,
    paidAt: new Date(),
    razorpayPaymentId: razorpay_payment_id,
    status: "processing",
  });

  // CREATE DELHIVERY SHIPMENT
  try {
    const { createShipment } = await import("../services/delhivery.service.js");

    const shipmentData = {
      customerName: order.shippingAddress.name,
      customerAddress: order.shippingAddress.address,
      customerPincode: order.shippingAddress.pincode,
      customerCity: order.shippingAddress.city,
      customerState: order.shippingAddress.state,
      customerCountry: "India",
      customerPhone: order.shippingAddress.phone,
      orderNumber: order._id.toString(),
      paymentMode: "Prepaid",
      productDescription: order.items.map((i) => i.name).join(", "),
      codAmount: 0,
      totalAmount: order.totalPrice,
      quantity: order.items.reduce((sum, i) => sum + i.qty, 0),
      weight: 0.5,
      pickupLocationName: process.env.DELHIVERY_PICKUP_NAME || "BinKhalid",
      sellerName: process.env.SELLER_NAME || "MOHAMMAD MOOSAA KHAN",
      sellerAddress: process.env.SELLER_ADDRESS || "Jaipur Rajasthan India",
      sellerGST: process.env.SELLER_GST || "",
    };

    const delhiveryRes = await createShipment(shipmentData);

    const awb = delhiveryRes?.data?.packages?.[0]?.waybill;

    order.delivery = awb
      ? {
          provider: "delhivery",
          awb,
          status: "pending",
          trackingUrl: `https://www.delhivery.com/track-v2/package/${awb}`,
        }
      : {
          provider: "delhivery",
          status: "pending",
          error: "Shipment creation failed",
        };

    await order.save();
  } catch (err) {
    console.error("Delhivery shipment failed:", err.message);
  }

  // CLEAR CART
  user.cart = [];
  await user.save();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { _id: order._id },
        "Payment verified and order created successfully"
      )
    );
});
