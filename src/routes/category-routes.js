const express = require("express");
const router = express.Router();
const categoryRepo = require("../db/repositories/category-repository");
const { authenticate, requireAdmin } = require("../middleware/auth");

router.post("/", authenticate, requireAdmin,async (req, res, next) => {
  try {
    const category = await categoryRepo.create(req.body);
    res.status(201).json(category);
  } catch (error) {
    next(error);
  }
});

router.get("/", async (_req, res, next) => {
  try {
    const categories = await categoryRepo.findAll();
    res.status(200).json(categories);
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const category = await categoryRepo.findById(req.params.id);
    if (!category) return res.status(404).json({ error: "Category not found" });
    res.status(200).json(category);
  } catch (error) {
    next(error);
  }
});

router.put("/:id", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const updated = await categoryRepo.update(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: "Category not found" });
    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", authenticate, requireAdmin, async (req, res, next) => {
  try {
    await categoryRepo.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
