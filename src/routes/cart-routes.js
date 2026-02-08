const express = require("express");
const router = express.Router();
const cartRepo = require("../db/repositories/cart-repository");
const { authenticate } = require("../middleware/auth");

router.get("/", authenticate, async (req, res, next) => {
  try {
    const cart = await cartRepo.getAll(req.user.id);
    res.status(200).json(cart);
  } catch (err) {
    next(err);
  }
});

router.post("/:productId", authenticate, async (req, res, next) => {
  try {
    const { quantity } = req.body;
    if (!quantity || quantity <= 0) return res.status(400).json({ error: "Invalid quantity" });

    const item = await cartRepo.addOrUpdate(req.user.id, req.params.productId, quantity);
    res.status(200).json({ message: "Cart updated", data: item });
  } catch (err) {
    next(err);
  }
});

router.delete("/:productId", authenticate, async (req, res, next) => {
  try {
    await cartRepo.remove(req.user.id, req.params.productId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

router.delete("/", authenticate, async (req, res, next) => {
  try {
    await cartRepo.clearCart(req.user.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
