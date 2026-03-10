import axios from 'axios';

const DELHIVERY_API_KEY = process.env.DELHIVERY_API_KEY;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const USE_MOCK = process.env.USE_MOCK_DELHIVERY === 'true';

console.log('🔧 Delhivery Service Configuration:');
console.log('  API Key:', DELHIVERY_API_KEY ? '✓ Present' : '✗ MISSING');
console.log('  Environment:', process.env.NODE_ENV);
console.log('  Mock Mode:', USE_MOCK);

const BASE_URL = IS_PRODUCTION
  ? 'https://track.delhivery.com'
  : 'https://staging-express.delhivery.com';

console.log('  Base URL:', BASE_URL);

const axiosClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Token ${DELHIVERY_API_KEY}`
  },
  timeout: 30000
});

// ============================================
// 1. WAYBILL NUMBERS
// ============================================
export const fetchWaybills = async (count = 1) => {
  if (USE_MOCK) {
    return {
      success: true,
      data: Array.from({ length: count }, (_, i) => `MOCK${Date.now()}${i}`)
    };
  }

  try {
    const response = await axiosClient.get(`/waybill/api/bulk/json/`, {
      params: { count }
    });
    return { success: true, data: response.data };
  } catch (error) {
    return handleError(error, 'Fetch Waybills');
  }
};

// ============================================
// 2. CHECK SERVICEABILITY
// ✅ FIX: Response structure normalize kiya
//    Real API: { delivery_codes: [{ postal_code: {...}, cod: "Y", prepaid: "Y" }] }
//    Frontend expect karta tha: { success: true/false }
//    Ab dono sahi kaam karenge
// ============================================
export const checkServiceability = async (pincode) => {
  console.log('🔍 Checking serviceability for pincode:', pincode);

  if (USE_MOCK) {
    return {
      success: true,
      serviceable: true,
      cod: true,
      prepaid: true,
      data: {
        delivery_codes: [{
          postal_code: {
            pin: pincode,
            city: "Delhi",
            state_code: "DL",
            state: "Delhi",
            country_code: "IN"
          },
          prepaid: "Y",
          cod: "Y",
          pickup: "Y",
        }]
      }
    };
  }

  try {
    const response = await axiosClient.get(`/c/api/pin-codes/json/`, {
      params: { filter_codes: pincode }
    });

    const deliveryCodes = response.data?.delivery_codes || [];
    const isServiceable = deliveryCodes.length > 0;
    const pinData = deliveryCodes[0] || {};

    return {
      success: true,
      // ✅ Top-level flags — frontend easily check kar sake
      serviceable: isServiceable,
      cod: pinData.cod === 'Y',
      prepaid: pinData.prepaid === 'Y',
      data: response.data
    };
  } catch (error) {
    console.error('❌ Serviceability check failed:', error.response?.data || error.message);
    return handleError(error, 'Check Serviceability');
  }
};

// ============================================
// 3. GET TAT
// ============================================
export const getExpectedTAT = async (originPin, destinationPin, mot = 'S') => {
  console.log('⏱️ Getting TAT:', { originPin, destinationPin, mot });

  if (USE_MOCK) {
    return {
      success: true,
      data: {
        origin_pin: originPin,
        destination_pin: destinationPin,
        expected_delivery_days: "3",
        tat: "3"
      }
    };
  }

  try {
    const response = await axiosClient.get(`/api/dc/expected_tat`, {
      params: { origin_pin: originPin, destination_pin: destinationPin, mot }
    });
    return { success: true, data: response.data };
  } catch (error) {
    return handleError(error, 'Get Expected TAT');
  }
};

// ============================================
// 4. CREATE WAREHOUSE
// ============================================
export const createWarehouse = async (warehouseData) => {
  try {
    const response = await axiosClient.post(`/api/backend/clientwarehouse/create/`, warehouseData);
    return { success: true, data: response.data };
  } catch (error) {
    return handleError(error, 'Create Warehouse');
  }
};

// ============================================
// 5. UPDATE WAREHOUSE
// ============================================
export const updateWarehouse = async (warehouseData) => {
  try {
    const response = await axiosClient.post(`/api/backend/clientwarehouse/update/`, warehouseData);
    return { success: true, data: response.data };
  } catch (error) {
    return handleError(error, 'Update Warehouse');
  }
};

// ============================================
// 6. CALCULATE SHIPPING COST
// ✅ FIX: Response ko consistently normalize kiya
//    API ka response array[0] mein aata hai
//    Ab totalAmount guaranteed top-level pe hai
// ============================================
export const calculateShippingCost = async (shipmentData) => {
  if (USE_MOCK) {
    const fee = shipmentData.codAmount > 3000 ? 0 : 82;
    return {
      success: true,
      data: {
        totalAmount: fee,
        baseCharge: 50,
        codCharges: shipmentData.paymentMode === 'COD' ? 20 : 0,
        taxes: 12.6,
        zone: 'A',
        chargedWeight: shipmentData.chargeableWeight || 500
      }
    };
  }

  try {
    const params = {
      md: shipmentData.mode || 'S',
      ss: 'Delivered',
      d_pin: shipmentData.destinationPin,
      o_pin: shipmentData.originPin,
      cgm: shipmentData.chargeableWeight || 500,
      pt: shipmentData.paymentMode || 'Pre-paid',
      cod: shipmentData.codAmount || 0
    };

    const response = await axiosClient.get(`/api/kinko/v1/invoice/charges/.json`, { params });

    // ✅ Delhivery array return karta hai — pehla element lo
    const rawData = Array.isArray(response.data) ? response.data[0] : response.data;

    if (!rawData) {
      throw new Error('Empty response from Delhivery shipping cost API');
    }

    const formattedData = {
      zone: rawData.zone,
      chargedWeight: rawData.charged_weight,
      baseCharge: rawData.charge_DL || 0,
      codCharges: rawData.charge_COD || 0,
      fuelSurcharge: rawData.charge_FSC || 0,
      handlingCharges: rawData.charge_DPH || 0,
      grossAmount: rawData.gross_amount || 0,
      taxes: {
        sgst: rawData.tax_data?.SGST || 0,
        cgst: rawData.tax_data?.CGST || 0,
        igst: rawData.tax_data?.IGST || 0,
        total: (rawData.tax_data?.SGST || 0) + (rawData.tax_data?.CGST || 0) + (rawData.tax_data?.IGST || 0)
      },
      // ✅ totalAmount guaranteed — multiple fallbacks
      totalAmount: rawData.total_amount || rawData.gross_amount || 0,
      status: rawData.status
    };

    return { success: true, data: formattedData };
  } catch (error) {
    console.error('❌ Shipping cost calculation failed:', error.response?.data || error.message);
    return handleError(error, 'Calculate Shipping Cost');
  }
};

// ============================================
// 7. CREATE SHIPMENT
// ============================================
export const createShipment = async (shipmentData) => {
  if (USE_MOCK) {
    return {
      success: true,
      data: {
        packages: [{
          waybill: `MOCK${Date.now()}`,
          status: "Success"
        }]
      }
    };
  }

  try {
    const formatData = {
      shipments: [{
        name: shipmentData.customerName,
        add: shipmentData.customerAddress,
        pin: shipmentData.customerPincode,
        city: shipmentData.customerCity,
        state: shipmentData.customerState,
        country: shipmentData.customerCountry || "India",
        phone: shipmentData.customerPhone,

        order: shipmentData.orderNumber,
        payment_mode: shipmentData.paymentMode || "Prepaid",

        products_desc: shipmentData.productDescription,
        cod_amount: shipmentData.codAmount || 0,

        // ✅ Correct date format
        order_date: new Date().toISOString().split("T")[0],

        total_amount: shipmentData.totalAmount,
        quantity: shipmentData.quantity || 1,

        weight: shipmentData.weight || 0.5,

        seller_name: shipmentData.sellerName,
        seller_add: shipmentData.sellerAddress,

        shipping_mode: "Surface",
        address_type: "home",

        // ✅ Return address required
        return_pin: shipmentData.customerPincode,
        return_city: shipmentData.customerCity,
        return_phone: shipmentData.customerPhone,
        return_add: shipmentData.customerAddress,
        return_state: shipmentData.customerState,
        return_country: "India"
      }],

      pickup_location: {
        name: shipmentData.pickupLocationName
      }
    };

    const response = await axiosClient.post(
      "/api/cmu/create.json",
      `format=json&data=${JSON.stringify(formatData)}`,
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    return { success: true, data: response.data };

  } catch (error) {
    return handleError(error, "Create Shipment");
  }
};

// ============================================
// 8. UPDATE SHIPMENT
// ============================================
export const updateShipment = async (waybill, updateData) => {
  try {
    const response = await axiosClient.post(`/api/p/edit`, { waybill, ...updateData });
    return { success: true, data: response.data };
  } catch (error) {
    return handleError(error, 'Update Shipment');
  }
};

// ============================================
// 9. CANCEL SHIPMENT
// ============================================
export const cancelShipment = async (waybill) => {
  try {
    const response = await axiosClient.post(`/api/p/edit`, { waybill, cancellation: true });
    return { success: true, data: response.data };
  } catch (error) {
    return handleError(error, 'Cancel Shipment');
  }
};

// ============================================
// 10. CREATE PICKUP REQUEST
// ============================================
export const createPickupRequest = async (pickupData) => {
  try {
    const response = await axiosClient.post(`/fm/request/new/`, {
      pickup_location: pickupData.pickupLocation,
      pickup_date: pickupData.pickupDate,
      pickup_time: pickupData.pickupTime,
      expected_package_count: pickupData.packageCount
    });
    return { success: true, data: response.data };
  } catch (error) {
    return handleError(error, 'Create Pickup Request');
  }
};

// ============================================
// 11. GENERATE SHIPPING LABEL
// ============================================
export const generateShippingLabel = async (waybill, pdfSize = 'A4') => {
  try {
    const response = await axiosClient.get(`/api/p/packing_slip`, {
      params: { wbns: waybill, pdf: true, pdf_size: pdfSize },
      responseType: 'arraybuffer'
    });
    return { success: true, data: response.data, contentType: response.headers['content-type'] };
  } catch (error) {
    return handleError(error, 'Generate Shipping Label');
  }
};

// ============================================
// 12. TRACK SHIPMENT
// ============================================
export const trackShipment = async (waybill = '', orderId = '') => {
  try {
    const params = {};
    if (waybill) params.waybill = waybill;
    if (orderId) params.ref_ids = orderId;

    const response = await axiosClient.get(`/api/v1/packages/json/`, { params });
    return { success: true, data: response.data };
  } catch (error) {
    return handleError(error, 'Track Shipment');
  }
};

// ============================================
// 13. UPDATE E-WAYBILL
// ============================================
export const updateEwaybill = async (waybill, ewaybillData) => {
  try {
    const response = await axiosClient.post(`/api/rest/ewaybill/${waybill}/`, ewaybillData);
    return { success: true, data: response.data };
  } catch (error) {
    return handleError(error, 'Update E-waybill');
  }
};

// ============================================
// 14. DOWNLOAD DOCUMENT
// ============================================
export const downloadDocument = async (waybill, documentType = 'invoice') => {
  try {
    let endpoint;
    let params;

    if (documentType === 'invoice') {
      // Invoice endpoint
      endpoint = `/api/p/packing_slip`;
      params = { wbns: waybill, pdf: true };
    } else if (documentType === 'label') {
      // Label endpoint
      endpoint = `/api/p/packing_slip`;
      params = { wbns: waybill, pdf: true };
    } else if (documentType === 'pod') {
      // POD endpoint
      endpoint = `/api/pod/`;
      params = { waybill };
    } else {
      endpoint = `/api/p/packing_slip`;
      params = { wbns: waybill, pdf: true };
    }

    const response = await axiosClient.get(endpoint, {
      params,
      responseType: 'arraybuffer',
    });

    const contentType = response.headers['content-type'] || 'application/pdf';
    if (contentType.includes('application/json')) {
      const text = Buffer.from(response.data).toString('utf8');
      throw new Error(`Delhivery returned JSON instead of PDF: ${text}`);
    }

    return {
      success: true,
      data: response.data,
      contentType,
    };
  } catch (error) {
    return handleError(error, 'Download Document');
  }
};

// ============================================
// ERROR HANDLER
// ============================================
const handleError = (error, operation) => {
  const errorDetails = {
    operation,
    message: error.response?.data?.error ||
             error.response?.data?.message ||
             error.message ||
             'Unknown error occurred',
    status: error.response?.status,
    statusText: error.response?.statusText,
    details: error.response?.data
  };

  console.error(`❌ ${operation} Error:`, errorDetails);

  return { success: false, error: errorDetails };
};

// ============================================
// IS CONFIGURED
// ============================================
export const isConfigured = () => !!DELHIVERY_API_KEY;

export default {
  fetchWaybills,
  checkServiceability,
  getExpectedTAT,
  createWarehouse,
  updateWarehouse,
  calculateShippingCost,
  createShipment,
  updateShipment,
  cancelShipment,
  trackShipment,
  createPickupRequest,
  generateShippingLabel,
  updateEwaybill,
  downloadDocument,
  isConfigured
};

