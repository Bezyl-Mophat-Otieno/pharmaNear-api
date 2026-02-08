const express = require("express");
const multer = require("multer");
const ApiError = require("../utils/ApiError");
const { authenticate, requireAdmin } = require("../middleware/auth");
const { CloudinaryService } = require("../utils/cloudinary");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * @route POST /api/cloudinary/upload
 * @desc Upload image to Cloudinary
 */
router.post("/", authenticate, requireAdmin, upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) {
      throw ApiError.badRequest("No file uploaded");
    }

    // Convert file buffer to base64
    const fileBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;

    const result = await CloudinaryService.uploadImage(fileBase64, {
      folder: "beeq/products",
    });

    res.status(201).json({
      success: true,
      message: "Image uploaded successfully",
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @route DELETE /api/cloudinary/:publicId
 * @desc Delete image from Cloudinary
 */
router.delete("/:publicId", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { publicId } = req.params;

    if (!publicId) {
      throw ApiError.badRequest("Missing publicId");
    }

    const deleted = await CloudinaryService.deleteImage(publicId);

    if (!deleted) {
      throw ApiError.internal("Failed to delete image");
    }

    res.status(200).json({
      success: true,
      message: "Image deleted successfully",
      data: { publicId },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @route GET /api/cloudinary/:publicId
 * @desc Get image details
 */
router.get("/:publicId", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { publicId } = req.params;

    if (!publicId) {
      throw ApiError.badRequest("Missing publicId");
    }

    const details = await CloudinaryService.getImageDetails(publicId);

    res.status(200).json({
      success: true,
      message: "Image details retrieved successfully",
      data: details,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
