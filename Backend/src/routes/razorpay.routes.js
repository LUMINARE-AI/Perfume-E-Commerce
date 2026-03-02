import express from 'express';
import { createRazorpayOrder, verifyRazorpayPayment } from '../controllers/razorpay.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/create-order', verifyJWT, createRazorpayOrder);
router.post('/verify-payment', verifyJWT, verifyRazorpayPayment);

export default router;