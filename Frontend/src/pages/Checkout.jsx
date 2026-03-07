import { useState, useEffect, useMemo, useRef } from "react";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
import { createOrderApi } from "../api/orders";
import {
  createRazorpayOrderApi,
  verifyRazorpayPaymentApi,
} from "../api/payment";
import { checkServiceability, calculateShippingCost } from "../api/delhivery";

export default function Checkout() {
  const [step, setStep] = useState(1);
  const [shipping, setShipping] = useState({
    fullName: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [payment, setPayment] = useState("cod");
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [shippingFee, setShippingFee] = useState(null);
  const [shippingFeeLoading, setShippingFeeLoading] = useState(false);
  const [shippingFeeError, setShippingFeeError] = useState("");
  const [pincodeServiceable, setPincodeServiceable] = useState(null);

  // ✅ Pichli successful fee yaad rakhne ke liye
  // Agar recalculation fail ho toh yeh use hogi, 199 nahi
  const lastSuccessfulFee = useRef(null);

  const navigate = useNavigate();

  const fetchCart = async () => {
    try {
      const res = await api.get("/cart");
      setCartItems(res.data.data || []);
    } catch (err) {
      console.error("Cart fetch error:", err);
      alert("Failed to load cart");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const subtotal = useMemo(
    () =>
      cartItems.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0,
      ),
    [cartItems],
  );

  const totalWeight = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity * 500, 0),
    [cartItems],
  );

  const total = subtotal + (shippingFee ?? 0);

  const handleChange = (e) => {
    setShipping({ ...shipping, [e.target.name]: e.target.value });
    if (e.target.name === "pincode") {
      setShippingFee(null);
      lastSuccessfulFee.current = null;
      setPincodeServiceable(null);
      setShippingFeeError("");
    }
  };

  // ✅ isPincodeCheck: true = pincode change (full flow)
  //                   false = payment change (sirf cost recalculate)
  const fetchShippingDetails = async (
    pincode,
    paymentMode,
    isPincodeCheck = false,
  ) => {
    setShippingFeeLoading(true);
    setShippingFeeError("");

    if (isPincodeCheck) {
      setPincodeServiceable(null);
      setShippingFee(null);
      lastSuccessfulFee.current = null;
    }

    try {
      // Step 1: Serviceability — sirf pincode change pe check karo
      if (isPincodeCheck) {
        const serviceRes = await checkServiceability(pincode);
        const resData = serviceRes.data;

        const serviceable =
          resData?.data?.serviceable ??
          (resData?.data?.delivery_codes?.length ?? 0) > 0;

        setPincodeServiceable(serviceable);

        if (!serviceable) {
          setShippingFeeError("This pincode is not serviceable by Delhivery.");
          setShippingFeeLoading(false);
          return;
        }
      }

      // Step 2: Live shipping cost
      const costRes = await calculateShippingCost({
        originPin: import.meta.env.VITE_WAREHOUSE_PINCODE || "304001",
        destinationPin: pincode,
        weight: Math.max(totalWeight, 500),
        // ✅ Payment mode sahi pass karo — COD aur Prepaid rates alag hain
        paymentMode: paymentMode === "cod" ? "COD" : "Pre-paid",
        collectableAmount: paymentMode === "cod" ? subtotal + shippingFee : 0,
        mode: "S",
      });

      const costData = costRes.data?.data;

      if (costRes.data?.success) {
        const fee = costData?.totalAmount ?? null;

        if (fee !== null && fee >= 0) {
          const roundedFee = Math.round(fee);
          setShippingFee(roundedFee);
          lastSuccessfulFee.current = roundedFee; // ✅ Save karo
        } else {
          // API ne 0 ya invalid diya — pichli fee use karo
          const fallback =
            lastSuccessfulFee.current ?? (subtotal > 3000 ? 0 : 199);
          setShippingFee(fallback);
          setShippingFeeError("Using estimated shipping cost.");
        }
      } else {
        // ✅ API fail — pichli successful fee use karo, 199 nahi
        const fallback =
          lastSuccessfulFee.current ?? (subtotal > 3000 ? 0 : 199);
        setShippingFee(fallback);
        if (!lastSuccessfulFee.current) {
          setShippingFeeError("Could not fetch live cost. Using estimate.");
        }
      }
    } catch (err) {
      console.error("Shipping calc error:", err);
      // ✅ Error pe bhi pichli fee use karo
      const fallback = lastSuccessfulFee.current ?? (subtotal > 3000 ? 0 : 199);
      setShippingFee(fallback);
      if (!lastSuccessfulFee.current) {
        setShippingFeeError("Could not fetch live cost. Using estimate.");
      }
    } finally {
      setShippingFeeLoading(false);
    }
  };

  // ── Pincode change pe full flow ──────────────────────────
  useEffect(() => {
    const pincode = shipping.pincode;
    if (pincode.length !== 6 || !/^\d{6}$/.test(pincode)) return;
    fetchShippingDetails(pincode, payment, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shipping.pincode, subtotal, totalWeight]);

  // ── Payment method change pe sirf cost recalculate ──────
  useEffect(() => {
    const pincode = shipping.pincode;
    if (pincode.length !== 6 || !/^\d{6}$/.test(pincode)) return;
    if (pincodeServiceable === false) return; // serviceable nahi hai toh skip
    if (shippingFee === null && lastSuccessfulFee.current === null) return; // pehle pincode check nahi hua
    fetchShippingDetails(pincode, payment, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payment]);

  // ── Step navigation ──────────────────────────────────────
  const handleNextFromShipping = () => {
    const { fullName, phone, address, city, state, pincode } = shipping;
    if (!fullName || !phone || !address || !city || !state || !pincode) {
      alert("Please fill all shipping details.");
      return;
    }
    if (pincodeServiceable === false) {
      alert("This pincode is not serviceable. Please use a different address.");
      return;
    }
    if (shippingFeeLoading) {
      alert("Fetching shipping cost, please wait...");
      return;
    }
    if (shippingFee === null) {
      alert("Could not determine shipping cost. Please re-enter pincode.");
      return;
    }
    setStep(2);
  };

  const handleNextFromPayment = () => {
    if (!payment) {
      alert("Please select a payment method.");
      return;
    }
    setStep(3);
  };

  // ── Place order ──────────────────────────────────────────
  const placeOrder = async () => {
    try {
      // ✅ shippingFee state se lo — yeh latest calculated value hai
      const finalShippingFee = shippingFee ?? lastSuccessfulFee.current ?? 0;

      const orderPayload = {
        shippingAddress: {
          ...shipping,
          name: shipping.fullName,
        },
        paymentMethod: payment === "cod" ? "cod" : "prepaid",
        shippingFee: finalShippingFee,
      };

      if (payment === "cod") {
        const res = await createOrderApi(orderPayload);
        navigate(`/order-success/${res.data.data._id}`);
        return;
      }

      // Prepaid: Razorpay
      const { data } = await createRazorpayOrderApi(total);

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: data.data.amount,
        currency: "INR",
        name: "BinKhalid Perfumes",
        description: "Luxury Perfume Order",
        order_id: data.data.id,

        handler: async function (response) {
          const orderRes = await createOrderApi({
            ...orderPayload,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpayOrderId: response.razorpay_order_id,
            razorpaySignature: response.razorpay_signature,
          });

          const orderId = orderRes.data.data._id;
          await verifyRazorpayPaymentApi({ ...response, orderId });
          navigate(`/order-success/${orderId}`);
        },

        prefill: {
          name: shipping.fullName,
          contact: shipping.phone,
        },

        theme: { color: "#D4AF37" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      alert(err?.response?.data?.message || "Payment failed");
    }
  };

  if (loading) {
    return (
      <div className="bg-black min-h-screen flex items-center justify-center text-white">
        Loading checkout...
      </div>
    );
  }

  return (
    <main className="bg-black min-h-screen mt-14">
      <div className="max-w-5xl mx-auto px-6 py-10 text-white">
        <h1 className="text-2xl md:text-3xl font-serif mb-8">Checkout</h1>

        {/* Step Indicator */}
        <div className="flex items-center gap-6 mb-10 text-sm">
          {[
            ["1. Shipping", 1],
            ["2. Payment", 2],
            ["3. Review", 3],
          ].map(([label, s]) => (
            <span
              key={s}
              className={
                step === s ? "text-yellow-400 font-medium" : "text-gray-400"
              }
            >
              {label}
            </span>
          ))}
        </div>

        {/* ── Step 1: Shipping ── */}
        {step === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Full Name"
              name="fullName"
              value={shipping.fullName}
              onChange={handleChange}
            />
            <Input
              label="Phone Number"
              name="phone"
              value={shipping.phone}
              onChange={handleChange}
            />
            <Input
              label="Address"
              name="address"
              value={shipping.address}
              onChange={handleChange}
            />
            <Input
              label="City"
              name="city"
              value={shipping.city}
              onChange={handleChange}
            />
            <Input
              label="State"
              name="state"
              value={shipping.state}
              onChange={handleChange}
            />

            <div>
              <Input
                label="Pincode"
                name="pincode"
                value={shipping.pincode}
                onChange={handleChange}
              />

              {shipping.pincode.length === 6 && (
                <div className="mt-2 text-sm space-y-1">
                  {shippingFeeLoading && (
                    <span className="flex items-center gap-2 text-gray-400 text-xs">
                      <span className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
                      Checking availability...
                    </span>
                  )}
                  {!shippingFeeLoading && pincodeServiceable === false && (
                    <span className="text-red-400 text-xs">
                      ❌ Pincode not serviceable
                    </span>
                  )}
                  {!shippingFeeLoading &&
                    pincodeServiceable === true &&
                    shippingFee !== null && (
                      <span className="text-green-400 text-xs">
                        ✓ Serviceable · Shipping:{" "}
                        <strong>₹{shippingFee}</strong>
                        {shippingFee === 0 && " (Free!)"}
                      </span>
                    )}
                  {!shippingFeeLoading && shippingFeeError && (
                    <span className="text-yellow-400 text-xs block">
                      {shippingFeeError}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="md:col-span-2 mt-2">
              <Button
                onClick={handleNextFromShipping}
                disabled={shippingFeeLoading}
              >
                {shippingFeeLoading
                  ? "Fetching Shipping..."
                  : "Continue to Payment"}
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 2: Payment ── */}
        {step === 2 && (
          <div>
            <h2 className="text-lg font-medium mb-6">Select Payment Method</h2>

            <div className="mb-6 p-4 bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 text-sm">
              ℹ️ We recommend Razorpay for a smoother experience. COD is
              available but may have longer delivery times.
            </div>

            <div className="space-y-4 mb-8">
              {[
                { value: "cod", label: "Cash on Delivery" },
                {
                  value: "razorpay",
                  label: "UPI / Card / Netbanking (Razorpay)",
                },
              ].map(({ value, label }) => (
                <label
                  key={value}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <input
                    type="radio"
                    checked={payment === value}
                    onChange={() => setPayment(value)}
                  />
                  <span>{label}</span>
                  {/* ✅ Live fee update dikhao jab payment switch karo */}
                  {shippingFeeLoading && (
                    <span className="text-xs text-gray-400 ml-auto flex items-center gap-1">
                      <span className="w-2.5 h-2.5 border border-gray-400 border-t-transparent rounded-full animate-spin" />
                      Updating...
                    </span>
                  )}
                </label>
              ))}
            </div>

            {/* ✅ Show updated shipping fee on payment step */}
            {shippingFee !== null && !shippingFeeLoading && (
              <div className="mb-6 p-3 bg-white/5 border border-white/10 text-sm text-gray-300 flex justify-between">
                <span>
                  Shipping charge ({payment === "cod" ? "COD" : "Online"})
                </span>
                <span className="text-yellow-400 font-medium">
                  {shippingFee === 0 ? "Free" : `₹${shippingFee}`}
                </span>
              </div>
            )}

            {payment === "razorpay" && (
              <p className="text-sm text-yellow-400 mb-6">
                ℹ️ Payment will be processed first, then your order will be
                confirmed and shipped.
              </p>
            )}

            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button
                onClick={handleNextFromPayment}
                disabled={shippingFeeLoading}
              >
                {shippingFeeLoading ? "Updating..." : "Continue to Review"}
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 3: Review ── */}
        {step === 3 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div>
              <h2 className="text-lg font-medium mb-4">Order Summary</h2>
              <div className="space-y-3 mb-6">
                {cartItems.map((item) => (
                  <div
                    key={item.product._id}
                    className="flex justify-between border border-white/10 p-3"
                  >
                    <div>
                      <p className="text-sm">{item.product.name}</p>
                      <p className="text-xs text-gray-400">× {item.quantity}</p>
                    </div>
                    <p className="text-yellow-400 text-sm">
                      ₹{(item.product.price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>

              <div className="space-y-2 text-sm text-gray-300">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping ({payment === "cod" ? "COD" : "Online"})</span>
                  <span>
                    {shippingFee === 0 ? (
                      <span className="text-green-400">Free</span>
                    ) : (
                      `₹${shippingFee}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between font-semibold text-base border-t border-white/10 pt-2 text-white">
                  <span>Total</span>
                  <span className="text-yellow-400">
                    ₹{total.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="border border-white/10 p-6 h-fit space-y-5">
              <div>
                <h2 className="font-medium mb-2 text-sm text-gray-400 uppercase tracking-wider">
                  Shipping Details
                </h2>
                <p className="text-sm text-gray-300 leading-relaxed">
                  {shipping.fullName}, {shipping.phone}
                  <br />
                  {shipping.address}, {shipping.city}, {shipping.state} —{" "}
                  {shipping.pincode}
                </p>
              </div>

              <div>
                <h2 className="font-medium mb-1 text-sm text-gray-400 uppercase tracking-wider">
                  Payment
                </h2>
                <p className="text-sm text-gray-300">
                  {payment === "cod"
                    ? "Cash on Delivery"
                    : "Razorpay (UPI / Card / Netbanking)"}
                </p>
                {payment === "razorpay" && (
                  <p className="text-xs text-yellow-400 mt-1">
                    You will be redirected to Razorpay to complete payment.
                  </p>
                )}
                {payment === "cod" && (
                  <p className="text-xs text-gray-500 mt-1">
                    Pay ₹{total.toLocaleString()} at delivery.
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button onClick={placeOrder}>
                  {payment === "cod"
                    ? "Place Order"
                    : `Pay ₹${total.toLocaleString()}`}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
