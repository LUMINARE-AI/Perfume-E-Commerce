import { useEffect, useState } from "react";
import { FiStar, FiTrash2, FiSearch, FiPackage, FiUser } from "react-icons/fi";
import { getAllReviewsApi, deleteReviewApi } from "../api/review";
import { useToast } from "../contexts/ToastContext";

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRating, setFilterRating] = useState("all");
  const [deleteLoading, setDeleteLoading] = useState(null);
  const { success, error: showError } = useToast();

  useEffect(() => {
    fetchReviews();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await getAllReviewsApi();
      setReviews(res.data.data || []);
    } catch (err) {
      showError(err.response?.data?.message || "Failed to fetch reviews");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (reviewId) => {
    if (!window.confirm("Are you sure you want to delete this review?")) {
      return;
    }

    try {
      setDeleteLoading(reviewId);
      await deleteReviewApi(reviewId);
      setReviews((prev) => prev.filter((review) => review._id !== reviewId));
      success("Review deleted successfully");
    } catch (err) {
      showError(err.response?.data?.message || "Failed to delete review");
    } finally {
      setDeleteLoading(null);
    }
  };

  const filteredReviews = reviews.filter((review) => {
    const matchesSearch =
      review.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.comment?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRating =
      filterRating === "all" || review.rating === parseInt(filterRating);
    
    return matchesSearch && matchesRating;
  });

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-400">Loading reviews...</p>
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
            Reviews Management
          </h1>
          <p className="text-gray-400 mt-1">
            {filteredReviews.length} {filteredReviews.length === 1 ? 'review' : 'reviews'} found
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="border border-white/10 bg-yellow-500/10 p-4">
          <p className="text-xs text-gray-400 mb-1">Total Reviews</p>
          <p className="text-2xl font-bold text-yellow-400">{reviews.length}</p>
        </div>
        <div className="border border-white/10 bg-green-500/10 p-4">
          <p className="text-xs text-gray-400 mb-1">Average Rating</p>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold text-green-400">{averageRating}</p>
            <FiStar className="text-green-400 fill-green-400" size={20} />
          </div>
        </div>
        <div className="border border-white/10 bg-blue-500/10 p-4">
          <p className="text-xs text-gray-400 mb-1">5 Star Reviews</p>
          <p className="text-2xl font-bold text-blue-400">
            {reviews.filter((r) => r.rating === 5).length}
          </p>
        </div>
        <div className="border border-white/10 bg-red-500/10 p-4">
          <p className="text-xs text-gray-400 mb-1">Low Ratings (≤2)</p>
          <p className="text-2xl font-bold text-red-400">
            {reviews.filter((r) => r.rating <= 2).length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Search */}
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by user, product or comment..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 pl-10 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400 transition"
          />
        </div>

        {/* Rating Filter */}
        <select
          value={filterRating}
          onChange={(e) => setFilterRating(e.target.value)}
          className="bg-white/5 border border-white/10 px-4 py-3 text-sm text-white focus:outline-none focus:border-yellow-400 transition"
        >
          <option value="all">All Ratings</option>
          <option value="5">5 Stars</option>
          <option value="4">4 Stars</option>
          <option value="3">3 Stars</option>
          <option value="2">2 Stars</option>
          <option value="1">1 Star</option>
        </select>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.length === 0 ? (
          <div className="border border-white/10 bg-white/5 p-12 text-center">
            <FiStar className="mx-auto text-gray-600 mb-3" size={48} />
            <p className="text-gray-400">No reviews found</p>
          </div>
        ) : (
          filteredReviews.map((review) => (
            <div
              key={review._id}
              className="border border-white/10 bg-white/5 backdrop-blur-sm p-4 md:p-6 hover:border-yellow-400/50 transition group"
            >
              <div className="flex flex-col md:flex-row md:items-start gap-4">
                {/* Left Section - User & Product Info */}
                <div className="flex-1 space-y-3">
                  {/* User */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-yellow-400/20 border border-yellow-400/30 flex items-center justify-center text-yellow-400 font-semibold shrink-0">
                      {review.user?.name?.charAt(0).toUpperCase() || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium">{review.user?.name || "Unknown User"}</p>
                      <p className="text-xs text-gray-400 truncate">{review.user?.email}</p>
                    </div>
                  </div>

                  {/* Product */}
                  <div className="flex items-center gap-2 text-sm text-gray-400 pl-13">
                    <FiPackage size={14} />
                    <span className="truncate">{review.product?.name || "Product Deleted"}</span>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-1 pl-13">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <FiStar
                        key={star}
                        className={`
                          ${star <= review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-600"}
                        `}
                        size={16}
                      />
                    ))}
                    <span className="ml-2 text-sm text-gray-400">
                      {review.rating}.0
                    </span>
                  </div>

                  {/* Comment */}
                  {review.comment && (
                    <div className="pl-13 pt-2">
                      <p className="text-gray-300 text-sm leading-relaxed">
                        "{review.comment}"
                      </p>
                    </div>
                  )}

                  {/* Date */}
                  <div className="text-xs text-gray-500 pl-13">
                    {new Date(review.createdAt).toLocaleString()}
                  </div>
                </div>

                {/* Right Section - Delete Button */}
                <div className="flex md:flex-col gap-2">
                  <button
                    onClick={() => handleDelete(review._id)}
                    disabled={deleteLoading === review._id}
                    className="
                      px-4 py-2 border border-red-400/30 bg-red-500/10 text-red-400
                      hover:bg-red-500/20 hover:border-red-400
                      disabled:opacity-50 disabled:cursor-not-allowed
                      text-sm font-medium flex items-center gap-2
                      group-hover:scale-105 transition-transform
                    "
                  >
                    {deleteLoading === review._id ? (
                      <>
                        <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin"></div>
                        <span className="hidden md:inline">Deleting...</span>
                      </>
                    ) : (
                      <>
                        <FiTrash2 size={16} />
                        <span className="hidden md:inline">Delete</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Rating Distribution */}
      {reviews.length > 0 && (
        <div className="border border-white/10 bg-white/5 p-6 mt-8">
          <h3 className="text-lg font-semibold text-white mb-4">Rating Distribution</h3>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = reviews.filter((r) => r.rating === rating).length;
              const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
              
              return (
                <div key={rating} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-20">
                    <span className="text-sm text-gray-400">{rating}</span>
                    <FiStar className="text-yellow-400 fill-yellow-400" size={14} />
                  </div>
                  <div className="flex-1 h-3 bg-white/5 border border-white/10 relative overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 bg-linear-to-r from-yellow-500 to-yellow-400"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="w-16 text-right text-sm text-gray-400">
                    {count} ({percentage.toFixed(0)}%)
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}