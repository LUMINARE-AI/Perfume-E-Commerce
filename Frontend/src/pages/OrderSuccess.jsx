import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getOrderByIdApi } from "../api/orders";
import { getTAT } from "../api/delhivery";
import { downloadDocument, downloadFile } from "../api/delhivery";
import Button from "../components/ui/Button";
import {
  FiCheckCircle,
  FiPackage,
  FiMapPin,
  FiCreditCard,
  FiDownload,
  FiTruck,
  FiExternalLink,
  FiClock,
  FiAlertCircle,
  FiCalendar,
} from "react-icons/fi";

export default function OrderSuccess() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [invoiceMsg, setInvoiceMsg] = useState("");
  const [expectedDelivery, setExpectedDelivery] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await getOrderByIdApi(id);
        const fetchedOrder = res.data.data;
        setOrder(fetchedOrder);

        // ── Fetch TAT (expected delivery days) from Delhivery ──
        if (fetchedOrder?.shippingAddress?.pincode) {
          try {
            const tatRes = await getTAT(
              import.meta.env.VITE_WAREHOUSE_PINCODE || "304001",
              fetchedOrder.shippingAddress.pincode,
              "S",
            );
            const tatData = tatRes.data?.data;
            const tatDays =
              tatData?.tat ||
              tatData?.tatDays ||
              tatData?.expected_delivery_days ||
              null;

            if (tatDays) {
              const d = new Date();
              d.setDate(d.getDate() + Number(tatDays));
              setExpectedDelivery(
                d.toLocaleDateString("en-IN", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                }),
              );
            }
          } catch {
            // TAT silently fails — not critical
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  const handleDownloadInvoice = async () => {
    try {
      if (!order?.delivery?.awb) {
        setInvoiceMsg("error"); // AWB nahi hai toh invoice nahi milega
        setTimeout(() => setInvoiceMsg(""), 4000);
        return;
      }

      setDownloading(true);
      setInvoiceMsg("");

      const res = await downloadDocument(order.delivery.awb, "invoice");
      downloadFile(res.data, `invoice-${order.delivery.awb}.pdf`);

      setInvoiceMsg("success");
    } catch (error) {
      console.error("Invoice download error:", error);
      setInvoiceMsg("error");
    } finally {
      setDownloading(false);
      setTimeout(() => setInvoiceMsg(""), 4000);
    }
  };

  if (loading) {
    return (
      <div className="bg-black min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4" />
          <p className="text-white">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bg-black min-h-screen flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">Order not found</p>
          <Link to="/">
            <Button>Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const STATUS_STYLES = {
    pending: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
    processing: "text-blue-400 bg-blue-400/10 border-blue-400/30",
    shipped: "text-purple-400 bg-purple-400/10 border-purple-400/30",
    delivered: "text-green-400 bg-green-400/10 border-green-400/30",
    cancelled: "text-red-400 bg-red-400/10 border-red-400/30",
  };

  const isPrepaid = order.paymentMethod === "PREPAID";
  const hasAWB = !!order.delivery?.awb;
  const deliveryFailed = order.delivery?.status === "failed";

  return (
    <main className="bg-black min-h-screen pt-20 pb-12">
      <div className="max-w-4xl mx-auto px-4 md:px-6">
        {/* ── Success Header ── */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full bg-green-400/20 border-2 border-green-400 mb-4">
            <FiCheckCircle className="text-green-400 text-3xl md:text-4xl" />
          </div>
          <h1 className="text-2xl md:text-3xl font-serif text-white mb-2">
            Order Placed Successfully! 🎉
          </h1>
          <p className="text-gray-400 text-sm md:text-base">
            Thank you for your order. We'll send you a confirmation email
            shortly.
          </p>

          {/* ── Expected Delivery Banner ── */}
          {expectedDelivery && order.status !== "cancelled" && (
            <div className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 text-sm">
              <FiCalendar size={15} />
              <span>
                Expected delivery by <strong>{expectedDelivery}</strong>
              </span>
            </div>
          )}
        </div>

        {/* ── Main Card ── */}
        <div className="bg-white/5 border border-white/10 backdrop-blur-sm overflow-hidden mb-6">
          {/* Order ID + Status */}
          <div className="bg-white/5 border-b border-white/10 px-4 md:px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-xs text-gray-400 mb-1">Order ID</p>
                <p className="text-white font-mono text-sm">{order._id}</p>
              </div>
              <span
                className={`inline-flex items-center px-3 py-1 text-xs font-medium border ${STATUS_STYLES[order.status] || STATUS_STYLES.pending}`}
              >
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
            </div>
          </div>

          {/* Order Items */}
          <div className="px-4 md:px-6 py-4 border-b border-white/10">
            <div className="flex items-center gap-2 mb-4">
              <FiPackage className="text-yellow-400" size={18} />
              <h2 className="text-white font-semibold">Order Items</h2>
            </div>
            <div className="space-y-3">
              {order.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-4"
                >
                  <div className="flex-1">
                    <p className="text-white text-sm">{item.name}</p>
                    <p className="text-gray-400 text-xs">Qty: {item.qty}</p>
                  </div>
                  <p className="text-yellow-400 font-semibold text-sm">
                    ₹{(item.price * item.qty).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="px-4 md:px-6 py-4 border-b border-white/10">
            <div className="flex items-center gap-2 mb-3">
              <FiMapPin className="text-yellow-400" size={18} />
              <h2 className="text-white font-semibold">Shipping Address</h2>
            </div>
            <div className="text-gray-300 text-sm space-y-1">
              <p className="font-medium text-white">
                {order.shippingAddress.name}
              </p>
              <p>{order.shippingAddress.address}</p>
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.state} —{" "}
                {order.shippingAddress.pincode}
              </p>
              <p>Phone: {order.shippingAddress.phone}</p>
            </div>
          </div>

          {/* Payment Info */}
          <div className="px-4 md:px-6 py-4 border-b border-white/10">
            <div className="flex items-center gap-2 mb-3">
              <FiCreditCard className="text-yellow-400" size={18} />
              <h2 className="text-white font-semibold">Payment Information</h2>
            </div>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-gray-400 text-xs mb-1">Payment Method</p>
                <p className="text-white font-medium">{order.paymentMethod}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-400 text-xs mb-1">Payment Status</p>
                <p
                  className={`font-medium ${order.isPaid ? "text-green-400" : "text-yellow-400"}`}
                >
                  {order.isPaid
                    ? "Paid"
                    : isPrepaid
                      ? "Pending Verification"
                      : "Pay on Delivery"}
                </p>
              </div>
            </div>
          </div>

          {/* ── Delivery Info ── */}
          <div className="px-4 md:px-6 py-4 border-b border-white/10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FiTruck className="text-yellow-400" size={18} />
                <h2 className="text-white font-semibold">
                  Delivery Information
                </h2>
              </div>
              {/* Expected date — compact inline if AWB available */}
              {expectedDelivery && hasAWB && (
                <span className="flex items-center gap-1.5 text-xs text-yellow-400">
                  <FiCalendar size={12} />
                  By {expectedDelivery}
                </span>
              )}
            </div>

            {/* AWB available */}
            {hasAWB && (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Courier Partner</span>
                  <span className="text-white capitalize">
                    {order.delivery.provider || "Delhivery"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Tracking Number (AWB)</span>
                  <span className="text-white font-mono">
                    {order.delivery.awb}
                  </span>
                </div>
                {order.delivery.trackingUrl && (
                  <a
                    href={order.delivery.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 mt-3 px-4 py-2.5 bg-blue-500/10 border border-blue-400/30 text-blue-400 hover:bg-blue-500/20 transition text-sm"
                  >
                    <FiExternalLink size={15} />
                    Track Your Shipment
                  </a>
                )}
              </div>
            )}

            {/* PREPAID — shipment will be created by admin */}
            {!hasAWB && isPrepaid && !deliveryFailed && (
              <div className="flex items-start gap-3 p-3 bg-blue-400/5 border border-blue-400/20 text-sm">
                <FiClock className="text-blue-400 mt-0.5 shrink-0" size={16} />
                <div>
                  <p className="text-white font-medium">
                    Shipment being prepared
                  </p>
                  <p className="text-gray-400 text-xs mt-0.5">
                    Your payment was successful. Our team will create a shipment
                    and you'll receive tracking details via email within 24
                    hours.
                    {expectedDelivery && (
                      <span className="block mt-1 text-yellow-400">
                        📦 Expected delivery by {expectedDelivery}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* COD — shipment creation failed */}
            {!hasAWB && !isPrepaid && deliveryFailed && (
              <div className="flex items-start gap-3 p-3 bg-yellow-400/5 border border-yellow-400/20 text-sm">
                <FiAlertCircle
                  className="text-yellow-400 mt-0.5 shrink-0"
                  size={16}
                />
                <div>
                  <p className="text-white font-medium">Shipment scheduled</p>
                  <p className="text-gray-400 text-xs mt-0.5">
                    Your order is confirmed. Tracking details will be shared
                    once the shipment is dispatched.
                    {expectedDelivery && (
                      <span className="block mt-1 text-yellow-400">
                        📦 Expected delivery by {expectedDelivery}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* Fallback */}
            {!hasAWB && !deliveryFailed && !isPrepaid && (
              <div className="flex items-start gap-3 p-3 bg-white/5 border border-white/10 text-sm">
                <FiClock className="text-gray-400 mt-0.5 shrink-0" size={16} />
                <p className="text-gray-400 text-xs">
                  Tracking details will be available once your order is
                  dispatched.
                  {expectedDelivery && (
                    <span className="block mt-1 text-yellow-400">
                      📦 Expected delivery by {expectedDelivery}
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Price Breakdown */}
          <div className="px-4 md:px-6 py-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-300">
                <span>Subtotal</span>
                <span>₹{order.itemsPrice?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Shipping (Delhivery)</span>
                <span>
                  {order.shippingPrice === 0 ? (
                    <span className="text-green-400">Free</span>
                  ) : (
                    `₹${order.shippingPrice?.toLocaleString()}`
                  )}
                </span>
              </div>
              {order.taxPrice > 0 && (
                <div className="flex justify-between text-gray-300">
                  <span>Tax</span>
                  <span>₹{order.taxPrice?.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold text-white pt-2 border-t border-white/10">
                <span>Total</span>
                <span className="text-yellow-400">
                  ₹{order.totalPrice?.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Action Buttons ── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <button
            onClick={handleDownloadInvoice}
            disabled={downloading}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-yellow-400 text-black font-medium hover:bg-yellow-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiDownload size={18} />
            {downloading ? "Downloading..." : "Download Invoice"}
          </button>
          <Link to="/my-orders" className="flex-1">
            <Button variant="outline" className="w-full">
              View All Orders
            </Button>
          </Link>
        </div>

        {/* Invoice feedback */}
        {invoiceMsg === "success" && (
          <div className="flex items-center gap-2 px-4 py-3 mb-4 bg-green-400/10 border border-green-400/30 text-green-400 text-sm">
            <FiCheckCircle size={15} />
            Invoice downloaded successfully!
          </div>
        )}
        {invoiceMsg === "error" && (
          <div className="flex items-center gap-2 px-4 py-3 mb-4 bg-red-400/10 border border-red-400/30 text-red-400 text-sm">
            <FiAlertCircle size={15} />
            Failed to download invoice. Please try again.
          </div>
        )}

        {/* Help */}
        <div className="text-center text-gray-400 text-sm">
          Need help? Contact us at{" "}
          <span className="text-yellow-400">support@binkhalid.com</span>
        </div>
      </div>
    </main>
  );
}
