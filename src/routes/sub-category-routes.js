const express = require("express");
const router = express.Router();
const subcategoryRepo = require("../db/repositories/sub-categories-repository");
const { authenticate, requireAdmin } = require("../middleware/auth");

router.post("/", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const subcategory = await subcategoryRepo.create(req.body);
    res.status(201).json(subcategory);
  } catch (error) {
    next(error);
  }
});

router.get("/category/:category_id", async (req, res, next) => {
  try {
    const subcategories = await subcategoryRepo.findAll(req.params.category_id);
    res.status(200).json(subcategories);
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const subcategory = await subcategoryRepo.findById(req.params.id);
    if (!subcategory) return res.status(404).json({ error: "Subcategory not found" });
    res.status(200).json(subcategory);
  } catch (error) {
    next(error);
  }
});

router.get("/:id/count", async (req, res, next) => {
  try {
    const count = await subcategoryRepo.countProductsInSubcategory(req.params.id);
    res.status(200).json({ count });
  } catch (error) {
    next(error);
  }
});

router.put("/:id", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const updated = await subcategoryRepo.update(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: "Subcategory not found" });
    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", authenticate, requireAdmin,async (req, res, next) => {
  try {
    await subcategoryRepo.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
