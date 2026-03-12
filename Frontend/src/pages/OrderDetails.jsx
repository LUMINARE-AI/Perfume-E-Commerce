import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/axios";
import Button from "../components/ui/Button";
import { useToast } from "../contexts/ToastContext";
import {
  FiPackage,
  FiMapPin,
  FiCreditCard,
  FiTruck,
  FiDownload,
  FiAlertCircle,
  FiExternalLink,
  FiArrowLeft,
  FiX,
} from "react-icons/fi";
import { downloadDocument, downloadFile } from "../api/delhivery";

export default function OrderDetails() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [customReason, setCustomReason] = useState("");

  const toast = useToast();

  const fetchOrder = async () => {
    try {
      const res = await api.get(`/orders/${id}`);
      setOrder(res.data.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load order");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleDownloadInvoice = async () => {
    try {
      if (!order?.isPaid && !order?.delivery?.awb) {
        toast.info("Invoice not available yet");
        return;
      }

      setDownloading(true);
      const res = await downloadDocument(order.delivery.awb, "invoice");
      downloadFile(res.data, `invoice-${order.delivery.awb}.pdf`);
      toast.success("Invoice downloaded successfully");
    } catch (error) {
      console.error("Invoice download error:", error);
      toast.error("Failed to download invoice");
    } finally {
      setDownloading(false);
    }
  };

  const cancelOrder = async () => {
    const finalReason =
      cancelReason === "Other" ? customReason.trim() : cancelReason;

    if (!finalReason) {
      toast.info("Please select or enter a cancellation reason");
      return;
    }

    try {
      setCancelling(true);

      // minimum 2.5s loading feel
      const [res] = await Promise.all([
        api.put(`/orders/${order._id}/cancel`, { reason: finalReason }),
        new Promise((resolve) => setTimeout(resolve, 2500)),
      ]);

      const { refund } = res.data.data;

      setShowCancelModal(false);
      setCancelReason("");
      setCustomReason("");

      if (refund) {
        toast.success(
          `Order cancelled! Refund of ₹${refund.amount.toLocaleString()} initiated — reflects in 5–7 business days.`,
        );
      } else {
        toast.success("Order cancelled successfully");
      }

      fetchOrder();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to cancel order");
    } finally {
      setCancelling(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
      processing: "text-blue-400 bg-blue-400/10 border-blue-400/30",
      shipped: "text-purple-400 bg-purple-400/10 border-purple-400/30",
      delivered: "text-green-400 bg-green-400/10 border-green-400/30",
      cancelled: "text-red-400 bg-red-400/10 border-red-400/30",
    };
    return colors[status] || colors.pending;
  };

  if (loading) {
    return (
      <div className="bg-black min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-white">Loading order...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bg-black min-h-screen flex items-center justify-center">
        <div className="text-center text-white">
          <FiAlertCircle className="text-red-400 text-5xl mx-auto mb-4" />
          <p className="text-red-400 text-lg mb-4">Order not found</p>
          <Link to="/my-orders">
            <Button>Back to Orders</Button>
          </Link>
        </div>
      </div>
    );
  }

  const canCancel = ["pending", "processing"].includes(order.status);

  return (
    <main className="bg-black min-h-screen pt-20 pb-12">
      <div className="max-w-4xl mx-auto px-4 md:px-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            to="/my-orders"
            className="p-2 hover:bg-white/5 rounded transition"
          >
            <FiArrowLeft className="text-white" size={20} />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-serif text-white">
              Order Details
            </h1>
            <p className="text-gray-400 text-sm">Order ID: {order._id}</p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}
          >
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </span>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Order Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 md:p-6">
              <div className="flex items-center gap-2 mb-4">
                <FiPackage className="text-yellow-400" size={20} />
                <h2 className="text-white font-semibold text-lg">
                  Order Items
                </h2>
              </div>
              <div className="space-y-4">
                {order.items.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 p-3 bg-white/5 border border-white/5 rounded hover:border-white/10 transition"
                  >
                    <div className="flex-1">
                      <p className="text-white font-medium">{item.name}</p>
                      <p className="text-gray-400 text-sm">
                        ₹{item.price.toLocaleString()} × {item.qty}
                      </p>
                    </div>
                    <p className="text-yellow-400 font-semibold">
                      ₹{(item.price * item.qty).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 md:p-6">
              <div className="flex items-center gap-2 mb-4">
                <FiMapPin className="text-yellow-400" size={20} />
                <h2 className="text-white font-semibold text-lg">
                  Shipping Address
                </h2>
              </div>
              <div className="text-gray-300 space-y-1">
                <p className="font-medium text-white">
                  {order.shippingAddress.name}
                </p>
                <p className="text-sm">{order.shippingAddress.address}</p>
                <p className="text-sm">
                  {order.shippingAddress.city}, {order.shippingAddress.state} -{" "}
                  {order.shippingAddress.pincode}
                </p>
                <p className="text-sm">Phone: {order.shippingAddress.phone}</p>
              </div>
            </div>

            {/* Delivery Tracking */}
            {order.delivery?.awb && order.status !== "cancelled" && (
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 md:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FiTruck className="text-yellow-400" size={20} />
                  <h2 className="text-white font-semibold text-lg">
                    Delivery Tracking
                  </h2>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Courier Partner</span>
                    <span className="text-white">
                      {order.delivery.provider || "Delhivery"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Tracking Number</span>
                    <span className="text-white font-mono">
                      {order.delivery.awb}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Delivery Status</span>
                    <span className="text-white capitalize">
                      {order.delivery.status || "Processing"}
                    </span>
                  </div>
                  {order.delivery.trackingUrl && (
                    <a
                      href={order.delivery.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 mt-3 px-4 py-2 bg-blue-500/20 border border-blue-400/30 text-blue-400 hover:bg-blue-500/30 transition rounded"
                    >
                      <FiExternalLink size={16} />
                      Track Order
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <h2 className="text-white font-semibold mb-3">Order Timeline</h2>

            <div className="flex items-center justify-between text-xs">
              <div className="text-yellow-400">Order Placed</div>
              <div
                className={
                  order.status !== "pending"
                    ? "text-yellow-400"
                    : "text-gray-500"
                }
              >
                Processing
              </div>
              <div
                className={
                  order.status === "shipped" || order.status === "delivered"
                    ? "text-yellow-400"
                    : "text-gray-500"
                }
              >
                Shipped
              </div>
              <div
                className={
                  order.status === "delivered"
                    ? "text-yellow-400"
                    : "text-gray-500"
                }
              >
                Delivered
              </div>
            </div>
          </div>

          {/* Right Column - Summary */}
          <div className="space-y-6">
            {/* Payment Info */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 md:p-6">
              <div className="flex items-center gap-2 mb-4">
                <FiCreditCard className="text-yellow-400" size={20} />
                <h2 className="text-white font-semibold">Payment</h2>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Method</span>
                  <span className="text-white font-medium">
                    {order.paymentMethod.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Status</span>
                  <span
                    className={
                      order.isPaid ? "text-green-400" : "text-yellow-400"
                    }
                  >
                    {order.isPaid ? "Paid" : "Unpaid"}
                  </span>
                </div>
              </div>
            </div>

            {order.refund && (
              <div className="bg-green-400/10 border border-green-400/20 rounded p-3 mt-3">
                <p className="text-green-400 text-sm font-medium">
                  Refund Initiated
                </p>
                <p className="text-gray-300 text-xs mt-1">
                  ₹{order.refund.amount.toLocaleString()} will reflect in your
                  account within 5–7 business days.
                </p>
              </div>
            )}

            {/* Price Summary */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 md:p-6">
              <h2 className="text-white font-semibold mb-4">Order Summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-300">
                  <span>Subtotal</span>
                  <span>₹{order.itemsPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Shipping</span>
                  <span>₹{order.shippingPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Tax</span>
                  <span>₹{order.taxPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-white pt-3 border-t border-white/10">
                  <span>Total</span>
                  <span className="text-yellow-400">
                    ₹{order.totalPrice.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={handleDownloadInvoice}
                disabled={downloading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-yellow-400 text-black font-medium rounded hover:bg-yellow-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiDownload size={18} />
                {downloading ? "Downloading..." : "Download Invoice"}
              </button>

              {canCancel && order.status !== "cancelled" && (
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/20 border border-red-400/30 text-red-400 font-medium rounded hover:bg-red-500/30 transition"
                >
                  <FiX size={18} />
                  Cancel Order
                </button>
              )}

              <Link to="/my-orders" className="block">
                <Button variant="outline" className="w-full">
                  Back to My Orders
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4">
          <div className="bg-zinc-900 border border-white/10 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-white font-semibold text-lg mb-1">
              Cancel Order
            </h2>
            <p className="text-gray-400 text-sm mb-3">
              Why do you want to cancel this order?
            </p>

            {order.isPaid && (
              <div className="flex items-start gap-2 bg-yellow-400/10 border border-yellow-400/20 rounded p-3 mb-4">
                <FiAlertCircle
                  className="text-yellow-400 mt-0.5 shrink-0"
                  size={16}
                />
                <p className="text-yellow-400 text-xs">
                  This is a prepaid order. A full refund of{" "}
                  <strong>₹{order.totalPrice.toLocaleString()}</strong> will be
                  initiated to your original payment method within 5–7 business
                  days.
                </p>
              </div>
            )}

            <div className="space-y-2 mb-4">
              {[
                "Changed my mind",
                "Ordered by mistake",
                "Found a better price elsewhere",
                "Delivery time is too long",
                "Other",
              ].map((r) => (
                <label
                  key={r}
                  className={`flex items-center gap-3 p-3 rounded border cursor-pointer transition ${
                    cancelReason === r
                      ? "border-red-400/50 bg-red-400/10"
                      : "border-white/10 hover:border-white/20 bg-white/5"
                  }`}
                >
                  <input
                    type="radio"
                    name="cancelReason"
                    value={r}
                    checked={cancelReason === r}
                    onChange={() => setCancelReason(r)}
                    className="accent-red-400"
                  />
                  <span className="text-gray-300 text-sm">{r}</span>
                </label>
              ))}
            </div>

            {cancelReason === "Other" && (
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Please describe your reason..."
                className="w-full bg-white/5 border border-white/10 text-white text-sm rounded p-3 mb-4 resize-none focus:outline-none focus:border-white/30"
                rows={3}
              />
            )}

            <div className="flex gap-3 mt-2">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason("");
                  setCustomReason("");
                }}
                className="flex-1 py-2.5 border border-white/10 text-gray-300 rounded-lg hover:bg-white/5 transition text-sm"
              >
                Go Back
              </button>
              <button
                onClick={cancelOrder}
                disabled={
                  cancelling ||
                  !cancelReason ||
                  (cancelReason === "Other" && !customReason.trim())
                }
                className="flex-1 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {cancelling ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8z"
                      />
                    </svg>
                    Cancelling...
                  </span>
                ) : (
                  "Confirm Cancel"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
