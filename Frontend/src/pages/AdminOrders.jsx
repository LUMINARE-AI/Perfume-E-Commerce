import { useEffect, useState } from "react";
import { FiPackage, FiCalendar, FiSearch, FiTrash2 } from "react-icons/fi";
import api from "../api/axios";
import { useToast } from "../contexts/ToastContext";

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending", color: "text-gray-400", bgColor: "bg-gray-500/10" },
  { value: "processing", label: "Processing", color: "text-blue-400", bgColor: "bg-blue-500/10" },
  { value: "shipped", label: "Shipped", color: "text-purple-400", bgColor: "bg-purple-500/10" },
  { value: "delivered", label: "Delivered", color: "text-green-400", bgColor: "bg-green-500/10" },
  { value: "cancelled", label: "Cancelled", color: "text-red-400", bgColor: "bg-red-500/10" },
];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const { success, error: showError } = useToast();

  useEffect(() => {
    fetchOrders();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/orders");
      const ordersData = res.data.data?.orders || res.data.data || res.data.orders || [];
      if (Array.isArray(ordersData)) {
        setOrders(ordersData);
      } else {
        setOrders([]);
        showError("Invalid data format received");
      }
    } catch (err) {
      showError(err.response?.data?.message || "Failed to fetch orders");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const deleteOrder = async (orderId) => {
    if (!window.confirm("Permanently delete this cancelled order?")) return;
    try {
      await api.delete(`/orders/${orderId}`);
      setOrders((prev) => prev.filter((order) => order._id !== orderId));
      success("Order deleted successfully");
    } catch (err) {
      showError(err.response?.data?.message || "Failed to delete order");
    }
  };

  const updateStatus = async (orderId, status) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status });
      setOrders((prev) =>
        prev.map((order) =>
          order._id === orderId ? { ...order, status } : order
        )
      );
      success(`Order status updated to ${status}`);
    } catch (err) {
      showError(err.response?.data?.message || "Failed to update status");
    }
  };

  const getStatusConfig = (status) => {
    return STATUS_OPTIONS.find((s) => s.value === status) || STATUS_OPTIONS[0];
  };

  const filteredOrders = Array.isArray(orders) ? orders.filter((order) => {
    const matchesSearch =
      order._id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || order.status === filterStatus;
    return matchesSearch && matchesStatus;
  }) : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-400">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif text-white tracking-tight">
            Orders Management
          </h1>
          <p className="text-gray-400 mt-1">
            {filteredOrders.length} {filteredOrders.length === 1 ? "order" : "orders"} found
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by order ID, user name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 pl-10 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400 transition"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-white/5 border border-white/10 px-4 py-3 text-sm text-white focus:outline-none focus:border-yellow-400 transition"
        >
          <option value="all">All Statuses</option>
          {STATUS_OPTIONS.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
      </div>

      {/* Orders Table - Desktop */}
      <div className="hidden lg:block overflow-x-auto border border-white/10 bg-white/5 backdrop-blur-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-white/5 border-b border-white/10">
            <tr>
              <th className="px-6 py-4 text-left font-semibold text-gray-300">Order ID</th>
              <th className="px-6 py-4 text-left font-semibold text-gray-300">Customer</th>
              <th className="px-6 py-4 text-left font-semibold text-gray-300">Total</th>
              <th className="px-6 py-4 text-left font-semibold text-gray-300">Status</th>
              <th className="px-6 py-4 text-left font-semibold text-gray-300">Date</th>
              <th className="px-6 py-4 text-left font-semibold text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                  No orders found
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => {
                const statusConfig = getStatusConfig(order.status);
                return (
                  <tr
                    key={order._id}
                    className="border-b border-white/5 hover:bg-white/5 transition"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <FiPackage className="text-gray-400" />
                        <span className="text-xs text-gray-400 font-mono">
                          {order._id?.slice(-8)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-yellow-400/20 border border-yellow-400/30 flex items-center justify-center text-yellow-400 font-semibold">
                          {order.user?.name?.charAt(0).toUpperCase() || "?"}
                        </div>
                        <div>
                          <p className="text-white font-medium">{order.user?.name || "Unknown"}</p>
                          <p className="text-xs text-gray-400">{order.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-yellow-400 font-semibold">
                        ₹{order.totalPrice?.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={order.status}
                        onChange={(e) => updateStatus(order._id, e.target.value)}
                        className={`
                          bg-black/50 border px-3 py-1.5 text-xs font-medium
                          focus:outline-none focus:border-yellow-400 transition
                          ${statusConfig.color} ${statusConfig.bgColor} border-${statusConfig.color.replace("text-", "")}/30
                        `}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 text-gray-400">
                      <div className="flex items-center gap-2">
                        <FiCalendar className="text-gray-500" />
                        {new Date(order.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    {/* ✅ Delete Action */}
                    <td className="px-6 py-4">
                      {order.status === "cancelled" ? (
                        <button
                          onClick={() => deleteOrder(order._id)}
                          className="flex items-center gap-1.5 text-xs text-red-400 border border-red-400/30 px-3 py-1.5 hover:bg-red-500/10 transition"
                        >
                          <FiTrash2 size={12} />
                          Delete
                        </button>
                      ) : (
                        <span className="text-xs text-gray-600">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Orders Cards - Mobile */}
      <div className="lg:hidden space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="border border-white/10 bg-white/5 p-8 text-center">
            <p className="text-gray-400">No orders found</p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const statusConfig = getStatusConfig(order.status);
            return (
              <div
                key={order._id}
                className="border border-white/10 bg-white/5 backdrop-blur-sm p-4 space-y-3 hover:border-yellow-400/50 transition"
              >
                {/* Order Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <FiPackage className="text-gray-400 shrink-0" />
                    <span className="text-xs text-gray-400 font-mono">
                      {order._id?.slice(-8)}
                    </span>
                  </div>
                  <span className={`px-2 py-1 text-xs ${statusConfig.bgColor} ${statusConfig.color} border border-${statusConfig.color.replace("text-", "")}/30`}>
                    {statusConfig.label}
                  </span>
                </div>

                {/* Customer Info */}
                <div className="flex items-center gap-3 pt-2 border-t border-white/5">
                  <div className="w-10 h-10 rounded-full bg-yellow-400/20 border border-yellow-400/30 flex items-center justify-center text-yellow-400 font-semibold shrink-0">
                    {order.user?.name?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{order.user?.name || "Unknown"}</p>
                    <p className="text-xs text-gray-400 truncate">{order.user?.email}</p>
                  </div>
                </div>

                {/* Order Details */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/5">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Total Amount</p>
                    <p className="text-yellow-400 font-semibold">₹{order.totalPrice?.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Order Date</p>
                    <p className="text-white text-sm">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Status Update */}
                <div className="pt-2 border-t border-white/5">
                  <label className="text-xs text-gray-400 block mb-2">Update Status</label>
                  <select
                    value={order.status}
                    onChange={(e) => updateStatus(order._id, e.target.value)}
                    className="w-full bg-black/50 border border-white/20 px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-400 transition"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* ✅ Delete Button - Mobile */}
                {order.status === "cancelled" && (
                  <div className="pt-2 border-t border-white/5">
                    <button
                      onClick={() => deleteOrder(order._id)}
                      className="w-full flex items-center justify-center gap-2 text-sm text-red-400 border border-red-400/30 px-3 py-2 hover:bg-red-500/10 transition"
                    >
                      <FiTrash2 size={14} />
                      Delete Order
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Summary Stats */}
      {orders.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          {STATUS_OPTIONS.map((status) => {
            const count = orders.filter((o) => o.status === status.value).length;
            return (
              <div key={status.value} className={`border border-white/10 ${status.bgColor} p-4`}>
                <p className="text-xs text-gray-400 mb-1">{status.label}</p>
                <p className={`text-2xl font-bold ${status.color}`}>{count}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}