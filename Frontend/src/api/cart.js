// src/api/cart.js
import api from "./axios";

export const addToCartApi = (productId, quantity) => {
  return api.post("/cart", {
    productId,
    quantity,
  });
};

export const getCartApi = () => api.get("/cart");
export const updateCartItemApi = (productId, quantity) =>
  api.put("/cart", { productId, quantity });
export const removeCartItemApi = (productId) =>
  api.delete(`/cart/${productId}`);