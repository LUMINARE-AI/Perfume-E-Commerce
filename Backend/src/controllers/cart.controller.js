import Product from "../models/product.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import mongoose from "mongoose";

// GET /api/cart
export const getCart = asyncHandler(async (req, res) => {
  const user = await req.user.populate("cart.product");

  // ❌ Remove broken products (deleted products)
  user.cart = user.cart.filter((item) => item.product !== null);

  await user.save();

  return res.status(200).json(
    new ApiResponse(200, user.cart, "Cart fetched successfully")
  );
});


// POST /api/cart
export const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1 } = req.body; // ✅ Accept 'quantity' instead of 'qty'

  // Validation
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new ApiError(400, "Invalid product ID");
  }

  if (!quantity || quantity < 1) {
    throw new ApiError(400, "Quantity must be at least 1");
  }

  // Check if product exists
  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  // Check stock availability
  if (product.stock < quantity) {
    throw new ApiError(400, `Only ${product.stock} units available in stock`);
  }

  const user = req.user;

  // Find existing item in cart
  const existingItem = user.cart.find(
    (item) => item.product.toString() === productId
  );

  if (existingItem) {
    // Check if new total quantity exceeds stock
    const newQuantity = existingItem.quantity + quantity;
    
    if (newQuantity > product.stock) {
      throw new ApiError(
        400,
        `Cannot add ${quantity} more. Only ${product.stock - existingItem.quantity} units available`
      );
    }

    existingItem.quantity = newQuantity;
  } else {
    // Add new item to cart
    user.cart.push({ product: productId, quantity });
  }

  await user.save();

  // Populate cart items for response
  await user.populate("cart.product");

  return res
    .status(200)
    .json(new ApiResponse(200, user.cart, "Item added to cart"));
});

// PUT /api/cart
export const updateCartItem = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body;

  // Validation
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new ApiError(400, "Invalid product ID");
  }

  if (!quantity || quantity < 1) {
    throw new ApiError(400, "Quantity must be at least 1");
  }

  // Check product stock
  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  if (quantity > product.stock) {
    throw new ApiError(400, `Only ${product.stock} units available in stock`);
  }

  const user = req.user;

  // Find item in cart
  const item = user.cart.find(
    (i) => i.product.toString() === productId
  );

  if (!item) {
    throw new ApiError(404, "Item not found in cart");
  }

  // Update quantity
  item.quantity = quantity;
  await user.save();

  // Populate cart items for response
  await user.populate("cart.product");

  return res
    .status(200)
    .json(new ApiResponse(200, user.cart, "Cart item updated"));
});

// DELETE /api/cart/:productId
export const removeFromCart = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new ApiError(400, "Invalid product ID");
  }

  const user = req.user;

  // Check if item exists
  const itemExists = user.cart.some(
    (i) => i.product.toString() === productId
  );

  if (!itemExists) {
    throw new ApiError(404, "Item not found in cart");
  }

  // Remove item
  user.cart = user.cart.filter(
    (i) => i.product.toString() !== productId
  );

  await user.save();

  // Populate remaining cart items
  await user.populate("cart.product");

  return res
    .status(200)
    .json(new ApiResponse(200, user.cart, "Item removed from cart"));
});