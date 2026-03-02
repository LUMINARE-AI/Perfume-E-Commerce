import { useState, useEffect, useMemo } from "react";
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

  // Delhivery shipping state
  const [shippingFee, setShippingFee] = useState(null); // null = not fetched yet
  const [shippingFeeLoading, setShippingFeeLoading] = useState(false);
  const [shippingFeeError, setShippingFeeError] = useState("");
  const [pincodeServiceable, setPincodeServiceable] = useState(null); // null | true | false

  const navigate = useNavigate();

  const fetchCart = async () => {
    try {
      const res = await api.get("/cart");
      setCartItems(res.data.data || []);
    } catch (err) {
      alert("Failed to load cart", err?.response?.data?.message || err.message);
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
        0
      ),
    [cartItems]
  );

  // Total weight estimate (500g per item as default)
  const totalWeight = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity * 500, 0),
    [cartItems]
  );

  const total = subtotal + (shippingFee ?? 0);

  const handleChange = (e) => {
    setShipping({ ...shipping, [e.target.name]: e.target.value });

    // Reset shipping fee when pincode changes
    if (e.target.name === "pincode") {
      setShippingFee(null);
      setPincodeServiceable(null);
      setShippingFeeError("");
    }
  };

// Frontend/src/pages/Checkout.jsx
// fetchShippingDetails function update karo

