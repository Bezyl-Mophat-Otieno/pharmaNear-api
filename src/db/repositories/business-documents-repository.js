const db = require("..");
const { CloudinaryService } = require("../../utils/cloudinary");

class BusinessDocumentRepository {
  columnNames = `
    d.document_id,
    d.business_id,
    d.document_type,
    d.file_name,
    d.file_url,
    d.mime_type,
    d.file_size,
    d.status,
    d.rejection_reason,
    d.reviewed_by,
    d.reviewed_at,
    d.uploaded_at,
    d.updated_at
  `;

  /* ------------------------------------------------------------------
     UPLOAD / REPLACE BUSINESS DOCUMENT
  ------------------------------------------------------------------ */
  async uploadDocument({ businessId, documentType, file }) {
    // 1. Upload to Cloudinary
    const uploadResult = await CloudinaryService.uploadImage(file, {
      folder: `pharmanear/business-documents/${businessId}`,
      resource_type: "auto",
    });

    // 2. Upsert document (replace on re-upload)
    const query = `
      INSERT INTO ph_business_documents (
        business_id,
        document_type,
      file_name,
        file_url,
        mime_type,
        file_size,
        status
      )
      VALUES ($1,$2,$3,$4,$5,$6,'pending')
      ON CONFLICT (business_id, document_type)
      DO UPDATE SET
        file_name = EXCLUDED.file_name,
        file_url = EXCLUDED.file_url,
        mime_type = EXCLUDED.mime_type,
        file_size = EXCLUDED.file_size,
        status = 'pending',
        rejection_reason = NULL,
        reviewed_by = NULL,
        reviewed_at = NULL,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;

    const values = [
      businessId,
      documentType,
      uploadResult.public_id,
      uploadResult.secure_url,
      uploadResult.format,
      uploadResult.bytes,
    ];

    const res = await db.query(query, values);
    return res.rows[0];
  }

  /* ------------------------------------------------------------------
     LIST DOCUMENTS FOR A BUSINESS
  ------------------------------------------------------------------ */
  async findByBusiness(businessId) {
    const res = await db.query(
      `
      SELECT ${this.columnNames}
      FROM ph_business_documents d
      WHERE d.business_id = $1
      ORDER BY d.uploaded_at DESC
      `,
      [businessId]
    );

    return res.rows;
  }

  /* ------------------------------------------------------------------
     ADMIN: APPROVE DOCUMENTS (BULK)
  ------------------------------------------------------------------ */
  async approveDocuments({ documentIds, adminUserId }) {
    const res = await db.query(
      `
      UPDATE ph_business_documents
      SET status = 'approved',
          rejection_reason = NULL,
          reviewed_by = $2,
          reviewed_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE document_id = ANY($1::uuid[])
      RETURNING *;
      `,
      [documentIds, adminUserId]
    );

    return res.rows;
  }

  /* ------------------------------------------------------------------
     ADMIN: REJECT DOCUMENTS (BULK)
  ------------------------------------------------------------------ */
  async rejectDocuments({ documentIds, rejectionReason, adminUserId }) {
    const res = await db.query(
      `
      UPDATE ph_business_documents
      SET status = 'rejected',
          rejection_reason = $2,
          reviewed_by = $3,
          reviewed_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE document_id = ANY($1::uuid[])
      RETURNING *;
      `,
      [documentIds, rejectionReason, adminUserId]
    );

    return res.rows;
  }

  /* ------------------------------------------------------------------
     DELETE DOCUMENT (seller – usually rejected ones)
  ------------------------------------------------------------------ */
  async deleteDocument(documentId) {
    // 1. Get document
    const docRes = await db.query(
      `SELECT file_name FROM ph_business_documents WHERE document_id = $1`,
      [documentId]
    );

    if (!docRes.rows.length) return false;

    const { file_name } = docRes.rows[0];

    // 2. Delete from Cloudinary
    await CloudinaryService.deleteImage(file_name);

    // 3. Delete DB record
    await db.query(
      `DELETE FROM ph_business_documents WHERE document_id = $1`,
      [documentId]
    );

    return true;
  }
}

module.exports = new BusinessDocumentRepository();
