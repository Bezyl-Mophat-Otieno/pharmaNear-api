const express = require("express");
const router = express.Router();
const productRepo = require("../db/repositories/product-repository");
const paginate = require("../middleware/pagination");
const { authenticate, requireAdmin } = require("../middleware/auth");
const businessRepository = require("../db/repositories/business-repository");

router.post("/", authenticate, requireAdmin , async (req, res, next) => {
  try {
    const [business] = await businessRepository.findByOwner(req.user.user_id);
    if(!business) return res.status(404).json({success: false, message: "Business not found!"})
    const created = await productRepo.create(req.body, business.business_id);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

router.get("/", paginate, async (req, res, next) => {
  try {
    const { page, limit } = req.pagination;
    const {userId} = req.query
    const [business] = await businessRepository.findByOwner(userId)
    let products = [];
    if(!business) {
      products = await productRepo.findAll(page, limit)
    } else {
        products = await productRepo.findAll(page, limit, business.business_id)
    } 
    if(!products.length > 0) return res.status(404).json({success: false, message: "No products found!"})
    res.status(200).json({success: true, message: "Products fetched successfully", data:products });
  } catch (err) {
    next(err);
  }
});
router.get("/admin", authenticate ,paginate, async (req, res, next) => {
  try {
    const { page, limit } = req.pagination;
    const userId = req.user.user_id
    const [business] = await businessRepository.findByOwner(userId)
    if(!business) return res.status(404).json({success: false, message: "Business not found!"})
    const products = await productRepo.findAll(page, limit, business.business_id);
    res.status(200).json({success: true, message: "Products fetched successfully", data:products });
  } catch (err) {
    next(err);
  }
});


/* ------------------------------------------------------------------
  SEARCH PRODUCTS (Search + optional geo)
------------------------------------------------------------------ */
router.get("/search", async (req, res, next) => {
  try {
    const { search, latitude, longitude, radiusKm } = req.query;
    const products = await productRepo.searchProducts({
      query: search,
      userLat: latitude ? parseFloat(latitude) : null,
      userLng: longitude ? parseFloat(longitude) : null,
      radiusKm: radiusKm ? parseFloat(radiusKm) : undefined
    });

    res.status(200).json({
      success: true,
      message: "Products fetched successfully",
      data: products
    });
  } catch (err) {
    next(err);
  }
});

/* ------------------------------------------------------------------
  GET PRODUCT DETAILS (with business info + distance)
------------------------------------------------------------------ */
router.get("/location-based/:id", async (req, res, next) => {
  try {
    const { lat, lng } = req.query;

    const product = await productRepo.findByIdWithBusiness(
      req.params.id,
      lat ? parseFloat(lat) : null,
      lng ? parseFloat(lng) : null
    );

    if (!product) return res.status(404).json({ error: "Product not found" });

    res.status(200).json({
      success: true,
      data: product
    });
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
