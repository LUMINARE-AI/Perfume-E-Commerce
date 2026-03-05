import { useEffect, useState } from "react";
import api from "../api/axios";
import Modal from "../components/ui/Modal";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { FiX, FiUpload, FiImage, FiTrash2 } from "react-icons/fi";

const CATEGORIES = [
  { value: "men", label: "Men" },
  { value: "women", label: "Women" },
  { value: "oud", label: "Oud" },
  { value: "unisex", label: "Unisex" },
];

const STOCK_OPTIONS = [0, 10, 20, 30, 50, 100];

export default function EditProductModal({
  open,
  onClose,
  product,
  onSuccess,
}) {
  const [form, setForm] = useState({
    name: "",
    brand: "",
    price: "",
    category: "",
    description: "",
    stock: 0,
  });
  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [newImagePreviews, setNewImagePreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name || "",
        brand: product.brand || "BinKhalid",
        price: product.price || "",
        category: product.category || "",
        description: product.description || "",
        stock: product.stock || 0,
      });
      setExistingImages(product.images || []);
    }
  }, [product]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "stock" ? Number(value) : value,
    }));
  };

  const handleNewImageSelect = (e) => {
    const files = Array.from(e.target.files);
    const totalImages = existingImages.length + newImages.length + files.length;
    
    if (totalImages > 4) {
      setError(`Maximum 4 images allowed. You can add ${4 - (existingImages.length + newImages.length)} more.`);
      return;
    }

    const newImagesArray = [...newImages, ...files];
    setNewImages(newImagesArray);

    // Create previews
    const previews = files.map((file) => URL.createObjectURL(file));
    setNewImagePreviews([...newImagePreviews, ...previews]);
    setError("");
  };

  const removeExistingImage = (index) => {
    const imageToRemove = existingImages[index];
    
    if (existingImages.length + newImages.length <= 1) {
      setError("Product must have at least one image");
      return;
    }

    // Remove from local state only
    // The actual deletion from Cloudinary will happen on form submit
    const newExistingImages = existingImages.filter((_, i) => i !== index);
    
    // If removed image was cover, make first image as cover
    if (imageToRemove.isCover && newExistingImages.length > 0) {
      newExistingImages[0].isCover = true;
    }
    
    setExistingImages(newExistingImages);
    setError(""); // Clear any errors
  };

  const removeNewImage = (index) => {
    const newImagesArray = newImages.filter((_, i) => i !== index);
    const newPreviewsArray = newImagePreviews.filter((_, i) => i !== index);
    
    // Revoke URL
    URL.revokeObjectURL(newImagePreviews[index]);
    
    setNewImages(newImagesArray);
    setNewImagePreviews(newPreviewsArray);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (existingImages.length === 0 && newImages.length === 0) {
      setError("Product must have at least one image");
      return;
    }

    try {
      setLoading(true);

      let allImages = [...existingImages];

      // Upload new images if any
      if (newImages.length > 0) {
        const imageData = new FormData();
        newImages.forEach((image) => {
          imageData.append("images", image);
        });

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
        
        // If no existing images, first uploaded image becomes cover
        if (existingImages.length === 0) {
          uploadedImages[0].isCover = true;
        }
        
        allImages = [...allImages, ...uploadedImages];
      }

      // Ensure first image is marked as cover
      if (allImages.length > 0 && !allImages.some(img => img.isCover)) {
        allImages[0].isCover = true;
      }

      // Update product
      await api.put(
        `/products/${product._id}`,
        {
          name: form.name,
          brand: form.brand,
          description: form.description,
          price: Number(form.price),
          category: form.category,
          stock: form.stock,
          images: allImages,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Cleanup
      newImagePreviews.forEach((preview) => URL.revokeObjectURL(preview));
      
      setNewImages([]);
      setNewImagePreviews([]);
      onClose();
      onSuccess?.();
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Failed to update product");
    } finally {
      setLoading(false);
    }
  };

  if (!product) return null;

  const totalImages = existingImages.length + newImages.length;

  return (
    <Modal open={open} onClose={onClose} title="Edit Product">
      <form
        onSubmit={handleSubmit}
        className="space-y-4 -mx-4 px-4 md:mx-0 md:px-0"
      >
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 p-3 rounded">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Basic Info */}
        <div className="space-y-4">
          <Input
            label="Product Name"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            placeholder="Enter product name"
          />

          <Input
            label="Brand"
            name="brand"
            value={form.brand}
            onChange={handleChange}
            placeholder="Enter brand name"
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
        </div>

        {/* Category & Stock Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Category</label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className="w-full bg-black border border-white/20 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-400 transition"
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

          <div>
            <label className="block text-sm text-gray-400 mb-2">Stock</label>
            <select
              name="stock"
              value={form.stock}
              onChange={handleChange}
              className="w-full bg-black border border-white/20 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-400 transition"
            >
              {STOCK_OPTIONS.map((qty) => (
                <option key={qty} value={qty}>
                  {qty} units
                </option>
              ))}
            </select>
          </div>
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
            placeholder="Enter product description..."
            className="w-full bg-black border border-white/20 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-400 resize-none transition"
          />
        </div>

        {/* Images Section */}
        <div className="space-y-3">
          <label className="block text-sm text-gray-400">
            Product Images ({totalImages}/4)
          </label>

          {/* Existing Images */}
          {existingImages.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2">Current Images:</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {existingImages.map((img, index) => (
                  <div key={img.public_id} className="relative group">
                    <img
                      src={img.url}
                      alt={`Existing ${index + 1}`}
                      className="w-full h-24 object-cover border border-white/20 rounded"
                    />
                    {img.isCover && (
                      <span className="absolute top-1 left-1 bg-yellow-400 text-black text-xs px-2 py-0.5 rounded">
                        Cover
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeExistingImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition"
                      title="Delete image"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New Images Preview */}
          {newImagePreviews.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2">New Images:</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {newImagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`New ${index + 1}`}
                      className="w-full h-24 object-cover border border-green-500/50 rounded"
                    />
                    <span className="absolute top-1 left-1 bg-green-500 text-white text-xs px-2 py-0.5 rounded">
                      New
                    </span>
                    <button
                      type="button"
                      onClick={() => removeNewImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition"
                    >
                      <FiX size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add More Images */}
          {totalImages < 4 && (
            <div className="relative">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleNewImageSelect}
                className="hidden"
                id="new-image-upload"
              />
              <label
                htmlFor="new-image-upload"
                className="flex items-center justify-center gap-2 w-full border border-dashed border-white/30 hover:border-yellow-400 bg-white/5 hover:bg-white/10 py-3 cursor-pointer transition text-gray-400 hover:text-yellow-400"
              >
                <FiUpload size={18} />
                <span className="text-sm">
                  Add More Images ({4 - totalImages} remaining)
                </span>
              </label>
            </div>
          )}

          <p className="text-xs text-gray-500">
            First image will be used as cover. Max 4 images, 5MB each.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-white/10">
          <Button
            variant="outline"
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading} className="w-full sm:w-auto">
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                <span>Updating...</span>
              </div>
            ) : (
              "Update Product"
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}