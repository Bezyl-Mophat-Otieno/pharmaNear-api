const express = require("express");
const multer = require("multer");
const router = express.Router();
const db = require("../db");
const businessRepo = require("../db/repositories/business-repository");
const businessDocRepo = require("../db/repositories/business-documents-repository");
const userRepo = require("../db/repositories/user-repository");
const paginate = require("../middleware/pagination");
const { authenticate, requireAdmin } = require("../middleware/auth");
const ApiError = require("../utils/ApiError");
const { CloudinaryService } = require("../utils/cloudinary");

const upload = multer({ storage: multer.memoryStorage() });

/* ------------------------------------------------------------------
  SELLER ONBOARDING (Complete registration with business + documents)
------------------------------------------------------------------ */
router.post("/onboard", async (req, res, next) => {
  try {
    const { seller, documents, userId } = req.body;

    // Validate user is a seller
    const user = await userRepo.findById(userId);
    if (!user || user.role !== 'seller') {
      throw ApiError.forbidden("Only sellers can onboard businesses");
    }

    // Check if seller already has a business
    const existingBusiness = await businessRepo.findByOwner(userId);
    if (existingBusiness && existingBusiness.length > 0) {
      throw ApiError.badRequest("Seller already has a registered business");
    }

    // Create business
    const businessData = {
      owner_user_id: userId,
      business_name: seller.businessName,
      address: seller.address,
      business_type: seller.businessType || null,
      latitude: seller.latitude || null,
      longitude: seller.longitude || null
    };

    const createdBusiness = await businessRepo.create(businessData);

    // Upload documents if provided
    const uploadedDocs = [];
    if (documents) {
      if (documents.ppbLicense) {
        const ppbDoc = await businessDocRepo.uploadDocument({
          businessId: createdBusiness.business_id,
          documentType: 'ppb_license',
          file: documents.ppbLicense
        });
        uploadedDocs.push(ppbDoc);
      }

      if (documents.businessPermit) {
        const permitDoc = await businessDocRepo.uploadDocument({
          businessId: createdBusiness.business_id,
          documentType: 'business_permit',
          file: documents.businessPermit
        });
        uploadedDocs.push(permitDoc);
      }
    }

    res.status(201).json({
      success: true,
      message: "Business onboarding submitted successfully. Awaiting admin approval.",
      data: {
        business: createdBusiness,
        documents: uploadedDocs
      }
    });
  } catch (err) {
    next(err);
  }
});

