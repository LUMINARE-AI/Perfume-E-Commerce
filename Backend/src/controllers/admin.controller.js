import {User} from "../models/user.model.js";
import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const getDashboardStats = asyncHandler(async (req, res) => {
  const totalUsers = await User.countDocuments();
  const totalOrders = await Order.countDocuments();
  const totalProducts = await Product.countDocuments();

  const totalRevenueAgg = await Order.aggregate([
    { $group: { _id: null, total: { $sum: "$totalPrice" } } }
  ]);

  const totalRevenue = totalRevenueAgg[0]?.total || 0;

  return res.status(200).json(
    new ApiResponse(200, {
      totalUsers,
      totalOrders,
      totalProducts,
      totalRevenue,
    }, "Admin stats fetched")
  );
});

export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select("-password");
  return res.status(200).json(
    new ApiResponse(200, users, "All users fetched")
  );
});
