// Backend/src/services/delhivery.service.js

import axios from 'axios';

// Configuration
const DELHIVERY_API_KEY = process.env.DELHIVERY_API_KEY;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const USE_MOCK = process.env.USE_MOCK_DELHIVERY === 'true';

// ✅ Startup logs
console.log('🔧 Delhivery Service Configuration:');
console.log('  API Key:', DELHIVERY_API_KEY ? '✓ Present' : '✗ MISSING');
console.log('  Environment:', process.env.NODE_ENV);
console.log('  Mock Mode:', USE_MOCK);

// Base URLs
const BASE_URL = IS_PRODUCTION 
  ? 'https://track.delhivery.com'
  : 'https://staging-express.delhivery.com';

console.log('  Base URL:', BASE_URL);

// Axios client configuration
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
    console.log('🧪 [MOCK] Fetching waybills:', count);
    return {
      success: true,
      data: Array.from({ length: count }, (_, i) => `MOCK${Date.now()}${i}`)
    };
  }

  try {
    const response = await axiosClient.get(`/waybill/api/bulk/json/`, {
      params: { count }
    });
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return handleError(error, 'Fetch Waybills');
  }
};

// ============================================
// 2. CHECK SERVICEABILITY ✅ WITH MOCK
// ============================================
export const checkServiceability = async (pincode) => {
  console.log('🔍 Checking serviceability for pincode:', pincode);
  console.log('🔧 USE_MOCK:', USE_MOCK);
  
  // 🧪 MOCK DATA for development
  if (USE_MOCK) {
    console.log('🧪 [MOCK] Using mock serviceability data');
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
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
          repl: "Y",
          cash: "N",
          is_oda: "N",
          is_odc: "N",
          sort_code: "DLH/DEL"
        }]
      }
    };
  }

  // Real API call
  try {
    console.log('📡 [REAL API] Making request to:', `${BASE_URL}/c/api/pin-codes/json/`);
    
    const response = await axiosClient.get(`/c/api/pin-codes/json/`, {
      params: { filter_codes: pincode }
    });
    
    console.log('✅ API Response received:', response.data);
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('❌ API Call Failed:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url
    });
    
    return handleError(error, 'Check Serviceability');
  }
};

// ============================================
// 3. GET TAT ✅ WITH MOCK
// ============================================
export const getExpectedTAT = async (originPin, destinationPin, mot = 'S') => {
  console.log('⏱️ Getting TAT:', { originPin, destinationPin, mot });
  
  // 🧪 MOCK DATA
  if (USE_MOCK) {
    console.log('🧪 [MOCK] Using mock TAT data');
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      success: true,
      data: {
        origin_pin: originPin,
        destination_pin: destinationPin,
        mode_of_transport: mot,
        expected_delivery_days: "3-5",
        tat: "3 to 5 business days"
      }
    };
  }

  // Real API call
  try {
    console.log('📡 [REAL API] Getting TAT');
    
    const response = await axiosClient.get(`/api/dc/expected_tat`, {
      params: {
        origin_pin: originPin,
        destination_pin: destinationPin,
        mot: mot
      }
    });
    
    console.log('✅ TAT Response:', response.data);
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('❌ TAT Error:', error.response?.data || error.message);
    return handleError(error, 'Get Expected TAT');
  }
};

// ============================================
// 4. CREATE WAREHOUSE
// ============================================
export const createWarehouse = async (warehouseData) => {
  try {
    const response = await axiosClient.post(
      `/api/backend/clientwarehouse/create/`,
      warehouseData
    );
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return handleError(error, 'Create Warehouse');
  }
};

// ============================================
// 5. UPDATE WAREHOUSE
// ============================================
export const updateWarehouse = async (warehouseData) => {
  try {
    const response = await axiosClient.post(
      `/api/backend/clientwarehouse/update/`,
      warehouseData
    );
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return handleError(error, 'Update Warehouse');
  }
};

// ============================================
// 6. CALCULATE SHIPPING COST
// ============================================
// Backend/src/services/delhivery.service.js
// calculateShippingCost function ko update karo

export const calculateShippingCost = async (shipmentData) => {
  if (USE_MOCK) {
    console.log('🧪 [MOCK] Calculating shipping cost');
    return {
      success: true,
      data: {
        baseCharge: 50,
        codCharges: 20,
        taxes: 12.6,
        totalAmount: 82.6,
        zone: 'A',
        chargedWeight: 500
      }
    };
  }

  try {
    console.log('💰 Calculating shipping cost for:', {
      from: shipmentData.originPin,
      to: shipmentData.destinationPin,
      weight: shipmentData.chargeableWeight || 500,
      paymentMode: shipmentData.paymentMode
    });

    const params = {
      md: shipmentData.mode || 'S',
      ss: 'Delivered',
      d_pin: shipmentData.destinationPin,
      o_pin: shipmentData.originPin,
      cgm: shipmentData.chargeableWeight || 500,
      pt: shipmentData.paymentMode || 'Pre-paid',
      cod: shipmentData.codAmount || 0
    };

    const response = await axiosClient.get(`/api/kinko/v1/invoice/charges/.json`, {
      params
    });
    
    console.log('✅ Shipping Cost Response:', response.data);
    
    // ✅ Format response for better readability
    const rawData = response.data[0]; // First element has the data
    
    const formattedData = {
      zone: rawData.zone,
      chargedWeight: rawData.charged_weight,
      baseCharge: rawData.charge_DL,
      codCharges: rawData.charge_COD,
      fuelSurcharge: rawData.charge_FSC,
      handlingCharges: rawData.charge_DPH,
      grossAmount: rawData.gross_amount,
      taxes: {
        sgst: rawData.tax_data.SGST,
        cgst: rawData.tax_data.CGST,
        igst: rawData.tax_data.IGST,
        total: rawData.tax_data.SGST + rawData.tax_data.CGST + rawData.tax_data.IGST
      },
      totalAmount: rawData.total_amount,
      status: rawData.status
    };
    
    return {
      success: true,
      data: formattedData,
      rawData: rawData // Include raw data for reference
    };
  } catch (error) {
    console.error('❌ Shipping cost calculation failed');
    return handleError(error, 'Calculate Shipping Cost');
  }
};

