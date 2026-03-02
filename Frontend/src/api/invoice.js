// Frontend/src/api/invoice.js

import axios from './axios';

/**
 * Download Invoice PDF
 */
export const downloadInvoice = async (orderId) => {
  return axios.get(`/invoices/${orderId}`, {
    responseType: 'blob'
  });
};

/**
 * Helper to trigger download
 */
export const downloadInvoiceFile = async (orderId) => {
  try {
    const response = await downloadInvoice(orderId);
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `invoice-${orderId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Invoice download failed:', error);
    throw error;
  }
};