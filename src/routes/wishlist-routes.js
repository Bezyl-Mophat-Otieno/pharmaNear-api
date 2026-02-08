const express = require("express");
const router = express.Router();
const wishlistRepo = require("../db/repositories/wishlist-repository");
const { authenticate } = require("../middleware/auth");

router.get("/", authenticate, async (req, res, next) => {
  try {
    const data = await wishlistRepo.getAll(req.user.id);
    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
});

router.post("/:productId", authenticate, async (req, res, next) => {
  try {
    const result = await wishlistRepo.add(req.user.id, req.params.productId);
    res.status(201).json({ message: "Added to wishlist", data: result });
  } catch (err) {
    next(err);
  }
});

router.delete("/:productId", authenticate, async (req, res, next) => {
  try {
    await wishlistRepo.remove(req.user.id, req.params.productId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
