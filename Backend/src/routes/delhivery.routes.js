import express from 'express';
import {
  fetchWaybills,
  checkServiceability,
  getExpectedTAT,
  createWarehouse,
  updateWarehouse,
  calculateShippingCost,
  createShipment,
  updateShipment,
  cancelShipment,
  createPickupRequest,
  generateShippingLabel,
  trackShipment,
  updateEwaybill,
  downloadDocument
} from '../controllers/delhivery.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';
import { isAdmin } from '../middleware/admin.middleware.js';

const router = express.Router();

// Public — used on product/checkout pincode checks
router.get('/serviceability/:pincode', checkServiceability);
router.get('/tat', getExpectedTAT);

// Authenticated — checkout + customer order docs/tracking
router.post('/calculate-cost', verifyJWT, calculateShippingCost);
router.get('/track', verifyJWT, trackShipment);
router.get('/label/:waybill', verifyJWT, generateShippingLabel);
router.get('/document/:waybill', verifyJWT, downloadDocument);

// Admin-only — shipment mutations & warehouse
router.get('/waybills', verifyJWT, isAdmin, fetchWaybills);
router.post('/warehouse', verifyJWT, isAdmin, createWarehouse);
router.put('/warehouse/:id', verifyJWT, isAdmin, updateWarehouse);
router.post('/shipment', verifyJWT, isAdmin, createShipment);
router.put('/shipment/:waybill', verifyJWT, isAdmin, updateShipment);
router.delete('/shipment/:waybill', verifyJWT, isAdmin, cancelShipment);
router.post('/pickup', verifyJWT, isAdmin, createPickupRequest);
router.put('/ewaybill/:waybill', verifyJWT, isAdmin, updateEwaybill);

export default router;
