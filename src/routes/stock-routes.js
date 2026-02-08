const express = require("express");
const router = express.Router();
const stockRepo = require("../db/repositories/stock-repository");
const { authenticate, requireAdmin } = require("../middleware/auth");
const paginate = require("../middleware/pagination");
const ApiError = require("../utils/ApiError");

// Get all products with stock information
router.get("/", authenticate, requireAdmin, paginate, async (req, res, next) => {
  try {
    const { page, limit } = req.pagination;
    const { search, categoryId, status } = req.query;

    const filters = {
      search: search || "",
      categoryId,
      status,
      limit: parseInt(limit, 10) || 50,
      offset: (page - 1) * limit,
    };

    const products = await stockRepo.getAllWithStock(filters);
    
    res.status(200).json({
      success: true,
      message: "Stock data retrieved successfully",
      data: products,
    });
  } catch (err) {
    next(err);
  }
});

// Get stock statistics
router.get("/stats", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const stats = await stockRepo.getStockStats();
    
    res.status(200).json({
      success: true,
      message: "Stock statistics retrieved successfully",
      data: stats,
    });
  } catch (err) {
    next(err);
  }
});

// Get low stock products
router.get("/low", authenticate, requireAdmin, paginate, async (req, res, next) => {
  try {
    const { page, limit } = req.pagination;
    const products = await stockRepo.getLowStock(
      parseInt(limit, 10) || 20,
      (page - 1) * limit
    );
    
    res.status(200).json({
      success: true,
      message: "Low stock products retrieved successfully",
      data: products,
    });
  } catch (err) {
    next(err);
  }
});

// Get out of stock products
router.get("/out", authenticate, requireAdmin, paginate, async (req, res, next) => {
  try {
    const { page, limit } = req.pagination;
    const products = await stockRepo.getOutOfStock(
      parseInt(limit, 10) || 20,
      (page - 1) * limit
    );
    
    res.status(200).json({
      success: true,
      message: "Out of stock products retrieved successfully",
      data: products,
    });
  } catch (err) {
    next(err);
  }
});

// Get top selling products
router.get("/top-sellers", authenticate, requireAdmin, paginate, async (req, res, next) => {
  try {
    const { page, limit } = req.pagination;
    const products = await stockRepo.getTopSellingProducts(
      parseInt(limit, 10) || 10,
      (page - 1) * limit
    );
    
    res.status(200).json({
      success: true,
      message: "Top selling products retrieved successfully",
      data: products,
    });
  } catch (err) {
    next(err);
  }
});

// Update product stock
router.patch("/:productId", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { newStock, reason } = req.body;
    const { productId } = req.params;

    if (typeof newStock !== "number" || newStock < 0) {
      throw new ApiError(400, "Invalid stock value. Must be a non-negative number.");
    }

    const result = await stockRepo.updateProductStock(productId, newStock, reason);
    
    res.status(200).json({
      success: true,
      message: "Stock updated successfully",
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

// Restock product (add to existing stock)
router.patch("/:productId/restock", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { quantity, reason } = req.body;
    const { productId } = req.params;

    if (typeof quantity !== "number" || quantity <= 0) {
      throw new ApiError(400, "Invalid quantity. Must be a positive number.");
    }

    const result = await stockRepo.restockProduct(productId, quantity, reason);
    
    res.status(200).json({
      success: true,
      message: "Product restocked successfully",
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