/* ------------------------------------------------------------------
  CREATE/SUBMIT BUSINESS (seller registration)
------------------------------------------------------------------ */
router.post("/", async (req, res, next) => {
  try {
    const {userId} = req.body;

    // Validate user is a seller
    const user = await userRepo.findById(userId);
    if (!user || user.role !== 'seller') {
      throw ApiError.forbidden("Only sellers can create businesses");
    }

    // Check if seller already has a business
    const existingBusiness = await businessRepo.findByOwner(userId);
    if (existingBusiness && existingBusiness.length > 0) {
      throw ApiError.badRequest("Seller already has a registered business");
    }

    const businessData = {
      owner_user_id: userId,
      business_name: req.body.businessName,
      address: req.body.address,
      business_type: req.body.businessType || null,
      latitude: req.body.latitude || null,
      longitude: req.body.longitude || null
    };

    const created = await businessRepo.create(businessData);

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
  UPLOAD BUSINESS DOCUMENT (seller only)
------------------------------------------------------------------ */
router.post("/upload/documents", upload.single("file"), async (req, res, next) => {
  try {
    const documentType  = req.query.type;
    const userId  = req.query.userId;

    if (!req.file) {
      throw ApiError.badRequest("No file uploaded");
    }

    if (!documentType || !['ppb_license', 'business_permit'].includes(documentType)) {
      throw ApiError.badRequest("Invalid document type. Must be 'ppb_license' or 'business_permit'");
    }

    // Get seller's business
    const businesses = await businessRepo.findByOwner(userId);
    if (!businesses || businesses.length === 0) {
      throw ApiError.notFound("No business found for this seller");
    }

    const business = businesses[0];

    // Convert file buffer to base64
    const fileBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;

    // Upload document
    const uploaded = await businessDocRepo.uploadDocument({
      businessId: business.business_id,
      documentType,
      file: fileBase64
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
  GET SELLER'S OWN BUSINESS (with documents)
------------------------------------------------------------------ */
router.get("/my-business", authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;

    const businesses = await businessRepo.findByOwner(userId);
    if (!businesses || businesses.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No business found"
      });
    }

    const business = businesses[0];
    const documents = await businessDocRepo.findByBusiness(business.business_id);

    res.status(200).json({
      success: true,
      data: {
        ...business,
        documents
      }
    });
  } catch (err) {
    next(err);
  }
});

/* ------------------------------------------------------------------
  ADMIN: GET ALL BUSINESSES (with filters & pagination)
------------------------------------------------------------------ */
router.get("/admin/sellers", authenticate, requireAdmin, paginate, async (req, res, next) => {
  try {
    const { page, limit } = req.pagination;
    const { status, search, dateFrom, dateTo } = req.query;

    const businesses = await businessRepo.findAll({ page, limit, status });
    const stats = await businessRepo.getStats();

    // Transform data to match frontend expectations
    const transformedData = businesses.map(business => ({
      id: business.business_id,
      businessName: business.business_name,
      businessType: business.business_type,
      address: business.address,
      latitude: business.latitude,
      longitude: business.longitude,
      status: business.status,
      owner: {
        id: business.owner_user_id
      },
      createdAt: business.created_at,
      updatedAt: business.updated_at
    }));

    res.status(200).json({
      success: true,
      message: "Businesses fetched successfully",
      data: transformedData,
      stats: {
        total: parseInt(stats.total),
        approved: parseInt(stats.approved),
        pending: parseInt(stats.pending),
        rejected: parseInt(stats.rejected)
      },
      total: parseInt(stats.total),
      pagination: {
        page,
        limit,
        total: parseInt(stats.total)
      }
    });
  } catch (err) {
    next(err);
  }
});

/* ------------------------------------------------------------------
  ADMIN: GET BUSINESS STATS
------------------------------------------------------------------ */
router.get("/admin/sellers/stats", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const stats = await businessRepo.getStats();

    res.status(200).json({
      success: true,
      data: {
        total: parseInt(stats.total),
        approved: parseInt(stats.approved),
        pending: parseInt(stats.pending),
        rejected: parseInt(stats.rejected)
      }
    });
  } catch (err) {
    next(err);
  }
});

/* ------------------------------------------------------------------
  ADMIN: GET SINGLE BUSINESS BY ID (with documents and owner info)
------------------------------------------------------------------ */
router.get("/admin/sellers/:id", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const business = await businessRepo.findById(req.params.id);
    
    if (!business) {
      throw ApiError.notFound("Business not found");
    }

    // Get documents
    const documents = await businessDocRepo.findByBusiness(req.params.id);

    // Get owner info - need to query by user_id
    const ownerQuery = await db.query(
      "SELECT user_id, name, email FROM ph_users WHERE user_id = $1",
      [business.owner_user_id]
    );
    const owner = ownerQuery.rows[0];

    // Transform documents
    const transformedDocs = documents.map(doc => ({
      id: doc.document_id,
      name: doc.file_name,
      type: doc.document_type,
      url: doc.file_url,
      status: doc.status,
      uploadedAt: doc.uploaded_at
    }));

    res.status(200).json({
      success: true,
      data: {
        id: business.business_id,
        businessName: business.business_name,
        businessType: business.business_type,
        address: business.address,
        latitude: business.latitude,
        longitude: business.longitude,
        status: business.status,
        owner: {
          id: owner.user_id,
          name: owner.name,
          email: owner.email
        },
        documents: transformedDocs,
        createdAt: business.created_at,
        updatedAt: business.updated_at
      }
    });
  } catch (err) {
    next(err);
  }
});

/* ------------------------------------------------------------------
  ADMIN: UPDATE BUSINESS
------------------------------------------------------------------ */
router.put("/admin/sellers/:id", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const business = await businessRepo.findById(req.params.id);
    
    if (!business) {
      throw ApiError.notFound("Business not found");
    }

    const updates = {};
    if (req.body.businessName) updates.business_name = req.body.businessName;
    if (req.body.address) updates.address = req.body.address;
    if (req.body.businessType !== undefined) updates.business_type = req.body.businessType;
    if (req.body.latitude !== undefined) updates.latitude = req.body.latitude;
    if (req.body.longitude !== undefined) updates.longitude = req.body.longitude;
    if (req.body.status) updates.status = req.body.status;

    const updated = await businessRepo.update(req.params.id, updates);

    res.status(200).json({
      success: true,
      message: "Business updated successfully",
      data: {
        id: updated.business_id,
        businessName: updated.business_name,
        businessType: updated.business_type,
        address: updated.address,
        latitude: updated.latitude,
        longitude: updated.longitude,
        status: updated.status,
        createdAt: updated.created_at,
        updatedAt: updated.updated_at
      }
    });
  } catch (err) {
    next(err);
  }
});

/* ------------------------------------------------------------------
  ADMIN: APPROVE BUSINESS
------------------------------------------------------------------ */
router.post("/admin/sellers/:id/approve", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { documentIds } = req.body;

    const business = await businessRepo.findById(req.params.id);
    if (!business) {
      throw ApiError.notFound("Business not found");
    }

    // Approve business
    const approved = await businessRepo.approve(req.params.id);

    // Approve documents if provided
    if (documentIds && documentIds.length > 0) {
      await businessDocRepo.approveDocuments({
        documentIds,
        adminUserId: req.user.id
      });
    }

    // Get updated business with documents
    const documents = await businessDocRepo.findByBusiness(req.params.id);

    res.status(200).json({
      success: true,
      message: "Business approved successfully",
      data: {
        id: approved.business_id,
        businessName: approved.business_name,
        businessType: approved.business_type,
        address: approved.address,
        status: approved.status,
        documents: documents.map(doc => ({
          id: doc.document_id,
          name: doc.file_name,
          type: doc.document_type,
          url: doc.file_url,
          status: doc.status,
          uploadedAt: doc.uploaded_at
        })),
        createdAt: approved.created_at,
        updatedAt: approved.updated_at
      }
    });
  } catch (err) {
    next(err);
  }
});

