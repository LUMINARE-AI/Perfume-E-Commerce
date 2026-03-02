import express from "express";
import {
  createOrder,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
  getAllOrders,
  deleteOrder,
  cancelOrder,
} from "../controllers/order.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { isAdmin } from "../middleware/admin.middleware.js";

const router = express.Router();

router.post("/", verifyJWT, createOrder);
router.get("/my", verifyJWT, getMyOrders);     
router.get("/:id", verifyJWT, getOrderById);
router.put("/:id/cancel", verifyJWT, cancelOrder);

// Admin
router.put("/:id/status", verifyJWT, isAdmin, updateOrderStatus);
router.delete("/:id", verifyJWT, isAdmin, deleteOrder);
router.get("/", verifyJWT, isAdmin, getAllOrders);  
export default router;
