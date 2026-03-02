// Frontend/src/api/orders.js
import api from "./axios";

export const createOrderApi = (orderData) => {
  return api.post("/orders", orderData);
};

export const getMyOrdersApi = () => api.get("/orders/my");

export const getOrderByIdApi = (id) => api.get(`/orders/${id}`);

export const cancelOrderApi = (id) => api.put(`/orders/${id}/cancel`);

export const deleteOrderApi = (id) => api.delete(`/orders/${id}`); // 🆕