useEffect(() => {
  const pincode = shipping.pincode;
  if (pincode.length !== 6 || !/^\d{6}$/.test(pincode)) return;

  const fetchShippingDetails = async () => {
    setShippingFeeLoading(true);
    setShippingFeeError("");
    setPincodeServiceable(null);
    setShippingFee(null);

    try {
      console.log('🔍 Checking pincode:', pincode);
      
      // 1. Check serviceability
      const serviceRes = await checkServiceability(pincode);
      console.log('📦 Serviceability response:', serviceRes);
      
      const serviceable = serviceRes.data?.success ?? true;
      setPincodeServiceable(serviceable);

      if (!serviceable) {
        setShippingFeeError("This pincode is not serviceable by Delhivery.");
        setShippingFeeLoading(false);
        return;
      }

      // 2. Calculate shipping cost
      console.log('💰 Calculating shipping cost with:', {
        originPin: "304001", // Your warehouse pincode
        destinationPin: pincode,
        weight: totalWeight,
        paymentMode: payment === "cod" ? "COD" : "Pre-paid",
        collectableAmount: payment === "cod" ? subtotal : 0,
      });

      const costRes = await calculateShippingCost({
        originPin: "304001", // ✅ Replace with your actual warehouse pincode
        destinationPin: pincode,
        weight: Math.max(totalWeight, 500), // Minimum 500g
        paymentMode: payment === "cod" ? "COD" : "Pre-paid",
        collectableAmount: payment === "cod" ? subtotal : 0,
        mode: "S" // Surface
      });

      console.log('💰 Shipping cost response:', costRes);
      console.log('💰 Response data:', costRes.data);

      // ✅ FIXED: Proper response parsing
      if (costRes.data.success) {
        const shippingData = costRes.data.data;
        console.log('💰 Shipping data:', shippingData);
        
        // Try different possible field names
        const fee = shippingData.totalAmount || 
                    shippingData.total_amount || 
                    shippingData.charges || 
                    shippingData.total ||
                    null;

        console.log('💰 Extracted fee:', fee);

        if (fee !== null && fee > 0) {
          setShippingFee(Math.round(fee));
        } else {
          console.warn('⚠️ Could not extract fee, using fallback');
          setShippingFee(199);
          setShippingFeeError("Using estimated shipping cost.");
        }
      } else {
        console.warn('⚠️ API returned success: false');
        setShippingFee(199);
        setShippingFeeError("Could not fetch live cost. Using estimate.");
      }
    } catch (err) {
      console.error('❌ Shipping calculation error:', err);
      console.error('❌ Error response:', err.response?.data);
      
      // Fallback on error
      setShippingFee(199);
      setShippingFeeError("Could not fetch live shipping cost. Using default.");
    } finally {
      setShippingFeeLoading(false);
    }
  };

  fetchShippingDetails();
}, [shipping.pincode, payment, subtotal, totalWeight]);

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
    if (shippingFee === null) {
      alert("Fetching shipping cost, please wait...");
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

  const placeOrder = async () => {
    try {
      if (payment === "cod") {
        // COD: Create order → backend creates Delhivery shipment directly
        const res = await createOrderApi({
          shippingAddress: {
            ...shipping,
            name: shipping.fullName,
          },
          paymentMethod: "cod",
        });

        navigate(`/order-success/${res.data.data._id}`);
        return;
      }

      // PREPAID: Payment first → then create order (which triggers shipment)
      // 1. Create Razorpay order (amount in paise)
      const { data } = await createRazorpayOrderApi(total);

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: data.data.amount,
        currency: "INR",
        name: "BinKhalid Perfumes",
        description: "Luxury Perfume Order",
        order_id: data.data.id,

        handler: async function (response) {
          // 2. Payment successful → now create DB order
          const orderRes = await createOrderApi({
            shippingAddress: {
              ...shipping,
              name: shipping.fullName,
            },
            paymentMethod: "prepaid",
            razorpayPaymentId: response.razorpay_payment_id,
            razorpayOrderId: response.razorpay_order_id,
            razorpaySignature: response.razorpay_signature,
          });

          const orderId = orderRes.data.data._id;

          // 3. Verify payment against DB order
          await verifyRazorpayPaymentApi({
            ...response,
            orderId,
          });

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
          <span className={step === 1 ? "text-yellow-400" : "text-gray-400"}>
            1. Shipping
          </span>
          <span className={step === 2 ? "text-yellow-400" : "text-gray-400"}>
            2. Payment
          </span>
          <span className={step === 3 ? "text-yellow-400" : "text-gray-400"}>
            3. Review
          </span>
        </div>

        {/* Step 1: Shipping */}
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
              {/* Pincode feedback */}
              {shipping.pincode.length === 6 && (
                <div className="mt-1 text-sm">
                  {shippingFeeLoading && (
                    <span className="text-gray-400">Checking Availability...</span>
                  )}
                  {!shippingFeeLoading && pincodeServiceable === false && (
                    <span className="text-red-400">❌ Pincode not serviceable</span>
                  )}
                  {!shippingFeeLoading && pincodeServiceable === true && shippingFee !== null && (
                    <span className="text-green-400">
                      ✓ Serviceable
                    </span>
                  )}
                  {!shippingFeeLoading && shippingFeeError && (
                    <span className="text-yellow-400 block">{shippingFeeError}</span>
                  )}
                </div>
              )}
            </div>

            <div className="md:col-span-2 mt-6">
              <Button
                onClick={handleNextFromShipping}
                disabled={shippingFeeLoading}
              >
                {shippingFeeLoading ? "Fetching Shipping..." : "Continue to Payment"}
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Payment */}
        {step === 2 && (
          <div>
            <h2 className="text-lg font-medium mb-6">Select Payment Method</h2>

            <div className="mb-4 p-4 bg-yellow-400/10 border border-yellow-400 text-yellow-400 rounded">
              <p className="text-sm">
                ℹ️ We recommend using Razorpay for a smoother checkout experience. Cash on Delivery (COD) is available but may have additional shipping fees and longer delivery times.
              </p>
            </div>

            <div className="space-y-4 mb-8">
              {["cod", "razorpay"].map((method) => (
                <label
                  key={method}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <input
                    type="radio"
                    checked={payment === method}
                    onChange={() => setPayment(method)}
                  />
                  <span>
                    {method === "cod"
                      ? "Cash on Delivery"
                      : "UPI / Card / Netbanking (Razorpay)"}
                  </span>
                </label>
              ))}
            </div>

            {payment === "razorpay" && (
              <p className="text-sm text-yellow-400 mb-6">
                ℹ️ Payment will be processed first, then your order will be confirmed and shipped.
              </p>  
            )}

            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back to Shipping
              </Button>
              <Button onClick={handleNextFromPayment}>Continue to Review</Button>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Left: Order Items */}
            <div>
              <h2 className="text-lg font-medium mb-4">Order Summary</h2>

              <div className="space-y-4 mb-6">
                {cartItems.map((item) => (
                  <div
                    key={item.product._id}
                    className="flex justify-between border border-white/10 p-3"
                  >
                    <div>
                      <p>{item.product.name}</p>
                      <p className="text-sm text-gray-400">× {item.quantity}</p>
                    </div>
                    <p className="text-yellow-400">
                      ₹{item.product.price * item.quantity}
                    </p>
                  </div>
                ))}
              </div>

              <div className="space-y-2 text-sm text-gray-300">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping (Delhivery)</span>
                  <span>₹{shippingFee}</span>
                </div>
                <div className="flex justify-between font-semibold border-t border-white/10 pt-2">
                  <span>Total</span>
                  <span className="text-yellow-400">₹{total}</span>
                </div>
              </div>
            </div>

            {/* Right: Shipping & Payment */}
            <div className="border border-white/10 p-6 h-fit">
              <h2 className="font-medium mb-4">Shipping Details</h2>
              <p className="text-sm text-gray-400 mb-4">
                {shipping.fullName}, {shipping.phone} <br />
                {shipping.address}, {shipping.city}, {shipping.state} -{" "}
                {shipping.pincode}
              </p>

              <h2 className="font-medium mb-2">Payment Method</h2>
              <p className="text-sm text-gray-400 mb-2">
                {payment === "cod" ? "Cash on Delivery" : "Razorpay (UPI / Card / Netbanking)"}
              </p>

              {payment === "razorpay" && (
                <p className="text-xs text-yellow-400 mb-6">
                  You will be redirected to Razorpay to complete payment first.
                </p>
              )}
              {payment === "cod" && (
                <p className="text-xs text-gray-500 mb-6">
                  Pay ₹{total} at the time of delivery.
                </p>
              )}

              <div className="flex gap-4">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Back to Payment
                </Button>
                <Button onClick={placeOrder}>
                  {payment === "cod" ? "Place Order" : "Proceed to Pay ₹" + total}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}