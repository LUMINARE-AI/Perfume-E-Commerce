import express from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { isAdmin } from "../middleware/admin.middleware.js";
import {
  getDashboardStats,
  getAllUsers,
} from "../controllers/admin.controller.js";
import { getAllOrders } from "../controllers/order.controller.js";

const router = express.Router();

// Analytics
router.get("/stats", verifyJWT, isAdmin, getDashboardStats);

// Orders
router.get("/orders", verifyJWT, isAdmin, getAllOrders);

// Users
router.get("/users", verifyJWT, isAdmin, getAllUsers);

export default router;
