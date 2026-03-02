import { useEffect, useState } from "react";
import api from "../../api/axios";

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);

  const fetchOrders = async () => {
    const res = await api.get("/admin/orders");
    setOrders(res.data.data);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrders();
  }, []);

  const updateStatus = async (orderId, status) => {
    await api.put(`/orders/${orderId}/status`, { status });
    fetchOrders();
  };

  return (
    <div className="p-8 mt-4 text-white">
      <h1 className="text-2xl font-serif mb-6">All Orders</h1>

      <div className="space-y-4">
        {orders.map(order => (
          <div key={order._id} className="border border-white/10 p-4">
            <p>Order: {order._id}</p>
            <p>Total: ₹{order.totalPrice}</p>
            <p>Status: {order.status}</p>

            <select
              value={order.status}
              onChange={(e) => updateStatus(order._id, e.target.value)}
              className="bg-black border border-white/20 mt-2"
            >
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
