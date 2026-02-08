const express = require("express");
const router = express.Router();
const feedbackRepo = require("../db/repositories/feedback-repository");
const { authenticate } = require("../middleware/auth");
const paginate = require("../middleware/pagination");

router.post("/:productId", async (req, res, next) => {
  try {
    const { name, rating, comment } = req.body;
    const { productId } = req.params;

    if (!name || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Name and rating (1-5) are required" });
    }

    const result = await feedbackRepo.addFeedback({ productId, name, rating, comment });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

// Get feedback for a product (public)
router.get("/product/:productId", async (req, res, next) => {
  try {
    const feedback = await feedbackRepo.getFeedbackByProduct(req.params.productId);
    res.status(200).json(feedback);
  } catch (err) {
    next(err);
  }
});

// Admin: List all feedback
router.get("/", authenticate, paginate,async (req, res, next) => {
  try {
    const { page, limit } = req.pagination;
    const offset = (page - 1) * limit;
    const feedback = await feedbackRepo.getAllFeedback({ limit, offset });
    res.status(200).json(feedback);
  } catch (err) {
    next(err);
  }
});

// Admin: Delete feedback
router.delete("/:id", authenticate, async (req, res, next) => {
  try {
    await feedbackRepo.deleteFeedback(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// Admin: Update feedback
router.put("/:id", authenticate, async (req, res, next) => {
  try {
    const { name, rating, comment } = req.body;
    const updated = await feedbackRepo.updateFeedback(req.params.id, { name, rating, comment });
    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
