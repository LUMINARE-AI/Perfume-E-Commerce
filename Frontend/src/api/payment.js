import api from "./axios";

export const createRazorpayOrderApi = ({ shippingAddress, shippingFee }) => {
  return api.post("/razorpay/create-order", { shippingAddress, shippingFee });
};

export const verifyRazorpayPaymentApi = (data) => {
  return api.post("/razorpay/verify-payment", data);
};