/* ------------------------------------------------------------------
  ADMIN: REJECT BUSINESS
------------------------------------------------------------------ */
router.post("/admin/sellers/:id/reject", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { reason, rejectedDocumentIds } = req.body;

    if (!reason) {
      throw ApiError.badRequest("Rejection reason is required");
    }

    const business = await businessRepo.findById(req.params.id);
    if (!business) {
      throw ApiError.notFound("Business not found");
    }

    // Reject business
    const rejected = await businessRepo.reject(req.params.id);

    // Reject documents if provided
    if (rejectedDocumentIds && rejectedDocumentIds.length > 0) {
      await businessDocRepo.rejectDocuments({
        documentIds: rejectedDocumentIds,
        rejectionReason: reason,
        adminUserId: req.user.id
      });
    }

    // Get updated business with documents
    const documents = await businessDocRepo.findByBusiness(req.params.id);

    res.status(200).json({
      success: true,
      message: "Business rejected successfully",
      data: {
        id: rejected.business_id,
        businessName: rejected.business_name,
        businessType: rejected.business_type,
        address: rejected.address,
        status: rejected.status,
        rejectionReason: reason,
        rejectedDocuments: rejectedDocumentIds,
        documents: documents.map(doc => ({
          id: doc.document_id,
          name: doc.file_name,
          type: doc.document_type,
          url: doc.file_url,
          status: doc.status,
          uploadedAt: doc.uploaded_at
        })),
        createdAt: rejected.created_at,
        updatedAt: rejected.updated_at
      }
    });
  } catch (err) {
    next(err);
  }
});

/* ------------------------------------------------------------------
  ADMIN: DELETE BUSINESS (hard delete)
------------------------------------------------------------------ */
router.delete("/admin/sellers/:id", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const business = await businessRepo.findById(req.params.id);
    if (!business) {
      throw ApiError.notFound("Business not found");
    }

    // Delete associated documents first
    const documents = await businessDocRepo.findByBusiness(req.params.id);
    for (const doc of documents) {
      await businessDocRepo.deleteDocument(doc.document_id);
    }

    // Delete business
    await businessRepo.delete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Business deleted successfully"
    });
  } catch (err) {
    next(err);
  }
});

/* ------------------------------------------------------------------
  SELLER: UPDATE OWN BUSINESS (when rejected or pending)
------------------------------------------------------------------ */
router.put("/my-business", authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;

    const businesses = await businessRepo.findByOwner(userId);
    if (!businesses || businesses.length === 0) {
      throw ApiError.notFound("No business found");
    }

    const business = businesses[0];

    // Sellers can only update if status is rejected or pending
    if (!['rejected', 'pending'].includes(business.status)) {
      throw ApiError.badRequest("Cannot update business with current status");
    }

    const updates = {};
    if (req.body.businessName) updates.business_name = req.body.businessName;
    if (req.body.address) updates.address = req.body.address;
    if (req.body.businessType !== undefined) updates.business_type = req.body.businessType;
    if (req.body.latitude !== undefined) updates.latitude = req.body.latitude;
    if (req.body.longitude !== undefined) updates.longitude = req.body.longitude;

    const updated = await businessRepo.update(business.business_id, updates);

    res.status(200).json({
      success: true,
      message: "Business updated successfully",
      data: {
        id: updated.business_id,
        businessName: updated.business_name,
        businessType: updated.business_type,
        address: updated.address,
        latitude: updated.latitude,
        longitude: updated.longitude,
        status: updated.status,
        createdAt: updated.created_at,
        updatedAt: updated.updated_at
      }
    });
  } catch (err) {
    next(err);
  }
});

/* ------------------------------------------------------------------
  LIST BUSINESS DOCUMENTS (seller / admin)
------------------------------------------------------------------ */
router.get("/:id/documents", authenticate, async (req, res, next) => {
  try {
    const business = await businessRepo.findById(req.params.id);
    
    if (!business) {
      throw ApiError.notFound("Business not found");
    }

    // Check authorization
    const isAdmin = req.user.role === 'admin' || req.user.role === 'superadmin';
    const isOwner = business.owner_user_id === req.user.id;

    if (!isAdmin && !isOwner) {
      throw ApiError.forbidden("Access denied");
    }

    const documents = await businessDocRepo.findByBusiness(req.params.id);

    res.status(200).json({
      success: true,
      data: documents.map(doc => ({
        id: doc.document_id,
        name: doc.file_name,
        type: doc.document_type,
        url: doc.file_url,
        status: doc.status,
        uploadedAt: doc.uploaded_at
      }))
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
