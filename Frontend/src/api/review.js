import api from "./axios";

export const addReviewApi = (data) => api.post("/reviews", data);
export const getProductReviewsApi = (productId) =>
  api.get(`/reviews/product/${productId}`);
export const getAllReviewsApi = () => api.get("/reviews/admin");
export const deleteReviewApi = (id) => api.delete(`/reviews/${id}`);
