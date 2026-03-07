import { useEffect, useState, useCallback } from "react";
import api from "../api/axios";
import {
  createShipment,
  createPickupRequest,
  generateShippingLabel,
  trackShipment,
  downloadFile,
} from "../api/delhivery";
import {
  FiPackage,
  FiTruck,
  FiDownload,
  FiRefreshCw,
  FiExternalLink,
  FiMapPin,
  FiChevronDown,
  FiChevronUp,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiX,
} from "react-icons/fi";

// ── Status badge ──────────────────────────────────────────────
const STATUS_STYLES = {
  pending:    "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
  processing: "text-blue-400 bg-blue-400/10 border-blue-400/30",
  shipped:    "text-purple-400 bg-purple-400/10 border-purple-400/30",
  delivered:  "text-green-400 bg-green-400/10 border-green-400/30",
  cancelled:  "text-red-400 bg-red-400/10 border-red-400/30",
};

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

function Badge({ status }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 text-[11px] font-medium border ${STATUS_STYLES[status] || STATUS_STYLES.pending}`}>
      {cap(status)}
    </span>
  );
}

// ── Toast ─────────────────────────────────────────────────────
function Toast({ msg, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 border shadow-xl text-sm animate-slideUp
      ${type === "success" ? "bg-zinc-900 border-green-400/40 text-green-400" : "bg-zinc-900 border-red-400/40 text-red-400"}`}>
      {type === "success" ? <FiCheckCircle size={16} /> : <FiAlertCircle size={16} />}
      <span className="text-white">{msg}</span>
      <button onClick={onClose} className="ml-2 opacity-50 hover:opacity-100"><FiX size={14} /></button>
    </div>
  );
}

