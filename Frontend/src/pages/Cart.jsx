import { useEffect, useMemo, useState } from "react";
import Button from "../components/ui/Button";
import { FiTrash2, FiCheck, FiX, FiAlertCircle } from "react-icons/fi";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useCart } from "../contexts/CartContext";

export default function Cart() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [updatingItems, setUpdatingItems] = useState(new Set());
  const { refreshCart } = useCart();

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

const fetchCart = async () => {
  try {
    setLoading(true);
    const res = await api.get("/cart");
    setItems(res.data.data || []);
  } catch (err) {

    if (err.response?.status === 401) {
      // user login nahi hai → empty cart
      setItems([]);
      return;
    }

    console.error(err);
    showToast("Failed to load cart", "error");
  } finally {
    setLoading(false);
  }
};
  useEffect(() => {
    fetchCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateQty = async (productId, delta) => {
    const item = items.find((i) => i.product._id === productId);
    if (!item) return;

    const currentQty = item.quantity || 0;
    const newQty = currentQty + delta;

    if (newQty < 1) {
      showToast("Quantity cannot be less than 1", "error");
      return;
    }

    if (newQty > item.product.stock) {
      showToast(`Only ${item.product.stock} units available`, "error");
      return;
    }

    try {
      setUpdatingItems((prev) => new Set(prev).add(productId));
      await api.put("/cart", { productId, quantity: newQty });
      setItems((prevItems) =>
        prevItems.map((i) =>
          i.product._id === productId ? { ...i, quantity: newQty } : i
        )
      );
      showToast("Quantity updated", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to update quantity", "error");
      fetchCart();
    } finally {
      setUpdatingItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  const removeItem = async (productId) => {
    if (!window.confirm("Remove this item from cart?")) return;

    try {
      setUpdatingItems((prev) => new Set(prev).add(productId));
      await api.delete(`/cart/${productId}`);
      setItems((prevItems) =>
        prevItems.filter((i) => i.product._id !== productId)
      );
      refreshCart(); // ✅ Navbar badge update
      showToast("Item removed from cart", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to remove item", "error");
      fetchCart();
    } finally {
      setUpdatingItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  const subtotal = useMemo(
    () =>
      items.reduce((sum, item) => {
        if (!item.product) return sum;
        return sum + item.product.price * item.quantity;
      }, 0),
    [items]
  );

  const shipping = 0;
  const total = subtotal + shipping;

  if (loading) {
    return (
      <div className="bg-black min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-white">Loading cart...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="bg-black mt-14 min-h-screen">
      {toast && (
        <div className="fixed top-20 right-4 z-50 animate-slide-in-right">
          <div
            className={`flex items-center gap-3 px-6 py-4 rounded-lg border backdrop-blur-sm shadow-lg ${
              toast.type === "success"
                ? "bg-green-500/20 border-green-400 text-green-400"
                : toast.type === "error"
                  ? "bg-red-500/20 border-red-400 text-red-400"
                  : "bg-yellow-500/20 border-yellow-400 text-yellow-400"
            }`}
          >
            {toast.type === "success" ? (
              <FiCheck className="text-xl shrink-0" />
            ) : toast.type === "error" ? (
              <FiX className="text-xl shrink-0" />
            ) : (
              <FiAlertCircle className="text-xl shrink-0" />
            )}
            <p className="text-sm font-medium">{toast.message}</p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-10 text-white">
        <h1 className="text-2xl md:text-3xl font-serif mb-8">Shopping Cart</h1>

        {items.length === 0 ? (
          <div className="text-center py-20">
            <FiAlertCircle className="text-6xl text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg mb-2">
              Your cart is currently empty.
            </p>
            <Link to="/products">
              <Button>Continue Shopping</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Cart Items */}
            <div className="md:col-span-2 space-y-6">
              {items.map((item) => {
                if (!item.product) return null;
                const isUpdating = updatingItems.has(item.product._id);

                return (
                  <div
                    key={item.product._id}
                    className="flex gap-4 p-4 border border-white/10 hover:border-yellow-400 transition"
                  >
                    <img
                      src={item.product.images?.[0]?.url}
                      alt={item.product.name}
                      className="w-24 h-24 object-cover"
                    />

                    <div className="flex-1">
                      <h3 className="font-medium">{item.product.name}</h3>
                      <p className="text-yellow-400 mt-2 font-semibold">
                        ₹{item.product.price.toLocaleString()}
                      </p>

                      <div className="mt-3 inline-flex items-center border border-white/20">
                        <button
                          onClick={() => updateQty(item.product._id, -1)}
                          disabled={item.quantity <= 1 || isUpdating}
                          className="px-3 py-1 hover:text-yellow-400 disabled:opacity-50"
                        >
                          −
                        </button>
                        <span className="px-4 min-w-12 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQty(item.product._id, 1)}
                          disabled={isUpdating}
                          className="px-3 py-1 hover:text-yellow-400 disabled:opacity-50"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => removeItem(item.product._id)}
                      disabled={isUpdating}
                      className="text-gray-400 hover:text-red-400 transition"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Summary */}
            <div className="border border-white/10 p-6 h-fit sticky top-24">
              <h2 className="font-medium mb-4 text-lg">Order Summary</h2>

              <div className="space-y-2 text-sm text-gray-300 mb-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="text-gray-400">Calculated at checkout</span>
                </div>
              </div>

              <div className="border-t border-white/10 pt-4 mb-4 flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span className="text-yellow-400">₹{total.toLocaleString()}</span>
              </div>

              <Link to="/checkout">
                <Button className="w-full" disabled={items.length === 0}>
                  Proceed to Checkout
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}