import mongoose from "mongoose";
import Product from "../models/product.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import cloudinary from "../utils/cloudinary.js";

export const getAllProducts = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 12;
  const skip = (page - 1) * limit;

  const { category, minPrice, maxPrice, sort, search } = req.query;

  const query = {};

  if (category) {
    query.category = category;
  }

  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  if (search) {
    query.name = { $regex: search, $options: "i" };
  }

  let sortOption = { createdAt: -1 }; // newest first
  if (sort === "priceLow") sortOption = { price: 1 };
  if (sort === "priceHigh") sortOption = { price: -1 };

  const totalProducts = await Product.countDocuments(query);

  const products = await Product.find(query)
    .sort(sortOption)
    .skip(skip)
    .limit(limit);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        page,
        totalPages: Math.ceil(totalProducts / limit),
        totalProducts,
        products,
      },
      "Products fetched successfully"
    )
  );
});

export const getProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid product ID");
  }

  const product = await Product.findById(id);

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, product, "Product fetched successfully"));
});

export const createProduct = asyncHandler(async (req, res) => {
  const { name, description, price, category, images, stock, notes } =
    req.body;

  if (!name || !price || !category) {
    throw new ApiError(400, "Name, price and category are required");
  }

  const product = await Product.create({
    name,
    description: description || "",
    price,
    category,
    images: images || [],
    stock: stock || 0,
    notes: notes || {},
  });

  return res
    .status(201)
    .json(new ApiResponse(201, product, "Product created successfully"));
});

export const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid product ID");
  }

  const product = await Product.findById(id);

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  // Check if images are being updated
  if (req.body.images) {
    const oldImages = product.images || [];
    const newImages = req.body.images || [];
    
    // Find images that were removed (present in old but not in new)
    const removedImages = oldImages.filter(
      (oldImg) => !newImages.some((newImg) => newImg.public_id === oldImg.public_id)
    );

    // Delete removed images from Cloudinary
    for (const image of removedImages) {
      if (image.public_id) {
        try {
          await cloudinary.uploader.destroy(image.public_id);
          console.log(`Deleted image from cloudinary: ${image.public_id}`);
        } catch (error) {
          console.error(`Failed to delete image ${image.public_id}:`, error);
        }
      }
    }
  }

  const fields = [
    "name",
    "brand",
    "description",
    "price",
    "category",
    "images",
    "stock",
    "notes",
    "isActive",
  ];

  fields.forEach((field) => {
    if (req.body[field] !== undefined) {
      product[field] = req.body[field];
    }
  });

  const updatedProduct = await product.save();

  return res
    .status(200)
    .json(new ApiResponse(200, updatedProduct, "Product updated successfully"));
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid product ID");
  }

  const product = await Product.findById(id);

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  // Delete all product images from cloudinary
  if (product.images && product.images.length > 0) {
    for (const image of product.images) {
      if (image.public_id) {
        try {
          await cloudinary.uploader.destroy(image.public_id);
        } catch (error) {
          console.error(`Failed to delete image ${image.public_id}:`, error);
        }
      }
    }
  }

  await product.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Product deleted successfully"));
});

// Upload multiple images (max 4)
export const uploadImages = asyncHandler(async (req, res) => {
  console.log("Upload request received");
  console.log("Files received:", req.files?.length);
  
  if (!req.files || req.files.length === 0) {
    throw new ApiError(400, "No images uploaded");
  }

  if (req.files.length > 4) {
    throw new ApiError(400, "Maximum 4 images allowed");
  }

  const uploaded = [];

  try {
    for (let i = 0; i < req.files.length; i++) {
      console.log(`Uploading image ${i + 1}/${req.files.length}:`, req.files[i].filename);
      
      const result = await cloudinary.uploader.upload(req.files[i].path, {
        folder: "products",
        resource_type: "image",
      });

      console.log(`Image ${i + 1} uploaded:`, result.public_id);

      uploaded.push({
        url: result.secure_url,
        public_id: result.public_id,
        isCover: i === 0, // First image is cover
      });

      // Delete temp file after upload
      const fs = await import('fs');
      fs.unlinkSync(req.files[i].path);
    }

    console.log("Total images uploaded:", uploaded.length);

    res
      .status(200)
      .json(new ApiResponse(200, uploaded, "Images uploaded successfully"));
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw new ApiError(500, "Failed to upload images to cloudinary");
  }
});

// Delete single image from cloudinary
export const deleteImage = asyncHandler(async (req, res) => {
  const { public_id } = req.body;

  if (!public_id) {
    throw new ApiError(400, "Public ID is required");
  }

  try {
    await cloudinary.uploader.destroy(public_id);
    res.status(200).json(new ApiResponse(200, null, "Image deleted successfully"));
  } catch (error) {
    throw new ApiError(500, "Failed to delete image from cloudinary");
  }
});