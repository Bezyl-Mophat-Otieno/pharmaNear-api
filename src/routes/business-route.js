const express = require("express");
const router = express.Router();
const businessRepo = require("../db/repositories/business-repository");
const businessDocRepo = require("../db/repositories/business-documents-repository");
const paginate = require("../middleware/pagination");
const { authenticate, requireAdmin } = require("../middleware/auth");

/* ------------------------------------------------------------------
  CREATE BUSINESS (Tenant onboarding)
------------------------------------------------------------------ */
router.post("/", async (req, res, next) => {
  try {
    const created = await businessRepo.create(req.user.id, req.body); // owner_user_id is req.user.id
    res.status(201).json({
      success: true,
      message: "Business created successfully. Awaiting approval.",
      data: created
    });
  } catch (err) {
    next(err);
  }
});

/* ------------------------------------------------------------------
  GET ALL BUSINESSES (Admin view with optional filters & pagination)
------------------------------------------------------------------ */
router.get("/", authenticate, requireAdmin, paginate, async (req, res, next) => {
  try {
    const { page, limit } = req.pagination;
    const { status } = req.query; // optional filter by status: pending, approved, rejected

    const businesses = await businessRepo.findAll({ page, limit, status });

    res.status(200).json({
      success: true,
      message: "Businesses fetched successfully",
      data: businesses
    });
  } catch (err) {
    next(err);
  }
});

/* ------------------------------------------------------------------
  GET SINGLE BUSINESS (with documents)
------------------------------------------------------------------ */
router.get("/:id", authenticate, async (req, res, next) => {
  try {
    const business = await businessRepo.findById(req.params.id);
    if (!business) return res.status(404).json({ error: "Business not found" });

    const documents = await businessDocRepo.findByBusiness(req.params.id);

    res.status(200).json({
      success: true,
      data: { ...business, documents }
    });
  } catch (err) {
    next(err);
  }
});

/* ------------------------------------------------------------------
  UPDATE BUSINESS (Tenant can edit their own business)
------------------------------------------------------------------ */
router.put("/:id", authenticate, async (req, res, next) => {
  try {
    const updated = await businessRepo.update(req.params.id, req.user.id, req.body);
    if (!updated) return res.status(404).json({ error: "Business not found or access denied" });

    res.status(200).json({
      success: true,
      message: "Business updated successfully",
      data: updated
    });
  } catch (err) {
    next(err);
  }
});

/* ------------------------------------------------------------------
  DELETE BUSINESS (Admin only)
------------------------------------------------------------------ */
router.delete("/:id", authenticate, requireAdmin, async (req, res, next) => {
  try {
    await businessRepo.delete(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

/* ------------------------------------------------------------------
  ADMIN: APPROVE BUSINESS
------------------------------------------------------------------ */
router.post("/:id/approve", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const approved = await businessRepo.approve(req.params.id, req.user.id);
    res.status(200).json({
      success: true,
      message: "Business approved successfully",
      data: approved
    });
  } catch (err) {
    next(err);
  }
});

/* ------------------------------------------------------------------
  ADMIN: REJECT BUSINESS (with documents & rejection reason)
------------------------------------------------------------------ */
router.post("/:id/reject", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { rejectedDocumentIds, rejectionReason } = req.body;
    const rejectedBusiness = await businessRepo.reject(req.params.id, req.user.id, rejectedDocumentIds, rejectionReason);
    res.status(200).json({
      success: true,
      message: "Business rejected successfully",
      data: rejectedBusiness
    });
  } catch (err) {
    next(err);
  }
});
/* ------------------------------------------------------------------
  UPLOAD BUSINESS DOCUMENT (Tenant only)
------------------------------------------------------------------ */

router.post("/:id/documents", async (req, res, next) => {
  try {
    const { documentType, file } = req.body; // file: base64 or path
    const uploaded = await businessDocRepo.uploadDocument({
      businessId: req.params.id,
      documentType,
      file
    });

    res.status(201).json({
      success: true,
      message: "Document uploaded successfully",
      data: uploaded
    });
  } catch (err) {
    next(err);
  }
});

/* ------------------------------------------------------------------
  LIST BUSINESS DOCUMENTS (Tenant / Admin)
------------------------------------------------------------------ */
router.get("/:id/documents", authenticate, async (req, res, next) => {
  try {
    const documents = await businessDocRepo.findByBusiness(req.params.id);
    res.status(200).json({
      success: true,
      data: documents
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
