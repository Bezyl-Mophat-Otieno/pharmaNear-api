const db = require("..");

class CartRepository {
  async addOrUpdate(userId, productId, quantity) {
    const res = await db.query(
      `
      INSERT INTO bq_cart (user_id, product_id, quantity)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, product_id)
      DO UPDATE SET quantity = EXCLUDED.quantity, updated_at = CURRENT_TIMESTAMP
      RETURNING *;
      `,
      [userId, productId, quantity]
    );
    return res.rows[0];
  }

  async remove(userId, productId) {
    await db.query(`DELETE FROM bq_cart WHERE user_id = $1 AND product_id = $2`, [userId, productId]);
  }

  async getAll(userId) {
    const res = await db.query(
      `
      SELECT p.id, p.name, p.slug, p.price, p.discount_amount, p.stock, p.images, c.quantity
      FROM bq_cart c
      JOIN bq_products p ON c.product_id = p.id
      WHERE c.user_id = $1
      `,
      [userId]
    );
    return res.rows;
  }

  async clearCart(userId) {
    await db.query(`DELETE FROM bq_cart WHERE user_id = $1`, [userId]);
  }
}

module.exports = new CartRepository();
