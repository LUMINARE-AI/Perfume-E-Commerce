import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import Button from "../components/ui/Button";
import { useToast } from "../contexts/ToastContext";

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { error: showError } = useToast();

  const fetchOrders = async () => {
    try {
      const res = await api.get("/orders/my");
      setOrders(res.data.data || []);
    } catch (err) {
      console.error(err);
      showError("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    // 🔄 auto refresh every 30 seconds
    const interval = setInterval(() => {
      fetchOrders();
    }, 30000);

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="bg-black min-h-screen flex items-center justify-center text-white">
        Loading orders...
      </div>
    );
  }

  return (
    <main className="bg-black min-h-screen pt-20 pb-12">
      <div className="max-w-5xl mx-auto px-6 text-white">
        <h1 className="text-2xl md:text-3xl font-serif mb-8">
          My Orders
        </h1>

        {orders.length === 0 ? (
          <p className="text-gray-400">
            You haven’t placed any orders yet.
          </p>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order._id}
                className="border border-white/10 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
              >
                <div>
                  <p className="text-sm text-gray-400">Order ID</p>
                  <p className="text-yellow-400 text-sm break-all">
                    {order._id}
                  </p>

                  <p className="text-sm text-gray-400 mt-2">
                    Date:{" "}
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>

                  <p className="text-sm mt-1">
                    Status:{" "}
                    <span
                      className={`${
                        order.status === "delivered"
                          ? "text-green-400"
                          : order.status === "cancelled"
                          ? "text-red-400"
                          : "text-yellow-400"
                      }`}
                    >
                      {order.status}
                    </span>
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-sm text-gray-400">Total</p>
                  <p className="text-xl text-yellow-400 font-semibold">
                    ₹{order.totalPrice}
                  </p>

                  <Link to={`/my-orders/${order._id}`}>
                    <Button className="mt-2" variant="outline">
                      View Details
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}