import Order from '../models/order.model.js';
import { generateInvoicePDF } from '../services/invoice.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Generate & Download Invoice
 * GET /api/invoices/:orderId
 */
export const downloadInvoice = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  
  // Fetch order with populated data
  const order = await Order.findById(orderId)
    .populate('user', 'name email')
    .populate('items.product', 'name');
  
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }
  
  // Check authorization
  const isOwner = order.user._id.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';
  
  if (!isOwner && !isAdmin) {
    throw new ApiError(403, 'Not authorized to download this invoice');
  }
  
  // Generate PDF
  const pdfBuffer = await generateInvoicePDF(order);
  
  // Set headers for PDF download
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=invoice-${orderId}.pdf`);
  res.setHeader('Content-Length', pdfBuffer.length);
  
  res.send(pdfBuffer);
});

/**
 * Preview Invoice (returns HTML)
 * GET /api/invoices/:orderId/preview
 */
export const previewInvoice = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  
  const order = await Order.findById(orderId)
    .populate('user', 'name email')
    .populate('items.product', 'name');
  
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }
  
  const isOwner = order.user._id.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';
  
  if (!isOwner && !isAdmin) {
    throw new ApiError(403, 'Not authorized');
  }
  
  // Import the HTML generator
  const { generateInvoiceHTML } = await import('../services/invoice.service.js');
  const html = generateInvoiceHTML(order);
  
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});