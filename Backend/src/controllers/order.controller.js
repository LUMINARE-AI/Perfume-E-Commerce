import Order from "../models/order.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import mongoose from "mongoose";
import { createShipment } from "../services/delhivery.service.js";

export const createOrder = asyncHandler(async (req, res) => {
  const user = await req.user.populate("cart.product");

  if (!user.cart.length) {
    throw new ApiError(400, "Cart is empty");
  }

  // ✅ shippingFee bhi lo frontend se
  const { shippingAddress, paymentMethod, shippingFee } = req.body;

  if (!shippingAddress || !paymentMethod) {
    throw new ApiError(400, "Shipping address and payment method are required");
  }

  const requiredAddressFields = ["address", "city", "state", "pincode", "phone"];
  const missingFields = requiredAddressFields.filter(
    (field) => !shippingAddress[field]
  );

  if (missingFields.length > 0) {
    throw new ApiError(
      400,
      `Missing required address fields: ${missingFields.join(", ")}`
    );
  }

  const items = user.cart.map((item) => ({
    product: item.product._id,
    name: item.product.name,
    image: item.product.images?.[0]?.url || item.product.images?.[0] || "",
    price: Number(item.product.price) || 0,
    qty: Number(item.quantity) || 1,
  }));

  const itemsPrice = items.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );

  const taxPrice = 0;

  // ✅ Live Delhivery fee use karo, fallback: >3000 = free, else 150
  const shippingPrice =
    shippingFee !== undefined && shippingFee !== null
      ? Number(shippingFee)
      : itemsPrice > 3000 ? 0 : 150;

  const totalPrice = itemsPrice + taxPrice + shippingPrice;

  // Normalize payment method
  const normalizedPaymentMethod =
    paymentMethod.toLowerCase() === "cod" ? "COD" : "PREPAID";

  // Create order (unpaid initially for both)
  const order = await Order.create({
    user: user._id,
    items,
    shippingAddress: {
      name: shippingAddress.name || user.name,
      phone: shippingAddress.phone,
      address: shippingAddress.address,
      city: shippingAddress.city,
      state: shippingAddress.state,
      pincode: shippingAddress.pincode,
      country: shippingAddress.country || "India",
    },
    paymentMethod: normalizedPaymentMethod,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    isPaid: false,
  });

  // 🚚 Create Delhivery shipment ONLY for COD
  if (normalizedPaymentMethod === "COD") {
    try {
      const shipmentData = {
        customerName: shippingAddress.name || user.name,
        customerAddress: shippingAddress.address,
        customerPincode: shippingAddress.pincode,
        customerCity: shippingAddress.city,
        customerState: shippingAddress.state,
        customerCountry: shippingAddress.country || "India",
        customerPhone: shippingAddress.phone,

        orderNumber: order._id.toString(),
        paymentMode: "COD",
        productDescription: items.map((item) => item.name).join(", "),
        codAmount: totalPrice,
        totalAmount: totalPrice,
        quantity: items.reduce((sum, item) => sum + item.qty, 0),
        weight: 500,

        pickupLocationName:
          process.env.DELHIVERY_PICKUP_LOCATION || "Main Warehouse",

        sellerName: process.env.SELLER_NAME || "BinKhalid Store",
        sellerAddress: process.env.SELLER_ADDRESS || "",
        sellerGST: process.env.SELLER_GST || "",
      };

      const delhiveryRes = await createShipment(shipmentData);

      if (delhiveryRes.success) {
        const awb =
          delhiveryRes.data?.packages?.[0]?.waybill ||
          delhiveryRes.data?.waybill ||
          `TEMP${Date.now()}`;

        order.delivery = {
          provider: "delhivery",
          awb,
          status: "pending",
          trackingUrl: `https://www.delhivery.com/track-v2/package/${awb}`,
        };
      } else {
        order.delivery = {
          provider: "delhivery",
          status: "pending",
          error: delhiveryRes.error?.message || "Failed to create shipment",
        };
      }
    } catch (err) {
      order.delivery = {
        provider: "delhivery",
        status: "failed",
        error: err.message,
      };
    }

    await order.save();
  }

  // 🧹 Clear cart
  user.cart = [];
  await user.save();

  return res
    .status(201)
    .json(new ApiResponse(201, order, "Order created successfully"));
});

/**
 * Get My Orders
 * GET /api/orders/my-orders
 */
export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id })
    .populate("items.product", "name images price")
    .sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, orders, "User orders fetched successfully"));
});

/**
 * Get Order By ID
 * GET /api/orders/:id
 */
