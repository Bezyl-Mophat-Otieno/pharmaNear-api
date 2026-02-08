const db = require("..");

class SubcategoryRepository {
  async create({ category_id, name, description }) {
    const res = await db.query(
      `INSERT INTO bq_subcategories (category_id, name, description)
       VALUES ($1, $2, $3) RETURNING *`,
      [category_id, name, description]
    );
    return res.rows[0];
  }

  async findAll(category_id) {
    const res = await db.query(
      `SELECT * FROM bq_subcategories WHERE category_id = $1 ORDER BY name`,
      [category_id]
    );
    return res.rows;
  }

  async findById(id) {
    const res = await db.query("SELECT * FROM bq_subcategories WHERE sub_category_id = $1", [id]);
    return res.rows[0];
  }

  async countProductsInSubcategory(subcategory_id) {
    const res = await db.query(
      `SELECT COUNT(*) FROM bq_products WHERE subcategory_id = $1`,
      [subcategory_id]
    );
    return parseInt(res.rows[0].count, 10);
  }

  async getProductsBySubcategory(subcategory_id) {
    const res = await db.query(
      `SELECT * FROM bq_products WHERE subcategory_id = $1 ORDER BY name`,
      [subcategory_id]
    );
    return res.rows;
  }

  async update(id, { name, description }) {
    const res = await db.query(
      `UPDATE bq_subcategories SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP
       WHERE sub_category_id = $3 RETURNING *`,
      [name, description, id]
    );
    return res.rows[0];
  }

  async delete(id) {
    await db.query("DELETE FROM bq_subcategories WHERE sub_category_id = $1", [id]);
  }
}

module.exports = new SubcategoryRepository();
