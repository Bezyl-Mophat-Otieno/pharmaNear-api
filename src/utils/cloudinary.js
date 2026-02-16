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
        folder: options.folder || "pharma-near/images",
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
   * Upload PDF file to Cloudinary
   */
  static async uploadPDF(file, options = {}) {
    try {
      const uploadOptions = {
        folder: options.folder || "pharma-near/documents",
        resource_type: "raw", // 'raw' is used for non-image files like PDFs
        format: "pdf",
        overwrite: options.overwrite || true,
        ...options,
      }

      const result = await cloudinary.uploader.upload(file, uploadOptions)

      return {
        public_id: result.public_id,
        secure_url: result.secure_url,
        format: result.format,
        resource_type: result.resource_type,
        bytes: result.bytes,
        original_filename: result.original_filename,
      }
    } catch (error) {
      console.error("Cloudinary PDF upload error:", error)
      throw new Error("Failed to upload PDF to Cloudinary")
    }
  }

  /**
   * Upload any file type to Cloudinary (images, PDFs, documents, etc.)
   */
  static async uploadFile(file, options = {}) {
    try {
      // Determine resource type based on file extension or provided option
      const fileExtension = file.split('.').pop()?.toLowerCase()
      const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(fileExtension)
      
      const uploadOptions = {
        folder: options.folder || "pharma-near",
        resource_type: options.resource_type || (isImage ? "image" : "raw"),
        overwrite: options.overwrite || true,
        ...options,
      }

      const result = await cloudinary.uploader.upload(file, uploadOptions)

      return {
        public_id: result.public_id,
        secure_url: result.secure_url,
        format: result.format,
        resource_type: result.resource_type,
        bytes: result.bytes,
        original_filename: result.original_filename,
        ...(isImage && {
          width: result.width,
          height: result.height,
        }),
      }
    } catch (error) {
      console.error("Cloudinary file upload error:", error)
      throw new Error("Failed to upload file to Cloudinary")
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
   * Delete file (PDF, document, etc.) from Cloudinary
   */
  static async deleteFile(publicId, resourceType = "raw") {
    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
      })
      return result.result === "ok"
    } catch (error) {
      console.error("Cloudinary delete file error:", error)
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
