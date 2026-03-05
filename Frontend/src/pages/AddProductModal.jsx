import { useState } from "react";
import api from "../api/axios";
import Modal from "../components/ui/Modal";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { FiX, FiUpload, FiImage } from "react-icons/fi";

const CATEGORIES = [
  { value: "men", label: "Men" },
  { value: "women", label: "Women" },
  { value: "oud", label: "Oud" },
  { value: "unisex", label: "Unisex" },
];

const STOCK_OPTIONS = [0, 10, 20, 30, 50, 100];

export default function AddProductModal({ open, onClose, onSuccess }) {
  const [form, setForm] = useState({
    name: "",
    brand: "BinKhalid",
    price: "",
    category: "",
    description: "",
    stock: 0,
  });
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "stock" ? Number(value) : value,
    }));
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    
    // Check total count including existing images
    const totalImages = images.length + files.length;
    
    if (totalImages > 4) {
      setError(`Maximum 4 images allowed. You can add ${4 - images.length} more.`);
      return;
    }

    // Add new images to existing ones
    const updatedImages = [...images, ...files];
    setImages(updatedImages);

    // Create previews for new images and combine with existing previews
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    const updatedPreviews = [...imagePreviews, ...newPreviews];
    setImagePreviews(updatedPreviews);
    
    setError("");
    
    // Reset the input value so the same file can be selected again if needed
    e.target.value = '';
  };

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    
    // Revoke the URL to free memory
    URL.revokeObjectURL(imagePreviews[index]);
    
    setImages(newImages);
    setImagePreviews(newPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!images.length) {
      setError("Please select at least one image");
      return;
    }
    if (!form.name || !form.price || !form.category) {
      setError("Name, price and category are required");
      return;
    }

    try {
      setLoading(true);

      // 1️⃣ Upload images to Cloudinary
      const imageData = new FormData();
      
      // IMPORTANT: Append each image separately with the same field name "images"
      for (let i = 0; i < images.length; i++) {
        imageData.append("images", images[i]);
      }

      console.log("Uploading images:", images.length); // Debug log

      const uploadRes = await api.post(
        "/products/images",
        imageData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const uploadedImages = uploadRes.data.data;
      
      console.log("Uploaded images:", uploadedImages); // Debug log

      // 2️⃣ Create product
      await api.post(
        "/products",
        {
          name: form.name,
          brand: form.brand,
          description: form.description,
          price: Number(form.price),
          category: form.category,
          stock: form.stock,
          images: uploadedImages,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Cleanup
      imagePreviews.forEach((preview) => URL.revokeObjectURL(preview));
      
      onClose();
      onSuccess?.();

      // Reset form
      setForm({
        name: "",
        brand: "BinKhalid",
        price: "",
        category: "",
        description: "",
        stock: 0,
      });
      setImages([]);
      setImagePreviews([]);
    } catch (err) {
      console.error("Upload error:", err);
      console.error("Error response:", err?.response?.data);
      setError(err?.response?.data?.message || "Failed to add product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add New Product">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 p-3 rounded text-red-400 text-sm">
            {error}
          </div>
        )}

        <Input
          label="Product Name"
          name="name"
          value={form.name}
          onChange={handleChange}
          required
          placeholder="Enter product name"
        />

        <Input
          label="Price (₹)"
          name="price"
          type="number"
          value={form.price}
          onChange={handleChange}
          required
          placeholder="0"
          min="0"
        />

        {/* Category Dropdown */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">
            Category
          </label>
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            className="w-full bg-black border border-white/20 px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-400"
            required
          >
            <option value="">Select Category</option>
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* Stock Dropdown */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Stock</label>
          <select
            name="stock"
            value={form.stock}
            onChange={handleChange}
            className="w-full bg-black border border-white/20 px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-400"
          >
            {STOCK_OPTIONS.map((qty) => (
              <option key={qty} value={qty}>
                {qty} units
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">
            Description
          </label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={3}
            className="w-full bg-black border border-white/20 px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-400 resize-none"
            placeholder="Short product description..."
          />
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">
            Product Images (max 4) *
          </label>
          
          {/* Image Previews */}
          {imagePreviews.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative group">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-24 object-cover border border-white/20 rounded"
                  />
                  {index === 0 && (
                    <span className="absolute top-1 left-1 bg-yellow-400 text-black text-xs px-2 py-0.5 rounded">
                      Cover
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition"
                  >
                    <FiX size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload Button */}
          <div className="relative">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
              id="image-upload"
            />
            <label
              htmlFor="image-upload"
              className={`flex items-center justify-center gap-2 w-full border border-dashed hover:border-yellow-400 bg-white/5 hover:bg-white/10 py-4 cursor-pointer transition text-gray-400 hover:text-yellow-400 ${
                imagePreviews.length >= 4 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'border-white/30'
              }`}
              style={{ pointerEvents: imagePreviews.length >= 4 ? 'none' : 'auto' }}
            >
              {imagePreviews.length === 0 ? (
                <>
                  <FiUpload size={20} />
                  <span className="text-sm">Click to upload images (max 4)</span>
                </>
              ) : imagePreviews.length >= 4 ? (
                <>
                  <FiImage size={20} />
                  <span className="text-sm">
                    Maximum 4 images reached
                  </span>
                </>
              ) : (
                <>
                  <FiUpload size={20} />
                  <span className="text-sm">
                    {imagePreviews.length} / 4 images - Click to add more
                  </span>
                </>
              )}
            </label>
          </div>
          
          <p className="text-xs text-gray-500 mt-2">
            First image will be used as cover image. Supported formats: JPG, PNG, GIF, WEBP (max 5MB each)
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                <span>Adding...</span>
              </div>
            ) : (
              "Add Product"
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}