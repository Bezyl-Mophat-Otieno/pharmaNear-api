const db = require("..");

class FeedbackRepository {
  async addFeedback({ productId, name, rating, comment }) {
    const res = await db.query(
      `
      INSERT INTO ph_product_feedback (product_id, name, rating, comment)
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [productId, name, rating, comment || null]
    );
    return res.rows[0];
  }

  async getFeedbackByProduct(productId) {
    const res = await db.query(
      `
      SELECT id, name, rating, comment, created_at
      FROM ph_product_feedback
      WHERE product_id = $1
      ORDER BY created_at DESC
      `,
      [productId]
    );
    return res.rows;
  }

  async getAverageRating(productId) {
    const res = await db.query(
      `SELECT ROUND(AVG(rating)::numeric, 1) AS average_rating FROM ph_product_feedback WHERE product_id = $1`,
      [productId]
    );
    return res.rows[0].average_rating || 0;
  }

  // Admin only: CRUD
  async getAllFeedback({ limit = 20, offset = 0 }) {
    const res = await db.query(
      `
      SELECT f.*, p.name AS product_name
      FROM ph_product_feedback f
      JOIN ph_products p ON f.product_id = p.id
      ORDER BY f.created_at DESC
      LIMIT $1 OFFSET $2
      `,
      [limit, offset]
    );
    return res.rows;
  }

  async deleteFeedback(id) {
    await db.query(`DELETE FROM ph_product_feedback WHERE id = $1`, [id]);
  }

  async updateFeedback(id, { name, rating, comment }) {
    const res = await db.query(
      `
      UPDATE ph_product_feedback
      SET name = $1, rating = $2, comment = $3
      WHERE id = $4
      RETURNING *
      `,
      [name, rating, comment || null, id]
    );
    return res.rows[0];
  }
}

module.exports = new FeedbackRepository();
