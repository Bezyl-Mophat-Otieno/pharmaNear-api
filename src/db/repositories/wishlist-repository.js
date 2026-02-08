const db = require("..");

class WishlistRepository {
  async add(userId, productId) {
    const res = await db.query(
      `INSERT INTO bq_wishlist (user_id, product_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING
       RETURNING *`,
      [userId, productId]
    );
    return res.rows[0];
  }

  async remove(userId, productId) {
    await db.query(`DELETE FROM bq_wishlist WHERE user_id = $1 AND product_id = $2`, [userId, productId]);
  }

  async getAll(userId) {
    const res = await db.query(
      `
      SELECT p.id, p.name, p.slug, p.price, p.discount_amount, p.stock, p.images
      FROM bq_wishlist w
      JOIN bq_products p ON w.product_id = p.id
      WHERE w.user_id = $1
      `,
      [userId]
    );
    return res.rows;
  }
}

module.exports = new WishlistRepository();
