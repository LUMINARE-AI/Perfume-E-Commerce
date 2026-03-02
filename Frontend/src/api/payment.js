import api from "./axios";

export const createRazorpayOrderApi = (amount) => {
  return api.post("/razorpay/create-order", { amount });
};

export const verifyRazorpayPaymentApi = (data) => {
  return api.post("/razorpay/verify-payment", data);
};