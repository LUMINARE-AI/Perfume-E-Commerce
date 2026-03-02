import express from "express";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
} from "../controllers/cart.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", verifyJWT, getCart);
router.post("/", verifyJWT, addToCart);
router.put("/", verifyJWT, updateCartItem);
router.delete("/:productId", verifyJWT, removeFromCart);

export default router;
