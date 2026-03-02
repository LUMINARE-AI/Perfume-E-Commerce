import express from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { isAdmin } from "../middleware/admin.middleware.js";
import {
  addReview,
  getProductReviews,
  getAllReviews,
  deleteReview,
} from "../controllers/review.controller.js";

const router = express.Router();

router.post("/", verifyJWT, addReview);
router.get("/product/:productId", getProductReviews);

// Admin
router.get("/admin", verifyJWT, isAdmin, getAllReviews);
router.delete("/:id", verifyJWT, isAdmin, deleteReview);

export default router;
