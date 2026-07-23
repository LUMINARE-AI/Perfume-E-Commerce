import axios from "./axios";

/**
 * Check Pincode Serviceability
 * GET /api/delhivery/serviceability/:pincode
 */
export const checkServiceability = (pincode) =>
  axios.get(`/delhivery/serviceability/${pincode}`);

/**
 * Get Expected TAT (Delivery Time)
 * GET /api/delhivery/tat?originPin=123456&destinationPin=654321&mot=S
 */
export const getTAT = (originPin, destinationPin, mot = 'S') =>
  axios.get(`/delhivery/tat`, {
    params: {
      originPin,
      destinationPin,
      mot, // S = Surface, E = Express
    },
  });

/**
 * Fetch Waybill Numbers
 * GET /api/delhivery/waybills?count=1
 */
export const fetchWaybills = (count = 1) =>
  axios.get(`/delhivery/waybills`, {
    params: { count },
  });

/**
 * Create Warehouse
 * POST /api/delhivery/warehouse
 */
export const createWarehouse = (warehouseData) =>
  axios.post(`/delhivery/warehouse`, warehouseData);

/**
 * Update Warehouse
 * PUT /api/delhivery/warehouse/:id
 */
export const updateWarehouse = (id, warehouseData) =>
  axios.put(`/delhivery/warehouse/${id}`, warehouseData);

/**
 * Calculate Shipping Cost
 * POST /api/delhivery/calculate-cost
 */
export const calculateShippingCost = (shipmentData) => {
  console.log('🚀 Frontend: Sending shipping data:', shipmentData);
  
  return axios.post(`/delhivery/calculate-cost`, {
    originPin: shipmentData.originPin,
    destinationPin: shipmentData.destinationPin,
    chargeableWeight: shipmentData.weight || 500, // Make sure it's chargeableWeight
    paymentMode: shipmentData.paymentMode || 'Pre-paid',
    codAmount: shipmentData.collectableAmount || 0,
    mode: shipmentData.mode || 'S'
  });
};
/**
 * Create Shipment
 * POST /api/delhivery/shipment
 */
export const createShipment = (shipmentData) =>
  axios.post(`/delhivery/shipment`, shipmentData);

/**
 * Update Shipment
 * PUT /api/delhivery/shipment/:waybill
 */
export const updateShipment = (waybill, updateData) =>
  axios.put(`/delhivery/shipment/${waybill}`, updateData);

/**
 * Cancel Shipment
 * DELETE /api/delhivery/shipment/:waybill
 */
export const cancelShipment = (waybill) =>
  axios.delete(`/delhivery/shipment/${waybill}`);

/**
 * Create Pickup Request
 * POST /api/delhivery/pickup
 */
export const createPickupRequest = (pickupData) =>
  axios.post(`/delhivery/pickup`, pickupData);

/**
 * Generate Shipping Label
 * GET /api/delhivery/label/:waybill?pdfSize=A4
 */
export const generateShippingLabel = (waybill, pdfSize = 'A4') =>
  axios.get(`/delhivery/label/${waybill}`, {
    params: { pdfSize },
    responseType: 'blob',
  });

/**
 * Track Shipment
 * GET /api/delhivery/track?waybill=XXX&orderId=YYY
 */
export const trackShipment = (waybill = '', orderId = '') =>
  axios.get(`/delhivery/track`, {
    params: {
      ...(waybill && { waybill }),
      ...(orderId && { orderId }),
    },
  });

/**
 * Update E-waybill
 * PUT /api/delhivery/ewaybill/:waybill
 */
export const updateEwaybill = (waybill, ewaybillData) =>
  axios.put(`/delhivery/ewaybill/${waybill}`, ewaybillData);

/**
 * Download Document (POD, Invoice, etc.)
 * GET /api/delhivery/document/:waybill?type=pod
 */
export const downloadDocument = (waybill, type = 'pod') =>
  axios.get(`/delhivery/document/${waybill}`, {
    params: { type },
    responseType: 'blob',
  });

/**
 * Helper: Download file from blob response
 */
export const downloadFile = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * Open PDF blob or JSON link response from Delhivery document/label APIs
 */
export const openPdfResponse = async (res) => {
  const contentType = res.headers?.['content-type'] || '';

  if (contentType.includes('application/json')) {
    const text = await res.data.text();
    const json = JSON.parse(text);
    const pdfUrl =
      json?.packages?.[0]?.pdf_download_link ||
      json?.pdf_download_link ||
      json?.data?.packages?.[0]?.pdf_download_link;

    if (!pdfUrl) throw new Error('PDF link not found');
    window.open(pdfUrl, '_blank');
    return;
  }

  const blob = new Blob([res.data], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
};