// ============================================
// 7. CREATE SHIPMENT
// ============================================
export const createShipment = async (shipmentData) => {
  if (USE_MOCK) {
    console.log('🧪 [MOCK] Creating shipment');
    return {
      success: true,
      data: {
        packages: [{
          waybill: `MOCK${Date.now()}`,
          status: "Success",
          remarks: "Shipment created successfully (MOCK)"
        }]
      }
    };
  }

  try {
    const formatData = {
      shipments: [
        {
          name: shipmentData.customerName,
          add: shipmentData.customerAddress,
          pin: shipmentData.customerPincode,
          city: shipmentData.customerCity,
          state: shipmentData.customerState,
          country: shipmentData.customerCountry || 'India',
          phone: shipmentData.customerPhone,
          
          order: shipmentData.orderNumber,
          payment_mode: shipmentData.paymentMode || 'Prepaid',
          products_desc: shipmentData.productDescription,
          cod_amount: shipmentData.codAmount || 0,
          order_date: shipmentData.orderDate || new Date().toISOString(),
          total_amount: shipmentData.totalAmount,
          quantity: shipmentData.quantity || 1,
          
          waybill: shipmentData.waybill || '',
          shipment_width: shipmentData.width || 0,
          shipment_height: shipmentData.height || 0,
          weight: shipmentData.weight,
          
          return_pin: shipmentData.returnPincode || '',
          return_city: shipmentData.returnCity || '',
          return_phone: shipmentData.returnPhone || '',
          return_add: shipmentData.returnAddress || '',
          return_state: shipmentData.returnState || '',
          return_country: shipmentData.returnCountry || 'India',
          
          seller_add: shipmentData.sellerAddress,
          seller_name: shipmentData.sellerName,
          seller_inv: shipmentData.invoiceNumber || '',
          seller_gst_tin: shipmentData.sellerGST || '',
          
          hsn_code: shipmentData.hsnCode || '',
          shipping_mode: shipmentData.shippingMode || 'Surface',
          address_type: shipmentData.addressType || 'home'
        }
      ],
      pickup_location: {
        name: shipmentData.pickupLocationName
      }
    };

    const response = await axiosClient.post(
      `/api/cmu/create.json`,
      `format=json&data=${JSON.stringify(formatData)}`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return handleError(error, 'Create Shipment');
  }
};

// ============================================
// 8. UPDATE SHIPMENT
// ============================================
export const updateShipment = async (waybill, updateData) => {
  try {
    const response = await axiosClient.post(`/api/p/edit`, {
      waybill: waybill,
      ...updateData
    });
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return handleError(error, 'Update Shipment');
  }
};

// ============================================
// 9. CANCEL SHIPMENT
// ============================================
export const cancelShipment = async (waybill) => {
  try {
    const response = await axiosClient.post(`/api/p/edit`, {
      waybill: waybill,
      cancellation: true
    });
    
    return {
      success: true,
      data: response.data
    };
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
    
    return {
      success: true,
      data: response.data
    };
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
      params: {
        wbns: waybill,
        pdf: true,
        pdf_size: pdfSize
      },
      responseType: 'arraybuffer'
    });
    
    return {
      success: true,
      data: response.data,
      contentType: response.headers['content-type']
    };
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

    const response = await axiosClient.get(`/api/v1/packages/json/`, {
      params
    });
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return handleError(error, 'Track Shipment');
  }
};

// ============================================
// 13. UPDATE E-WAYBILL
// ============================================
export const updateEwaybill = async (waybill, ewaybillData) => {
  try {
    const response = await axiosClient.post(
      `/api/rest/ewaybill/${waybill}/`,
      ewaybillData
    );
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return handleError(error, 'Update E-waybill');
  }
};

// ============================================
// 14. DOWNLOAD DOCUMENT
// ============================================
export const downloadDocument = async (waybill, documentType = 'pod') => {
  try {
    const response = await axiosClient.get(`/api/v1/packages/json/`, {
      params: {
        waybill: waybill,
        document_type: documentType
      },
      responseType: 'arraybuffer'
    });
    
    return {
      success: true,
      data: response.data,
      contentType: response.headers['content-type']
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
  
  return {
    success: false,
    error: errorDetails
  };
};

// ============================================
// IS CONFIGURED
// ============================================
export const isConfigured = () => {
  return !!DELHIVERY_API_KEY;
};

// ============================================
// DEFAULT EXPORT
// ============================================
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