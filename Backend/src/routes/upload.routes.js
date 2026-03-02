import express from "express";
import upload from "../middleware/upload.middleware.js";
import { uploadImage, deleteImage, replaceImage } from "../controllers/upload.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { isAdmin } from "../middleware/admin.middleware.js";

const router = express.Router();

router.post("/image", verifyJWT, isAdmin, upload.single("image"), uploadImage);
router.delete("/image", verifyJWT, isAdmin, deleteImage);
router.put("/image", verifyJWT, isAdmin, upload.single("image"), replaceImage);

export default router;
