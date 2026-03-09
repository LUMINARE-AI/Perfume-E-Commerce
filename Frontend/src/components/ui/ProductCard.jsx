import { Link, useNavigate } from "react-router-dom";

export default function ProductCard({ product }) {
  const navigate = useNavigate(); 
  
  const imageUrl = product?.images?.[0]?.url || product?.image || "/placeholder.jpg";
  const productId = product?._id || product?.id;

  return (
    <div className="bg-black border border-white/10 p-4 hover:border-yellow-400 transition group">
      <Link to={`/products/${productId}`} className="block overflow-hidden">
        <img
          src={imageUrl}
          alt={product.name}
          className="w-full h-56 object-cover transform group-hover:scale-105 transition"
          onError={(e) => {
            e.target.src = "/placeholder.jpg";
          }}
        />
      </Link>

      <div className="mt-4">
        <h3 className="text-sm text-white font-medium truncate">
          {product.name}
        </h3>
        <p className="text-xs text-gray-400 mt-1">{product.brand}</p>

        <div className="flex items-center justify-between mt-3">
          <span className="text-yellow-400 font-semibold">
            ₹{product.price?.toLocaleString()}
          </span>
          <button onClick={() => navigate(`/products/${productId}`)} className="text-xs border border-yellow-400 text-yellow-400 px-3 py-1 hover:bg-yellow-400 hover:text-black transition"> {/* ✅ Fix 2: onClick */}
            View
          </button>
        </div>
      </div>
    </div>
  );
}