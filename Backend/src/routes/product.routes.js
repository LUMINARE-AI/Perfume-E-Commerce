import express from "express";
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadImages,
  deleteImage,
} from "../controllers/product.controller.js";

import { verifyJWT } from "../middleware/auth.middleware.js";
import { isAdmin } from "../middleware/admin.middleware.js";
import upload from "../middleware/upload.middleware.js";

const router = express.Router();

// Public routes
router.get("/", getAllProducts);
router.get("/:id", getProductById);

// Admin routes
router.post("/", verifyJWT, isAdmin, createProduct);
router.put("/:id", verifyJWT, isAdmin, updateProduct);
router.delete("/:id", verifyJWT, isAdmin, deleteProduct);

// Image upload routes - supports multiple images (max 4)
router.post(
  "/images",
  verifyJWT,
  isAdmin,
  upload.array("images", 4), // Accept up to 4 images with field name "images"
  uploadImages
);

// Delete image route
router.delete("/images", verifyJWT, isAdmin, deleteImage);

export default router;