import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Breadcrumbs from "../components/ui/Breadcrumbs";
import Button from "../components/ui/Button";
import ProductCard from "../components/ui/ProductCard";
import {
  FiShoppingCart,
  FiShare2,
  FiPackage,
  FiTruck,
  FiShield,
  FiCheck,
  FiX,
  FiAlertCircle,
  FiStar,
  FiMapPin,
  FiClock,
} from "react-icons/fi";
import api from "../api/axios";
import { addToCartApi } from "../api/cart";
import { useNavigate } from "react-router-dom";
import { getProductReviewsApi, addReviewApi } from "../api/review";
import { checkServiceability, getTAT } from "../api/delhivery";

export default function ProductDetails() {
  const { id } = useParams();

  const [product, setProduct] = useState(null);
  const [moreProducts, setMoreProducts] = useState([]);
  const [activeImage, setActiveImage] = useState(null);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState("description");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addingToCart, setAddingToCart] = useState(false);
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [reviews, setReviews] = useState([]);
  const [userReviewId, setUserReviewId] = useState(null);

  // ✅ Pincode Check States
  const [pincode, setPincode] = useState("");
  const [checkingPincode, setCheckingPincode] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState(null);
  const [pincodeError, setPincodeError] = useState("");

  const fetchReviews = async () => {
    try {
      const res = await getProductReviewsApi(id);
      const reviewsData = res.data.data;
      setReviews(reviewsData);

      if (token) {
        const userEmail = localStorage.getItem("userEmail");
        const userId = localStorage.getItem("userId");

        const userReview = reviewsData.find(
          (r) => r.user?._id === userId || r.user?.email === userEmail,
        );

        if (userReview) {
          setUserReviewId(userReview._id);
        } else {
          setUserReviewId(null);
        }
      }
    } catch (err) {
      console.error("Error fetching reviews:", err);
    }
  };

  useEffect(() => {
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ✅ Check Pincode Serviceability
  const handleCheckPincode = async () => {
    if (!pincode || pincode.length !== 6) {
      setPincodeError("Please enter a valid 6-digit pincode");
      setDeliveryInfo(null);
      return;
    }

    try {
      setCheckingPincode(true);
      setPincodeError("");
      setDeliveryInfo(null);

      // Check serviceability
      const serviceRes = await checkServiceability(pincode);

      if (!serviceRes.data.success) {
        setPincodeError("Delivery not available for this pincode");
        return;
      }

      // Get TAT (Time to deliver)
      const originPin = import.meta.env.VITE_WAREHOUSE_PINCODE || "304001";
      const tatRes = await getTAT(originPin, pincode, "S");

      if (tatRes.data.success) {
        setDeliveryInfo({
          available: true,
          serviceable: serviceRes.data.data,
          tat: tatRes.data.data,
        });
        showToast("Delivery available for this pincode! ✅", "success");
      }
    } catch (err) {
      console.error("Pincode check error:", err);
      setPincodeError(
        err?.response?.data?.message ||
          "Failed to check pincode serviceability",
      );
      showToast("Failed to check delivery availability", "error");
    } finally {
      setCheckingPincode(false);
    }
  };

  const handleAddReview = async () => {
    if (!token) {
      showToast("Please login to add a review", "error");
      return;
    }

    if (!comment.trim()) {
      showToast("Please write a review", "error");
      return;
    }

    try {
      setSubmitting(true);
      await addReviewApi({
        productId: product._id,
        rating,
        comment,
      });

      setComment("");
      setRating(5);
      fetchReviews();
      showToast("Review added successfully ✅", "success");
    } catch (err) {
      const errorMessage = err?.response?.data?.message;

      if (err?.response?.status === 400 && errorMessage?.includes("already")) {
        showToast("You have already reviewed this product", "error");
      } else if (err?.response?.status === 401) {
        showToast("Session expired. Please login again", "error");
        setTimeout(() => navigate("/login"), 1500);
      } else if (err?.response?.status === 403) {
        showToast("You cannot review this product", "error");
      } else {
        showToast(errorMessage || "Failed to add review", "error");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddToCart = async () => {
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setAddingToCart(true);
      await addToCartApi(product._id, qty);
      showToast(`${product.name} added to cart! 🛒`, "success");
    } catch (err) {
      console.error(err);
      if (err?.response?.status === 401) {
        localStorage.removeItem("token");
        showToast("Session expired. Please login again.", "error");
        setTimeout(() => navigate("/login"), 1500);
      } else {
        showToast(
          err?.response?.data?.message || "Failed to add to cart",
          "error",
        );
      }
    } finally {
      setAddingToCart(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: `Check out ${product.name} - ₹${product.price}`,
          url: url,
        });
      } catch (err) {
        if (err.name !== "AbortError") {
          copyToClipboard(url);
        }
      }
    } else {
      copyToClipboard(url);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showToast("Link copied to clipboard!", "success");
  };

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/products/${id}`);
      const prod = res.data.data;

      setProduct(prod);
      const coverImage = prod.images?.find((img) => img.isCover);
      setActiveImage(coverImage?.url || prod.images?.[0]?.url || null);

      const moreRes = await api.get("/products", {
        params: { limit: 8 },
      });
      setMoreProducts(
        (moreRes.data?.data?.products || []).filter((p) => p._id !== prod._id),
      );
    } catch (err) {
      console.error(err);
      setError("Failed to load product");
      showToast("Failed to load product", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
    setQty(1);
    setPincode("");
    setDeliveryInfo(null);
    setPincodeError("");
    window.scrollTo(0, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const renderStars = (ratingValue) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <FiStar
            key={star}
            size={14}
            className={`${
              star <= ratingValue
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-500"
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-black min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-white">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="bg-black min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FiAlertCircle className="text-red-400 text-5xl mx-auto mb-4" />
          <p className="text-red-400 text-lg mb-4">
            {error || "Product not found"}
          </p>
          <Link to="/products">
            <Button>Back to Shop</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="bg-black min-h-screen pt-20 pb-12">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 right-4 z-50 animate-slide-in-right px-4">
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

      <div className="max-w-7xl mx-auto px-4 md:px-6">
        {/* Breadcrumbs */}
        <div className="mb-6">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Shop", href: "/products" },
              { label: product.name },
            ]}
          />
        </div>

        {/* Product Details Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10 mb-16">
          {/* Image Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative border border-white/10 overflow-hidden bg-gray-900 aspect-square">
              <img
                src={activeImage || "/placeholder.jpg"}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                onError={(e) => {
                  e.target.src = "/placeholder.jpg";
                }}
              />

              {/* Stock Badge */}
              {product.stock <= 5 && product.stock > 0 && (
                <div className="absolute top-4 left-4 bg-yellow-400 text-black text-xs font-semibold px-3 py-1">
                  Only {product.stock} left
                </div>
              )}
              {product.stock === 0 && (
                <div className="absolute top-4 left-4 bg-red-500 text-white text-xs font-semibold px-3 py-1">
                  Out of Stock
                </div>
              )}

              {/* Quick Actions */}
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                <button
                  onClick={handleShare}
                  className="p-2 md:p-3 bg-black/80 backdrop-blur-sm border border-white/20 text-white hover:text-yellow-400 transition"
                >
                  <FiShare2 size={18} />
                </button>
              </div>
            </div>

            {/* Thumbnails */}
            {product.images?.length > 0 && (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {product.images.map((img, idx) => (
                  <button
                    key={img.public_id || idx}
                    onClick={() => setActiveImage(img.url)}
                    className={`relative border-2 shrink-0 transition ${
                      activeImage === img.url
                        ? "border-yellow-400"
                        : "border-white/10 hover:border-yellow-400/50"
                    }`}
                  >
                    <img
                      src={img.url}
                      alt={`${product.name} - Image ${idx + 1}`}
                      className="w-20 h-20 object-cover"
                      onError={(e) => {
                        e.target.src = "/placeholder.jpg";
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="text-white space-y-6">
            {/* Title & Brand */}
            <div>
              <h1 className="text-2xl md:text-4xl font-serif mb-3">
                {product.name}
              </h1>
              {product.category && (
                <span className="inline-block text-xs border border-white/20 px-3 py-1 text-gray-400 uppercase">
                  {product.category}
                </span>
              )}
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <p className="text-3xl md:text-4xl font-bold text-yellow-400">
                ₹{product.price?.toLocaleString()}
              </p>
              {product.stock > 0 && (
                <span className="text-sm text-green-400">• In Stock</span>
              )}
            </div>

            {/* Description */}
            <p className="text-gray-300 leading-relaxed text-sm md:text-base">
              {product.description ||
                "Experience luxury with this exquisite product from our collection."}
            </p>

            <div className="border-t border-white/10"></div>

            {/* ✅ Check Delivery Pincode */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <FiMapPin className="text-yellow-400" size={18} />
                <h3 className="text-sm font-semibold">Check Delivery</h3>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={pincode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setPincode(value);
                    setPincodeError("");
                    setDeliveryInfo(null);
                  }}
                  placeholder="Enter Pincode"
                  maxLength={6}
                  className="flex-1 bg-black/50 border border-white/20 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-yellow-400 focus:outline-none"
                />
                <button
                  onClick={handleCheckPincode}
                  disabled={checkingPincode || pincode.length !== 6}
                  className="px-4 py-2 bg-yellow-400 text-black text-sm font-medium rounded hover:bg-yellow-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {checkingPincode ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                  ) : (
                    "Check"
                  )}
                </button>
              </div>

              {/* Pincode Error */}
              {pincodeError && (
                <div className="mt-3 flex items-start gap-2 text-red-400 text-xs">
                  <FiX className="shrink-0 mt-0.5" size={14} />
                  <p>{pincodeError}</p>
                </div>
              )}

              {/* Delivery Info */}
              {deliveryInfo?.available && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-start gap-2 text-green-400 text-xs">
                    <FiCheck className="shrink-0 mt-0.5" size={14} />
                    <p>Delivery available for pincode {pincode}</p>
                  </div>
                  {deliveryInfo.tat && (
                    <div className="flex items-start gap-2 text-gray-300 text-xs">
                      <FiClock className="shrink-0 mt-0.5" size={14} />
                      <p>
                        Estimated delivery:{" "}
                        <span className="font-semibold text-yellow-400">
                          {deliveryInfo.tat.expected_delivery_days || "3-5"}{" "}
                          days
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quantity Selector */}
            <div>
              <p className="text-sm text-gray-400 mb-3">Quantity</p>
              <div className="inline-flex items-center border border-white/30">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="px-4 py-3 hover:bg-white/5 hover:text-yellow-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={qty <= 1}
                >
                  −
                </button>
                <span className="px-6 py-3 border-x border-white/30 min-w-15 text-center">
                  {qty}
                </span>
                <button
                  onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                  className="px-4 py-3 hover:bg-white/5 hover:text-yellow-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={qty >= product.stock}
                >
                  +
                </button>
              </div>
            </div>

            {/* Add to Cart Button */}
            <div className="space-y-3">
              <Button
                disabled={
                  product.stock === 0 || qty > product.stock || addingToCart
                }
                onClick={handleAddToCart}
                className="w-full flex items-center justify-center gap-2 py-4 text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addingToCart ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
                    <span>Adding...</span>
                  </>
                ) : (
                  <>
                    <FiShoppingCart size={20} />
                    Add to Cart • ₹{(product.price * qty).toLocaleString()}
                  </>
                )}
              </Button>

              <p className="text-xs text-gray-500 text-center">
                {product.stock > 0
                  ? `${product.stock} units available`
                  : "This item is currently out of stock"}
              </p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
              <div className="flex items-start gap-3 text-sm">
                <FiPackage
                  className="text-yellow-400 shrink-0 mt-1"
                  size={20}
                />
                <div>
                  <p className="font-medium">Authentic</p>
                  <p className="text-gray-400 text-xs">100% Original</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <FiTruck className="text-yellow-400 shrink-0 mt-1" size={20} />
                <div>
                  <p className="font-medium">Free Shipping</p>
                  <p className="text-gray-400 text-xs">On orders above ₹999</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <FiShield className="text-yellow-400 shrink-0 mt-1" size={20} />
                <div>
                  <p className="font-medium">Secure</p>
                  <p className="text-gray-400 text-xs">Safe payment</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="border-t border-white/10 pt-10 mb-16">
          <div className="flex gap-4 md:gap-8 mb-8 overflow-x-auto pb-2">
            {["description", "reviews"].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`uppercase text-xs md:text-sm tracking-wider transition pb-2 whitespace-nowrap ${
                  tab === t
                    ? "text-yellow-400 border-b-2 border-yellow-400"
                    : "text-gray-400 hover:text-yellow-400"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="text-gray-300 leading-relaxed max-w-3xl">
            {tab === "description" && (
              <div>
                <p className="text-base md:text-lg mb-4">
                  {product.description || "No description available."}
                </p>
                <p className="text-sm text-gray-400">
                  This exquisite product combines traditional craftsmanship with
                  modern elegance, making it a perfect addition to your
                  collection.
                </p>
              </div>
            )}
            {tab === "reviews" && (
              <div className="space-y-6">
                {/* Add Review Form */}
                {userReviewId ? (
                  <div className="bg-linear-to-br from-blue-500/10 to-blue-500/5 border border-blue-400/30 rounded-xl p-4 md:p-6 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <FiCheck className="text-blue-400 text-2xl shrink-0" />
                      <div>
                        <h3 className="text-lg font-semibold text-blue-300 mb-1">
                          You've Already Reviewed This Product
                        </h3>
                        <p className="text-sm text-blue-200/80">
                          Thank you for sharing your experience! You can view
                          your review below.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-linear-to-br from-white/5 to-white/2 border border-white/10 rounded-xl p-4 md:p-6 backdrop-blur-sm">
                    <h3 className="text-lg md:text-xl font-semibold mb-4 flex items-center gap-2">
                      <FiStar className="text-yellow-400" size={20} />
                      Share Your Experience
                    </h3>

                    {/* Rating Selector */}
                    <div className="mb-4">
                      <label className="block text-sm text-gray-300 mb-3 font-medium">
                        Rate This Product
                      </label>
                      <div className="flex gap-2 flex-wrap">
                        {[5, 4, 3, 2, 1].map((r) => (
                          <button
                            key={r}
                            onClick={() => setRating(r)}
                            className={`flex items-center gap-1 px-3 py-2 rounded-lg border transition duration-200 ${
                              rating === r
                                ? "border-yellow-400 bg-yellow-400/20"
                                : "border-white/20 hover:border-yellow-400/50 hover:bg-white/5"
                            }`}
                          >
                            <FiStar
                              size={16}
                              className={
                                rating === r
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-400"
                              }
                            />
                            <span className="text-sm">{r}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Comment */}
                    <div className="mb-4">
                      <label className="block text-sm text-gray-300 mb-2 font-medium">
                        Your Review
                      </label>
                      <textarea
                        rows={3}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Share your thoughts about this product..."
                        maxLength={500}
                        className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-yellow-400 focus:outline-none transition text-sm md:text-base resize-none"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {comment.length} / 500 characters
                      </p>
                    </div>

                    <button
                      disabled={submitting || !comment.trim()}
                      onClick={handleAddReview}
                      className={`w-full md:w-auto border border-yellow-400 text-yellow-400 px-6 py-3 rounded-lg font-medium transition duration-200 ${
                        submitting || !comment.trim()
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:bg-yellow-400 hover:text-black hover:shadow-lg hover:shadow-yellow-400/50"
                      }`}
                    >
                      {submitting ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                          <span>Submitting...</span>
                        </div>
                      ) : (
                        "Submit Review"
                      )}
                    </button>
                  </div>
                )}

                {/* Existing Reviews */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-white">
                      Customer Reviews ({reviews.length})
                    </h4>
                  </div>

                  {reviews.length === 0 ? (
                    <div className="text-center py-12">
                      <FiStar className="text-gray-600 text-5xl mx-auto mb-3 opacity-50" />
                      <p className="text-gray-400">
                        No reviews yet. Be the first to review!
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {reviews.map((r) => (
                        <div
                          key={r._id}
                          className={`bg-linear-to-br from-white/5 to-white/2 border rounded-xl p-4 md:p-5 backdrop-blur-sm hover:border-yellow-400/30 transition duration-300 group ${
                            userReviewId === r._id
                              ? "border-blue-400/50 ring-1 ring-blue-400/30"
                              : "border-white/10"
                          }`}
                        >
                          {userReviewId === r._id && (
                            <div className="flex items-center gap-1 mb-2 pb-2 border-b border-blue-400/20">
                              <span className="text-xs bg-blue-400/20 text-blue-300 px-2 py-1 rounded border border-blue-400/30">
                                Your Review
                              </span>
                            </div>
                          )}

                          <div className="flex items-center justify-between mb-3">
                            <div className="flex gap-1">
                              {renderStars(r.rating)}
                            </div>
                            <span className="text-yellow-400 font-semibold text-sm">
                              {r.rating}.0
                            </span>
                          </div>

                          <p className="text-gray-300 text-sm md:text-base mb-3 leading-relaxed line-clamp-3">
                            "{r.comment}"
                          </p>

                          <div className="flex items-center gap-2 pt-3 border-t border-white/5">
                            <div className="w-8 h-8 rounded-full bg-yellow-400/20 flex items-center justify-center border border-yellow-400/30">
                              <span className="text-yellow-400 text-xs font-bold">
                                {r.user?.name?.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-300 truncate">
                                {r.user?.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                Verified Buyer
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Explore More */}
        {moreProducts.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-serif text-white mb-2">
                  Explore Our Collection
                </h2>
                <p className="text-gray-400 text-sm">
                  Discover more exquisite pieces
                </p>
              </div>
              <Link
                to="/products"
                className="text-yellow-400 hover:text-yellow-300 text-sm transition hidden md:block"
              >
                View All →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {moreProducts.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>

            <div className="mt-8 text-center md:hidden">
              <Link to="/products">
                <Button variant="outline" className="w-full">
                  View All Products
                </Button>
              </Link>
            </div>
          </section>
        )}
      </div>

      <style>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </main>
  );
}
