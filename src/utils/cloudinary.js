import { v2 as cloudinary } from "cloudinary"

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export class CloudinaryService {
  /**
   * Upload image to Cloudinary
   */
  static async uploadImage(file, options = {}) {
    try {
      const uploadOptions = {
        folder: options.folder || "beeq",
        resource_type: options.resource_type || "image",
        overwrite: options.overwrite || true,
        ...options,
      }

      const result = await cloudinary.uploader.upload(file, uploadOptions)

      return {
        public_id: result.public_id,
        secure_url: result.secure_url,
        width: result.width,
        height: result.height,
        format: result.format,
        resource_type: result.resource_type,
        bytes: result.bytes,
      }
    } catch (error) {
      console.error("Cloudinary upload error:", error)
      throw new Error("Failed to upload image to Cloudinary")
    }
  }

  /**
   * Delete image from Cloudinary
   */
  static async deleteImage(publicId) {
    try {
      const result = await cloudinary.uploader.destroy(publicId)
      return result.result === "ok"
    } catch (error) {
      console.error("Cloudinary delete error:", error)
      return false
    }
  }

  /**
   * Generate optimized image URL
   */
  static generateOptimizedUrl(
    publicId,
    options = {},
  ) {
    return cloudinary.url(publicId, {
      secure: true,
      ...options,
    })
  }

  /**
   * Get image details
   */
  static async getImageDetails(publicId) {
    try {
      const result = await cloudinary.api.resource(publicId)
      return result
    } catch (error) {
      console.error("Cloudinary get details error:", error)
      throw new Error("Failed to get image details")
    }
  }
}