export const getOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid order ID");
  }

  const order = await Order.findById(id)
    .populate("user", "name email")
    .populate("items.product", "name images price");

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  const isOwner = order.user._id.toString() === req.user._id.toString();
  const isAdmin = req.user.role === "admin";

  if (!isOwner && !isAdmin) {
    throw new ApiError(403, "Not authorized to view this order");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, order, "Order fetched successfully"));
});

/**
 * Update Order Status
 * PUT /api/orders/:id/status
 */
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid order ID");
  }

  const allowedStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"];

  if (!allowedStatuses.includes(status)) {
    throw new ApiError(400, `Invalid status. Allowed: ${allowedStatuses.join(", ")}`);
  }

  const order = await Order.findById(id);

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  order.status = status;

  if (status === "delivered") {
    order.deliveredAt = new Date();
    if (order.delivery) {
      order.delivery.status = "delivered";
    }
    if (order.paymentMethod === "COD") {
      order.isPaid = true;
      order.paidAt = new Date();
    }
  }

  if (status === "shipped" && order.delivery) {
    order.delivery.status = "in_transit";
  }

  await order.save();

  return res
    .status(200)
    .json(new ApiResponse(200, order, "Order status updated"));
});

/**
 * Get All Orders (Admin)
 * GET /api/orders
 */
export const getAllOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;

  const query = {};
  if (status) query.status = status;

  const orders = await Order.find(query)
    .populate("user", "name email")
    .populate("items.product", "name images price")
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Order.countDocuments(query);

  return res.status(200).json(
    new ApiResponse(200, {
      orders,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      totalOrders: total,
    }, "All orders fetched")
  );
});

/**
 * Delete Order (Admin)
 * DELETE /api/orders/:id
 */
export const deleteOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid order ID");
  }

  const order = await Order.findById(id);

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  if (order.status !== "cancelled") {
    throw new ApiError(400, "Only cancelled orders can be deleted");
  }

  await order.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Order deleted"));
});

/**
 * Track Order
 * GET /api/orders/:id/track
 */
export const trackOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid order ID");
  }

  const order = await Order.findById(id);

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  const isOwner = order.user.toString() === req.user._id.toString();
  const isAdmin = req.user.role === "admin";

  if (!isOwner && !isAdmin) {
    throw new ApiError(403, "Not authorized");
  }

  if (!order.delivery?.awb) {
    throw new ApiError(400, "No tracking information available");
  }

  return res.status(200).json(
    new ApiResponse(200, {
      orderId: order._id,
      awb: order.delivery.awb,
      status: order.status,
      deliveryStatus: order.delivery.status,
      trackingUrl: order.delivery.trackingUrl,
    }, "Tracking info fetched")
  );
});

export const cancelOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid order ID");
  }

  const order = await Order.findById(id);

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  const isOwner = order.user.toString() === req.user._id.toString();
  const isAdmin = req.user.role === "admin";

  if (!isOwner && !isAdmin) {
    throw new ApiError(403, "Not authorized to cancel this order");
  }

  if (["shipped", "delivered"].includes(order.status)) {
    throw new ApiError(400, "Order already shipped/delivered. Cancel not allowed.");
  }

  order.status = "cancelled";

  // 💰 Refund logic (Prepaid orders)
  if (order.isPaid) {
    order.paymentResult = {
      ...order.paymentResult,
      refundStatus: "initiated",
    };
  }

  // 🚚 Cancel Delhivery shipment if AWB generated
  if (order.delivery?.awb && order.delivery.status !== "delivered") {
    try {
      order.delivery.status = "failed";
    } catch (err) {
      console.error("Failed to cancel shipment:", err);
    }
  }

  await order.save();

  return res.status(200).json(
    new ApiResponse(200, order, "Order cancelled successfully")
  );
});

/**
 * Update Delivery Info (Admin) — AWB save karne ke liye after manual shipment creation
 * PUT /api/orders/:id/delivery
 *
 * ⚠️  order.routes.js mein ye line add karo:
 *   router.put("/:id/delivery", verifyJWT, isAdmin, updateOrderDelivery);
 */
export const updateOrderDelivery = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { awb, provider, status, trackingUrl, error } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid order ID");
  }

  const order = await Order.findById(id);
  if (!order) throw new ApiError(404, "Order not found");

  order.delivery = {
    provider: provider || "delhivery",
    awb: awb || order.delivery?.awb,
    status: status || "pending",
    trackingUrl: trackingUrl || order.delivery?.trackingUrl,
    ...(error && { error }),
  };

  // AWB mil gayi toh status processing kar do (agar abhi pending hai)
  if (awb && order.status === "pending") {
    order.status = "processing";
  }

  await order.save();

  return res
    .status(200)
    .json(new ApiResponse(200, order, "Delivery info updated"));
});