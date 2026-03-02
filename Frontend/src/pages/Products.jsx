import { useEffect, useState } from "react";
import { FiEdit2, FiTrash2, FiPlus } from "react-icons/fi";
import AddProductModal from "./AddProductModal";
import EditProductModal from "./EditProductModal";
import ConfirmDeleteModal from "../components/ui/ConfirmDeleteModal";
import api from "../api/axios";
import { Link } from "react-router-dom";

export default function Products() {
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [products, setProducts] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const [user, setUser] = useState(null);
  const isAdmin = user?.role === "admin";

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get("/products", {
        params: {
          page,
          limit: 16,
          sort,
        },
      });

      const payload = res.data?.data;
      setProducts(payload?.products || []);
      setTotalPages(payload?.totalPages || 1);
    } catch (err) {
      console.error(err);
      setError("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const fetchMe = async () => {
    try {
      const res = await api.get("/users/me");
      setUser(res.data.data);
    } catch (err) {
      console.error("Failed to fetch user data:", err);
      setUser(null); // not logged in
    }
  };

  useEffect(() => {
    fetchMe();
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, sort]);

  const askDeleteProduct = (id) => {
    setDeleteId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteProduct = async () => {
    try {
      await api.delete(`/products/${deleteId}`);
      setShowDeleteConfirm(false);
      setDeleteId(null);
      fetchProducts();
    } catch (err) {
      alert("Failed to delete product", err);
    }
  };

  if (loading) {
    return (
      <div className="bg-black min-h-screen flex items-center justify-center">
        <div className="text-white text-lg">Loading products...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-black min-h-screen flex items-center justify-center">
        <div className="text-red-400 text-lg">{error}</div>
      </div>
    );
  }

  return (
    <main className="bg-black min-h-screen pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-10 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-serif text-white mb-2">
              Our Collection
            </h1>
            <p className="text-gray-400 text-sm">
              Discover {products.length} exquisite pieces
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="bg-black border border-white/30 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-400 transition cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="priceLow">Price: Low to High</option>
              <option value="priceHigh">Price: High to Low</option>
            </select>

            {isAdmin && (
              <button
                onClick={() => setShowAdd(true)}
                className="flex items-center gap-2 text-sm border border-yellow-400 text-yellow-400 px-4 py-2.5 hover:bg-yellow-400 hover:text-black transition font-medium"
              >
                <FiPlus size={16} /> Add Product
              </button>
            )}
          </div>
        </div>

        {/* Products Grid */}
        {products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
            {products.map((product) => (
              <div
                key={product._id}
                className="group relative bg-black border border-white/10 overflow-hidden hover:border-yellow-400/50 transition-all duration-300"
              >
                {/* Product Image + Info wrapped in Link */}
                <Link to={`/products/${product._id}`} className="block">
                  <div className="relative aspect-square m-3 overflow-hidden bg-gray-900">
                    <img
                      src={product.images?.[0]?.url || "/placeholder.jpg"}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.target.src = "/placeholder.jpg";
                      }}
                    />

                    {/* Stock Badge */}
                    {product.stock <= 5 && product.stock > 0 && (
                      <div className="absolute top-2 left-2 bg-yellow-400 text-black text-[10px] md:text-xs font-semibold px-2 md:px-3 py-0.5 md:py-1">
                        Only {product.stock} left
                      </div>
                    )}
                    {product.stock === 0 && (
                      <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] md:text-xs font-semibold px-2 md:px-3 py-0.5 md:py-1">
                        Out of Stock
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-2.5 md:p-3.5">
                    <div className="mb-1.5 md:mb-2">
                      {product.brand && (
                        <p className="text-gray-400 text-[10px] md:text-xs uppercase tracking-wider mb-1">
                          {product.brand}
                        </p>
                      )}
                      <h3 className="text-white font-medium text-sm md:text-base line-clamp-2 group-hover:text-yellow-400 transition">
                        {product.name}
                      </h3>
                    </div>

                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <p className="text-yellow-400 text-base md:text-lg font-semibold">
                        ₹{product.price?.toLocaleString()}
                      </p>

                      {product.category && (
                        <span className="text-gray-500 text-[10px] md:text-xs border border-white/10 px-2 py-0.5">
                          {product.category}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>

                {/* Admin Controls (outside Link to avoid click conflict) */}
                {isAdmin && (
                  <div className="absolute top-2 right-2 flex gap-1.5 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setSelectedProduct(product);
                        setShowEdit(true);
                      }}
                      className="bg-black/90 backdrop-blur-sm p-2 text-white hover:text-green-400 hover:bg-black transition border border-white/20 rounded-sm"
                    >
                      <FiEdit2 size={14} />
                    </button>

                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        askDeleteProduct(product._id);
                      }}
                      className="bg-black/90 backdrop-blur-sm p-2 text-white hover:text-red-400 hover:bg-black transition border border-white/20 rounded-sm"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-12 flex-wrap">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 md:px-4 py-2 text-sm border border-white/20 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:border-yellow-400 hover:text-yellow-400 transition"
            >
              Previous
            </button>

            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`px-3 md:px-4 py-2 text-sm border transition ${
                  page === i + 1
                    ? "border-yellow-400 bg-yellow-400 text-black font-semibold"
                    : "border-white/20 text-white hover:border-yellow-400 hover:text-yellow-400"
                }`}
              >
                {i + 1}
              </button>
            ))}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 md:px-4 py-2 text-sm border border-white/20 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:border-yellow-400 hover:text-yellow-400 transition"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {isAdmin && (
        <AddProductModal
          open={showAdd}
          onClose={() => setShowAdd(false)}
          onSuccess={fetchProducts}
        />
      )}

      {/* Edit Product Modal */}
      {isAdmin && (
        <EditProductModal
          open={showEdit}
          product={selectedProduct}
          onClose={() => {
            setShowEdit(false);
            setSelectedProduct(null);
          }}
          onSuccess={fetchProducts}
        />
      )}

      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal
        open={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeleteId(null);
        }}
        onConfirm={confirmDeleteProduct}
      />
    </main>
  );
}