// ── Tracking drawer ───────────────────────────────────────────
function TrackingDrawer({ order, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await trackShipment(order.delivery?.awb, order._id);
        setData(res.data?.data || res.data);
      } catch (e) {
        setErr(e?.response?.data?.message || "Failed to fetch tracking");
      } finally {
        setLoading(false);
      }
    })();
  }, [order]);

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-zinc-950 border border-white/10 shadow-2xl mx-4 mb-0 md:mb-auto max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div>
            <h3 className="text-white font-medium">Shipment Tracking</h3>
            {order.delivery?.awb && (
              <p className="text-xs text-gray-400 font-mono mt-0.5">AWB: {order.delivery.awb}</p>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <FiX size={20} />
          </button>
        </div>

        <div className="p-5">
          {loading && (
            <div className="flex items-center justify-center py-10">
              <div className="w-8 h-8 border-2 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin" />
            </div>
          )}
          {err && <p className="text-red-400 text-sm text-center py-6">{err}</p>}
          {data && !loading && (
            <>
              {/* Current status */}
              <div className="mb-5 p-4 bg-white/5 border border-white/10">
                <p className="text-xs text-gray-400 mb-1">Current Status</p>
                <p className="text-yellow-400 font-medium">{data.Status || data.status || "In Transit"}</p>
                {data.StatusDateTime && (
                  <p className="text-xs text-gray-400 mt-1">{data.StatusDateTime}</p>
                )}
              </div>

              {/* Scans timeline */}
              {data.Scans?.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Timeline</p>
                  {data.Scans.map((scan, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-2 h-2 rounded-full mt-1 ${i === 0 ? "bg-yellow-400" : "bg-white/20"}`} />
                        {i < data.Scans.length - 1 && <div className="w-px flex-1 bg-white/10 mt-1" />}
                      </div>
                      <div className="pb-3">
                        <p className="text-white text-sm">{scan.ScanDetail?.Instructions || scan.ScanDetail?.Scan}</p>
                        <p className="text-gray-400 text-xs mt-0.5">{scan.ScanDetail?.ScannedLocation} · {scan.ScanDetail?.ScanDateTime}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tracking link */}
              {order.delivery?.trackingUrl && (
                <a
                  href={order.delivery.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 mt-4 px-4 py-2.5 border border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/10 transition text-sm"
                >
                  <FiExternalLink size={14} />
                  Track on Delhivery
                </a>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Order Row ─────────────────────────────────────────────────
function OrderRow({ order, onToast }) {
  const [expanded, setExpanded]         = useState(false);
  const [status, setStatus]             = useState(order.status);
  const [statusLoading, setStatusLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState("");
  const [showTracking, setShowTracking] = useState(false);
  const [delivery, setDelivery]         = useState(order.delivery || {});

  const hasAWB = !!delivery?.awb;
  const isPrepaid = order.paymentMethod === "PREPAID";

  // ── Update order status ────────────────────────────────────
  const handleStatusChange = async (newStatus) => {
    try {
      setStatusLoading(true);
      await api.put(`/orders/${order._id}/status`, { status: newStatus });
      setStatus(newStatus);
      onToast(`Status updated to ${cap(newStatus)}`, "success");
    } catch (e) {
      onToast(e?.response?.data?.message || "Status update failed", "error");
    } finally {
      setStatusLoading(false);
    }
  };

  // ── Create Delhivery shipment (for PREPAID orders) ─────────
  const handleCreateShipment = async () => {
    try {
      setActionLoading("shipment");
      const res = await createShipment({
        customerName: order.shippingAddress.name,
        customerAddress: order.shippingAddress.address,
        customerPincode: order.shippingAddress.pincode,
        customerCity: order.shippingAddress.city,
        customerState: order.shippingAddress.state,
        customerCountry: order.shippingAddress.country || "India",
        customerPhone: order.shippingAddress.phone,
        orderNumber: order._id.toString(),
        paymentMode: "Pre-paid",
        productDescription: order.items.map((i) => i.name).join(", "),
        codAmount: 0,
        totalAmount: order.totalPrice,
        quantity: order.items.reduce((s, i) => s + i.qty, 0),
        weight: 500,
        pickupLocationName: import.meta.env.VITE_DELHIVERY_PICKUP_LOCATION || "Main Warehouse",
      });

      const awb =
        res.data?.data?.packages?.[0]?.waybill ||
        res.data?.data?.waybill ||
        null;

      if (awb) {
        // Save AWB to order on backend
        await api.put(`/orders/${order._id}/delivery`, {
          awb,
          provider: "delhivery",
          status: "pending",
          trackingUrl: `https://www.delhivery.com/track/package/${awb}`,
        });
        setDelivery({ awb, provider: "delhivery", status: "pending", trackingUrl: `https://www.delhivery.com/track/package/${awb}` });
        onToast(`Shipment created! AWB: ${awb}`, "success");
      } else {
        onToast("Shipment created but AWB not received", "error");
      }
    } catch (e) {
      onToast(e?.response?.data?.message || "Shipment creation failed", "error");
    } finally {
      setActionLoading("");
    }
  };

  // ── Pickup request ─────────────────────────────────────────
  const handlePickup = async () => {
    if (!hasAWB) return onToast("Create shipment first to get AWB", "error");
    try {
      setActionLoading("pickup");
      await createPickupRequest({
        pickup_location: import.meta.env.VITE_DELHIVERY_PICKUP_LOCATION || "Main Warehouse",
        expected_package_count: order.items.reduce((s, i) => s + i.qty, 0),
        waybills: [delivery.awb],
      });
      onToast("Pickup request submitted!", "success");
    } catch (e) {
      onToast(e?.response?.data?.message || "Pickup request failed", "error");
    } finally {
      setActionLoading("");
    }
  };

  // ── Download label ─────────────────────────────────────────
  const handleLabel = async () => {
    if (!hasAWB) return onToast("No AWB — create shipment first", "error");
    try {
      setActionLoading("label");
      const res = await generateShippingLabel(delivery.awb, "A4");
      downloadFile(res.data, `label-${delivery.awb}.pdf`);
      onToast("Label downloaded!", "success");
    } catch (e) {
      console.error(e);
      onToast("Label download failed", "error");
    } finally {
      setActionLoading("");
    }
  };

  const btnBase = "flex items-center gap-1.5 px-3 py-1.5 text-xs border transition disabled:opacity-40 disabled:cursor-not-allowed";

  return (
    <>
      {/* ── Row ── */}
      <div className="border border-white/10 bg-white/2 hover:bg-white/4 transition">
        {/* Summary line */}
        <div
          className="flex flex-wrap items-center gap-3 px-4 py-3 cursor-pointer select-none"
          onClick={() => setExpanded((p) => !p)}
        >
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-mono truncate">{order._id}</p>
            <p className="text-gray-400 text-[11px] mt-0.5">
              {order.user?.name || "—"} · {new Date(order.createdAt).toLocaleDateString("en-IN")}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Badge status={status} />
            <span className="text-yellow-400 text-sm font-semibold">
              ₹{order.totalPrice?.toLocaleString()}
            </span>
            <span className={`text-[10px] px-2 py-0.5 border ${isPrepaid ? "border-blue-400/30 text-blue-400" : "border-orange-400/30 text-orange-400"}`}>
              {order.paymentMethod}
            </span>
            {hasAWB && (
              <span className="text-[10px] text-green-400 flex items-center gap-1">
                <FiCheckCircle size={10} /> AWB
              </span>
            )}
            {expanded ? <FiChevronUp size={14} className="text-gray-400" /> : <FiChevronDown size={14} className="text-gray-400" />}
          </div>
        </div>

        {/* ── Expanded detail ── */}
        {expanded && (
          <div className="border-t border-white/10 px-4 py-4 space-y-5">
            {/* Items */}
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Items</p>
              <div className="space-y-1.5">
                {order.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-gray-300">{item.name} <span className="text-gray-500">×{item.qty}</span></span>
                    <span className="text-yellow-400">₹{(item.price * item.qty).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Address */}
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                <FiMapPin size={10} /> Shipping Address
              </p>
              <p className="text-gray-300 text-sm leading-relaxed">
                {order.shippingAddress.name} · {order.shippingAddress.phone}<br />
                {order.shippingAddress.address}, {order.shippingAddress.city},<br />
                {order.shippingAddress.state} — {order.shippingAddress.pincode}
              </p>
            </div>

            {/* AWB info */}
            {hasAWB && (
              <div className="p-3 bg-green-400/5 border border-green-400/20">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Delhivery Shipment</p>
                <p className="text-white text-sm font-mono">{delivery.awb}</p>
                {delivery.trackingUrl && (
                  <a href={delivery.trackingUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-green-400 hover:underline mt-1">
                    <FiExternalLink size={11} /> Track on Delhivery
                  </a>
                )}
              </div>
            )}

            {/* Delivery error */}
            {delivery?.error && !hasAWB && (
              <div className="p-3 bg-red-400/5 border border-red-400/20 text-red-400 text-xs">
                <FiAlertCircle className="inline mr-1" size={12} />
                Shipment error: {delivery.error}
              </div>
            )}

            {/* ── Controls ── */}
            <div className="flex flex-wrap gap-2 pt-1">
              {/* Status select */}
              <select
                value={status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={statusLoading}
                className="bg-black border border-white/20 text-white text-xs px-3 py-1.5 focus:outline-none focus:border-yellow-400 transition disabled:opacity-40"
              >
                {["pending","processing","shipped","delivered","cancelled"].map((s) => (
                  <option key={s} value={s}>{cap(s)}</option>
                ))}
              </select>

              {/* Create shipment — only for PREPAID without AWB */}
              {isPrepaid && !hasAWB && (
                <button
                  onClick={handleCreateShipment}
                  disabled={actionLoading === "shipment"}
                  className={`${btnBase} border-blue-400/40 text-blue-400 hover:bg-blue-400/10`}
                >
                  {actionLoading === "shipment"
                    ? <><FiRefreshCw size={12} className="animate-spin" /> Creating...</>
                    : <><FiPackage size={12} /> Create Shipment</>}
                </button>
              )}

              {/* Pickup request */}
              <button
                onClick={handlePickup}
                disabled={!hasAWB || actionLoading === "pickup"}
                className={`${btnBase} border-yellow-400/40 text-yellow-400 hover:bg-yellow-400/10`}
              >
                {actionLoading === "pickup"
                  ? <><FiRefreshCw size={12} className="animate-spin" /> Requesting...</>
                  : <><FiTruck size={12} /> Pickup Request</>}
              </button>

              {/* Label download */}
              <button
                onClick={handleLabel}
                disabled={!hasAWB || actionLoading === "label"}
                className={`${btnBase} border-white/20 text-gray-300 hover:border-white/40 hover:text-white`}
              >
                {actionLoading === "label"
                  ? <><FiRefreshCw size={12} className="animate-spin" /> Downloading...</>
                  : <><FiDownload size={12} /> Download Label</>}
              </button>

              {/* Track */}
              <button
                onClick={() => setShowTracking(true)}
                disabled={!hasAWB}
                className={`${btnBase} border-purple-400/40 text-purple-400 hover:bg-purple-400/10`}
              >
                <FiMapPin size={12} /> Track
              </button>
            </div>
          </div>
        )}
      </div>

      {showTracking && (
        <TrackingDrawer order={{ ...order, delivery }} onClose={() => setShowTracking(false)} />
      )}
    </>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function AdminOrders() {
  const [orders, setOrders]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [toast, setToast]       = useState(null);

  const showToast = useCallback((msg, type = "success") => setToast({ msg, type }), []);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/orders", {
        params: { page, limit: 15, ...(statusFilter && { status: statusFilter }) },
      });
      const payload = res.data?.data;
      setOrders(payload?.orders || []);
      setTotalPages(payload?.totalPages || 1);
    } catch (e) {
      console.error(e);
      showToast("Failed to load orders", "error");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, showToast]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  return (
    <div className="text-white">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-serif text-yellow-400">Orders</h1>
          <p className="text-gray-400 text-xs mt-1">Manage, ship & track all orders</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="bg-black border border-white/20 text-white text-xs px-3 py-2 focus:outline-none focus:border-yellow-400 transition"
          >
            <option value="">All Statuses</option>
            {["pending","processing","shipped","delivered","cancelled"].map((s) => (
              <option key={s} value={s}>{cap(s)}</option>
            ))}
          </select>
          <button
            onClick={fetchOrders}
            className="flex items-center gap-1.5 text-xs border border-white/20 text-gray-300 hover:border-yellow-400 hover:text-yellow-400 px-3 py-2 transition"
          >
            <FiRefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 text-gray-400">No orders found</div>
      ) : (
        <div className="space-y-2">
          {orders.map((order) => (
            <OrderRow
              key={order._id}
              order={order}
              onRefresh={fetchOrders}
              onToast={showToast}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8 flex-wrap">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-xs border border-white/20 text-white disabled:opacity-30 hover:border-yellow-400 hover:text-yellow-400 transition"
          >Previous</button>
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`px-3 py-1.5 text-xs border transition ${page === i + 1 ? "border-yellow-400 bg-yellow-400 text-black font-semibold" : "border-white/20 text-white hover:border-yellow-400 hover:text-yellow-400"}`}
            >{i + 1}</button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-xs border border-white/20 text-white disabled:opacity-30 hover:border-yellow-400 hover:text-yellow-400 transition"
          >Next</button>
        </div>
      )}

      {/* Toast */}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-slideUp { animation: slideUp 0.2s ease-out; }
      `}</style>
    </div>
  );
}