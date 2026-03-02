import express from 'express';
import { verifyJWT } from "../middleware/auth.middleware.js";
import { downloadInvoice, previewInvoice } from '../controllers/invoice.controller.js';

const router = express.Router();

// Download invoice PDF
router.get('/:orderId', verifyJWT, downloadInvoice);

// Preview invoice HTML
router.get('/:orderId/preview', verifyJWT, previewInvoice);

export default router;