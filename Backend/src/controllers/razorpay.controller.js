import crypto from "crypto";
import { razorpay } from "../services/razorpay.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import Order from "../models/order.model.js";

export const createRazorpayOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.body;

  if (!orderId) {
    throw new ApiError(400, "Order ID is required");
  }

  const dbOrder = await Order.findById(orderId);

  if (!dbOrder) {
    throw new ApiError(404, "Order not found");
  }

  if (dbOrder.isPaid) {
    throw new ApiError(400, "Order is already paid");
  }

  const order = await razorpay.orders.create({
    amount: Math.round(dbOrder.totalPrice * 100), // paise mein, backend se
    currency: "INR",
    receipt: "receipt_" + dbOrder._id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, order, "Razorpay order created"));
});

export const verifyRazorpayPayment = asyncHandler(async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    orderId,
  } = req.body;

  //  Signature verify
  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    throw new ApiError(400, "Payment verification failed");
  }

  // DB se order fetch
  const existingOrder = await Order.findById(orderId);
  if (!existingOrder) throw new ApiError(404, "Order not found");

  // Amount mismatch check
  const razorpayOrder = await razorpay.orders.fetch(razorpay_order_id);
  if (razorpayOrder.amount !== Math.round(existingOrder.totalPrice * 100)) {
    throw new ApiError(400, "Amount mismatch — possible tampering");
  }

  // Idempotency — PEHLE check, phir update
  if (existingOrder.isPaid && existingOrder.delivery?.awb) {
    return res
      .status(200)
      .json(
        new ApiResponse(200, { status: "success" }, "Payment already verified")
      );
  }

  // Order update
  const order = await Order.findByIdAndUpdate(
    orderId,
    {
      isPaid: true,
      paidAt: new Date(),
      razorpayPaymentId: razorpay_payment_id,
    },
    { new: true }
  ).populate("user", "name");

  // PREPAID ke liye Delhivery shipment banao
  if (order && !order.delivery?.awb) {
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

      order.status = "processing";
      await order.save();
    } catch (err) {
      console.error("Delhivery shipment failed for prepaid order:", err.message);
      // Shipment fail hone pe payment verified rehti hai, silently log karo
    }
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, { status: "success" }, "Payment verified successfully")
    );
});