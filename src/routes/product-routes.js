const express = require("express");
const router = express.Router();
const productRepo = require("../db/repositories/product-repository");
const paginate = require("../middleware/pagination");
const { authenticate, requireAdmin } = require("../middleware/auth");

router.post("/", authenticate, requireAdmin , async (req, res, next) => {
  try {
    const created = await productRepo.create(req.body);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

router.get("/", paginate, async (req, res, next) => {
  try {
    const { page, limit } = req.pagination;
    const products = await productRepo.findAll(page, limit);
    res.status(200).json({success: true, message: " Products fetched successfully", data:products });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const product = await productRepo.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.status(200).json(product);
  } catch (err) {
    next(err);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const updated = await productRepo.update(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: "Product not found" });
    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    await productRepo.delete(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
