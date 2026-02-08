const db = require("..");

class StockRepository {
  columnNames = `
    p.product_id,
    p.name,
    p.slug,
    p.stock,
    p.low_stock_threshold,
    p.total_sold,
    p.selling_price,
    p.buying_price,
    p.images,
    p.status,
    p.created_at,
    p.updated_at
  `;

  async getAllWithStock({ search = "", categoryId, status, limit = 50, offset = 0 }) {
    let filters = [];
    let values = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      filters.push(`p.name ILIKE $${paramCount}`);
      values.push(`%${search}%`);
    }

    if (categoryId) {
      paramCount++;
      filters.push(`p.category_id = $${paramCount}`);
      values.push(categoryId);
    }

    if (status) {
      if (status === 'out-of-stock') {
        filters.push(`p.stock = 0`);
      } else if (status === 'low-stock') {
        filters.push(`p.stock > 0 AND p.stock <= p.low_stock_threshold`);
      } else if (status === 'in-stock') {
        filters.push(`p.stock > p.low_stock_threshold`);
      }
    }

    let whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

    const query = `
      SELECT ${this.columnNames}
      FROM ph_products p
      ${whereClause}
      ORDER BY p.name ASC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    values.push(limit, offset);

    const res = await db.query(query, values);
    return res.rows;
  }

  async getStockStats() {
    const res = await db.query(`
      SELECT 
        COUNT(*) as total_products,
        COUNT(CASE WHEN stock = 0 THEN 1 END) as out_of_stock_count,
        COUNT(CASE WHEN stock > 0 AND stock <= low_stock_threshold THEN 1 END) as low_stock_count,
        COUNT(CASE WHEN stock > low_stock_threshold THEN 1 END) as healthy_stock_count,
        SUM(stock) as total_stock_units,
        AVG(stock) as average_stock_per_product
      FROM ph_products
    `);

    return res.rows[0];
  }

  async getLowStock(limit = 20, offset = 0) {
    const query = `
      SELECT ${this.columnNames}
      FROM ph_products p
      WHERE p.stock > 0 AND p.stock <= p.low_stock_threshold
      ORDER BY p.stock ASC
      LIMIT $1 OFFSET $2;
    `;

    const res = await db.query(query, [limit, offset]);
    return res.rows;
  }

  async getOutOfStock(limit = 20, offset = 0) {
    const query = `
      SELECT ${this.columnNames}
      FROM ph_products p
      WHERE p.stock = 0
      ORDER BY p.updated_at DESC
      LIMIT $1 OFFSET $2;
    `;

    const res = await db.query(query, [limit, offset]);
    return res.rows;
  }

  async getTopSellingProducts(limit = 10, offset = 0) {
    const query = `
      SELECT ${this.columnNames}
      FROM ph_products p
      WHERE p.total_sold > 0
      ORDER BY p.total_sold DESC
      LIMIT $1 OFFSET $2;
    `;

    const res = await db.query(query, [limit, offset]);
    return res.rows;
  }

  async updateProductStock(productId, newStock, reason = 'Manual adjustment') {
    try {
      await db.query("BEGIN");

      // Get current stock
      const currentRes = await db.query(
        `SELECT stock FROM ph_products WHERE product_id = $1`,
        [productId]
      );

      if (!currentRes.rows.length) {
        throw new Error("Product not found");
      }

      const currentStock = currentRes.rows[0].stock;
      const stockChange = newStock - currentStock;

      // Update product stock
      await db.query(
        `UPDATE ph_products 
         SET stock = $1, updated_at = CURRENT_TIMESTAMP 
         WHERE product_id = $2`,
        [newStock, productId]
      );

      await db.query("COMMIT");
      return { success: true, previousStock: currentStock, newStock, change: stockChange };
    } catch (err) {
      await db.query("ROLLBACK");
      throw err;
    }
  }

  async restockProduct(productId, quantity, reason = 'Restock') {
    try {
      await db.query("BEGIN");

      // Get current stock
      const currentRes = await db.query(
        `SELECT stock FROM ph_products WHERE product_id = $1`,
        [productId]
      );

      if (!currentRes.rows.length) {
        throw new Error("Product not found");
      }

      const currentStock = currentRes.rows[0].stock;
      const newStock = currentStock + quantity;

      // Update product stock
      await db.query(
        `UPDATE ph_products 
         SET stock = stock + $1, updated_at = CURRENT_TIMESTAMP 
         WHERE product_id = $2`,
        [quantity, productId]
      );

      await db.query("COMMIT");
      return { success: true, previousStock: currentStock, newStock, added: quantity };
    } catch (err) {
      await db.query("ROLLBACK");
      throw err;
    }
  }
}

module.exports = new StockRepository();