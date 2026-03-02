import Review from "../models/review.model.js";
import Product from "../models/product.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// User adds review
export const addReview = asyncHandler(async (req, res) => {
  const { productId, rating, comment } = req.body;

  if (!productId || !rating || !comment) {
    throw new ApiError(400, "All fields are required");
  }

  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, "Product not found");

  const existing = await Review.findOne({
    user: req.user._id,
    product: productId,
  });

  if (existing) {
    throw new ApiError(400, "You already reviewed this product");
  }

  const review = await Review.create({
    user: req.user._id,
    product: productId,
    rating,
    comment,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, review, "Review added"));
});

// Product reviews (public)
export const getProductReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ product: req.params.productId })
    .populate("user", "name");

  return res
    .status(200)
    .json(new ApiResponse(200, reviews, "Product reviews fetched"));
});

// Admin: all reviews
export const getAllReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({})
    .populate("user", "name email")
    .populate("product", "name");

  return res
    .status(200)
    .json(new ApiResponse(200, reviews, "All reviews fetched"));
});

// Admin: delete review
export const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new ApiError(404, "Review not found");

  await review.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Review deleted"));
});
