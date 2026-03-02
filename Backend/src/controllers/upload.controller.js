import cloudinary from "../utils/cloudinary.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

export const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "No file uploaded");
  }

  const uploadResult = await new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder: "binkhalid/products" }, (error, result) => {
        if (error) reject(error);
        resolve(result);
      })
      .end(req.file.buffer);
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
      },
      "Image uploaded successfully"
    )
  );
});

export const deleteImage = asyncHandler(async (req, res) => {
  const { public_id } = req.body;

  if (!public_id) {
    throw new ApiError(400, "public_id is required to delete image");
  }

  const result = await cloudinary.uploader.destroy(public_id);

  if (result.result !== "ok") {
    throw new ApiError(400, "Failed to delete image from Cloudinary");
  }

  return res.status(200).json(
    new ApiResponse(200, null, "Image deleted successfully")
  );
});

export const replaceImage = asyncHandler(async (req, res) => {
  const { old_public_id } = req.body;

  if (!old_public_id) {
    throw new ApiError(400, "old_public_id is required");
  }

  if (!req.file) {
    throw new ApiError(400, "New image file is required");
  }

  // Delete old image
  await cloudinary.uploader.destroy(old_public_id);

  // Upload new image
  const uploadResult = await new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        { folder: "binkhalid/products" },
        (error, result) => {
          if (error) reject(error);
          resolve(result);
        }
      )
      .end(req.file.buffer);
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
      },
      "Image replaced successfully"
    )
  );
});

