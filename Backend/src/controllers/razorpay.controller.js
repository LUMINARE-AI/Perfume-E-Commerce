import crypto from "crypto";
import { razorpay } from "../services/razorpay.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

export const createRazorpayOrder = asyncHandler(async (req, res) => {
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    throw new ApiError(400, "Amount is required");
  }

  const order = await razorpay.orders.create({
    amount: amount * 100, // Razorpay works in paise
    currency: "INR",
    receipt: "receipt_" + Date.now(),
  });

  return res.status(200).json(
    new ApiResponse(200, order, "Razorpay order created")
  );
});

export const verifyRazorpayPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    throw new ApiError(400, "Payment verification failed");
  }

  return res.status(200).json(
    new ApiResponse(200, { status: "success" }, "Payment verified successfully")
  );
});