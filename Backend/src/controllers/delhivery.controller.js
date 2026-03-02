import delhiveryService from '../services/delhivery.service.js';

export const fetchWaybills = async (req, res) => {
  try {
    const { count = 1 } = req.query;
    const result = await delhiveryService.fetchWaybills(parseInt(count));
    
    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'Waybills fetched successfully',
        data: result.data
      });
    }
    
    return res.status(400).json({
      success: false,
      message: 'Failed to fetch waybills',
      error: result.error
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

export const checkServiceability = async (req, res) => {
  try {
    const { pincode } = req.params;
    
    if (!pincode || pincode.length !== 6) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pincode. Must be 6 digits.'
      });
    }

    const result = await delhiveryService.checkServiceability(pincode);
    
    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'Serviceability checked successfully',
        data: result.data
      });
    }
    
    return res.status(400).json({
      success: false,
      message: 'Failed to check serviceability',
      error: result.error
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};


export const getExpectedTAT = async (req, res) => {
  try {
    const { originPin, destinationPin, mot = 'S' } = req.query;
    
    if (!originPin || !destinationPin) {
      return res.status(400).json({
        success: false,
        message: 'Origin and destination pincodes are required'
      });
    }

    const result = await delhiveryService.getExpectedTAT(
      originPin,
      destinationPin,
      mot
    );
    
    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'TAT fetched successfully',
        data: result.data
      });
    }
    
    return res.status(400).json({
      success: false,
      message: 'Failed to fetch TAT',
      error: result.error
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};


export const createWarehouse = async (req, res) => {
  try {
    const warehouseData = req.body;
    
    // Validate required fields
    const requiredFields = ['name', 'pin', 'city', 'state', 'address', 'phone'];
    const missingFields = requiredFields.filter(field => !warehouseData[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    const result = await delhiveryService.createWarehouse(warehouseData);
    
    if (result.success) {
      return res.status(201).json({
        success: true,
        message: 'Warehouse created successfully',
        data: result.data
      });
    }
    
    return res.status(400).json({
      success: false,
      message: 'Failed to create warehouse',
      error: result.error
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};


export const updateWarehouse = async (req, res) => {
  try {
    const warehouseData = req.body;
    const result = await delhiveryService.updateWarehouse(warehouseData);
    
    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'Warehouse updated successfully',
        data: result.data
      });
    }
    
    return res.status(400).json({
      success: false,
      message: 'Failed to update warehouse',
      error: result.error
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

export const calculateShippingCost = async (req, res) => {
  try {
    const shipmentData = req.body;
    
    // Validate required fields
    if (!shipmentData.originPin || !shipmentData.destinationPin) {
      return res.status(400).json({
        success: false,
        message: 'Origin and destination pincodes are required'
      });
    }

    const result = await delhiveryService.calculateShippingCost(shipmentData);
    
    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'Shipping cost calculated successfully',
        data: result.data
      });
    }
    
    return res.status(400).json({
      success: false,
      message: 'Failed to calculate shipping cost',
      error: result.error
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

export const createShipment = async (req, res) => {
  try {
    const shipmentData = req.body;
    
    // Validate required fields
    const requiredFields = [
      'customerName', 'customerAddress', 'customerPincode', 
      'customerCity', 'customerState', 'customerPhone',
      'orderNumber', 'productDescription', 'totalAmount',
      'weight', 'pickupLocationName'
    ];
    
    const missingFields = requiredFields.filter(field => !shipmentData[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    const result = await delhiveryService.createShipment(shipmentData);
    
    if (result.success) {
      return res.status(201).json({
        success: true,
        message: 'Shipment created successfully',
        data: result.data
      });
    }
    
    return res.status(400).json({
      success: false,
      message: 'Failed to create shipment',
      error: result.error
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

export const updateShipment = async (req, res) => {
  try {
    const { waybill } = req.params;
    const updateData = req.body;
    
    if (!waybill) {
      return res.status(400).json({
        success: false,
        message: 'Waybill number is required'
      });
    }

    const result = await delhiveryService.updateShipment(waybill, updateData);
    
    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'Shipment updated successfully',
        data: result.data
      });
    }
    
    return res.status(400).json({
      success: false,
      message: 'Failed to update shipment',
      error: result.error
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

export const cancelShipment = async (req, res) => {
  try {
    const { waybill } = req.params;
    
    if (!waybill) {
      return res.status(400).json({
        success: false,
        message: 'Waybill number is required'
      });
    }

    const result = await delhiveryService.cancelShipment(waybill);
    
    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'Shipment cancelled successfully',
        data: result.data
      });
    }
    
    return res.status(400).json({
      success: false,
      message: 'Failed to cancel shipment',
      error: result.error
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

export const createPickupRequest = async (req, res) => {
  try {
    const pickupData = req.body;
    
    // Validate required fields
    const requiredFields = ['pickupLocation', 'pickupDate', 'pickupTime', 'packageCount'];
    const missingFields = requiredFields.filter(field => !pickupData[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    const result = await delhiveryService.createPickupRequest(pickupData);
    
    if (result.success) {
      return res.status(201).json({
        success: true,
        message: 'Pickup request created successfully',
        data: result.data
      });
    }
    
    return res.status(400).json({
      success: false,
      message: 'Failed to create pickup request',
      error: result.error
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

export const generateShippingLabel = async (req, res) => {
  try {
    const { waybill } = req.params;
    const { pdfSize = 'A4' } = req.query;
    
    if (!waybill) {
      return res.status(400).json({
        success: false,
        message: 'Waybill number is required'
      });
    }

    const result = await delhiveryService.generateShippingLabel(waybill, pdfSize);
    
    if (result.success) {
      res.setHeader('Content-Type', result.contentType || 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=label-${waybill}.pdf`);
      return res.send(result.data);
    }
    
    return res.status(400).json({
      success: false,
      message: 'Failed to generate shipping label',
      error: result.error
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

export const trackShipment = async (req, res) => {
  try {
    const { waybill, orderId } = req.query;
    
    if (!waybill && !orderId) {
      return res.status(400).json({
        success: false,
        message: 'Either waybill or orderId is required'
      });
    }

    const result = await delhiveryService.trackShipment(waybill, orderId);
    
    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'Tracking information fetched successfully',
        data: result.data
      });
    }
    
    return res.status(400).json({
      success: false,
      message: 'Failed to fetch tracking information',
      error: result.error
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

export const updateEwaybill = async (req, res) => {
  try {
    const { waybill } = req.params;
    const ewaybillData = req.body;
    
    if (!waybill) {
      return res.status(400).json({
        success: false,
        message: 'Waybill number is required'
      });
    }

    const result = await delhiveryService.updateEwaybill(waybill, ewaybillData);
    
    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'E-waybill updated successfully',
        data: result.data
      });
    }
    
    return res.status(400).json({
      success: false,
      message: 'Failed to update e-waybill',
      error: result.error
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

export const downloadDocument = async (req, res) => {
  try {
    const { waybill } = req.params;
    const { type = 'pod' } = req.query;
    
    if (!waybill) {
      return res.status(400).json({
        success: false,
        message: 'Waybill number is required'
      });
    }

    const result = await delhiveryService.downloadDocument(waybill, type);
    
    if (result.success) {
      res.setHeader('Content-Type', result.contentType);
      res.setHeader('Content-Disposition', `attachment; filename=${type}-${waybill}.pdf`);
      return res.send(result.data);
    }
    
    return res.status(400).json({
      success: false,
      message: 'Failed to download document',
      error: result.error
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};