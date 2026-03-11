import api from "./axios";

export const createRazorpayOrderApi = (orderId) => {
  return api.post("/razorpay/create-order", { orderId });
};

export const verifyRazorpayPaymentApi = (data) => {
  return api.post("/razorpay/verify-payment", data);
};