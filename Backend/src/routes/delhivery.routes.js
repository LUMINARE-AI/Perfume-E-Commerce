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

const router = express.Router();

// Waybill routes
router.get('/waybills', fetchWaybills);

// Serviceability routes
router.get('/serviceability/:pincode', checkServiceability);
router.get('/tat', getExpectedTAT);

// Warehouse routes
router.post('/warehouse', createWarehouse);
router.put('/warehouse/:id', updateWarehouse);

// Shipping cost
router.post('/calculate-cost', calculateShippingCost);

// Shipment routes
router.post('/shipment', createShipment);
router.put('/shipment/:waybill', updateShipment);
router.delete('/shipment/:waybill', cancelShipment);

// Pickup routes
router.post('/pickup', createPickupRequest);

// Label and tracking
router.get('/label/:waybill', generateShippingLabel);
router.get('/track', trackShipment);

// E-waybill
router.put('/ewaybill/:waybill', updateEwaybill);

// Documents
router.get('/document/:waybill', downloadDocument);

export default router;