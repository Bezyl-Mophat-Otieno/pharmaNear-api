const express = require("express");
const router = express.Router();
const businessDocRepo = require("../db/repositories/business-documents-repository");
const { authenticate } = require("../middleware/auth");

/* ------------------------------------------------------------------
  UPLOAD BUSINESS DOCUMENT
  - Tenant uploads their business documents (license, permit, etc.)
------------------------------------------------------------------ */
router.post("/:businessId", authenticate, async (req, res, next) => {
  try {
    const { documentType, file } = req.body; // file: base64 / path

    const uploaded = await businessDocRepo.uploadDocument({
      businessId: req.params.businessId,
      documentType,
      file,
      uploadedBy: req.user.id
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
  LIST ALL DOCUMENTS FOR A BUSINESS
  - Tenant sees own documents
  - Admin can see all documents
------------------------------------------------------------------ */
router.get("/:businessId", authenticate, async (req, res, next) => {
  try {
    const documents = await businessDocRepo.findByBusiness(req.params.businessId);
    res.status(200).json({
      success: true,
      data: documents
    });
  } catch (err) {
    next(err);
  }
});

/* ------------------------------------------------------------------
  GET SINGLE DOCUMENT
  - Optional: if you want to fetch specific document details
------------------------------------------------------------------ */
router.get("/:businessId/:docId", authenticate, async (req, res, next) => {
  try {
    const doc = await businessDocRepo.findById(req.params.docId);
    if (!doc) return res.status(404).json({ error: "Document not found" });

    res.status(200).json({
      success: true,
      data: doc
    });
  } catch (err) {
    next(err);
  }
});

/* ------------------------------------------------------------------
  DELETE DOCUMENT
  - Tenant deletes own document
  - Admin can delete any document
------------------------------------------------------------------ */
router.delete("/:businessId/:docId", authenticate, async (req, res, next) => {
  try {
    const deleted = await businessDocRepo.deleteDocument(req.params.docId, req.user.id, req.user.isAdmin);
    if (!deleted) return res.status(404).json({ error: "Document not found or access denied" });

    res.status(200).json({
      success: true,
      message: "Document deleted successfully"
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
