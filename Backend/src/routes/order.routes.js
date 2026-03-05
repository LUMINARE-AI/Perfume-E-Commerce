import express from "express";
import {
  createOrder,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
  getAllOrders,
  deleteOrder,
  cancelOrder,
  updateOrderDelivery, // ✅ Was missing
} from "../controllers/order.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { isAdmin } from "../middleware/admin.middleware.js";

const router = express.Router();

// ✅ IMPORTANT: Static routes MUST come before /:id
// "my" ko /:id se pehle register karo warna Express "my" ko ObjectId samajhta hai → crash
router.get("/my", verifyJWT, getMyOrders);
router.get("/", verifyJWT, isAdmin, getAllOrders); // ✅ Was completely missing

router.post("/", verifyJWT, createOrder);
router.get("/:id", verifyJWT, getOrderById);
router.put("/:id/cancel", verifyJWT, cancelOrder);

// Admin
router.put("/:id/status", verifyJWT, isAdmin, updateOrderStatus);
router.put("/:id/delivery", verifyJWT, isAdmin, updateOrderDelivery); // ✅ Was missing
router.delete("/:id", verifyJWT, isAdmin, deleteOrder);

export default router;