const db = require("..");
const { generateSlug } = require("../../utils/slug");

class ProductRepository {
  columnNames = `
      p.product_id,
      p.name,
      p.slug,
      p.description,
      p.stock,
      p.low_stock_threshold,
      p.total_sold,
      p.discount_amount,
      p.status,
      p.is_featured,
      p.category_id,
      c.name as category_name,
      p.sub_category_id,
      s.name as sub_category_name,
      p.images,
      p.materials,
      p.available_sizes,
      p.care_instructions,
      p.buying_price,
      p.selling_price,
      p.created_at,
      p.updated_at
  `
  async create(product) {
    const slug = generateSlug(product.name);
    const query = `
      INSERT INTO bq_products (
        name, slug, description, stock, low_stock_threshold, discount_amount,
        status, is_featured, category_id,sub_category_id, images,
        materials, available_sizes, care_instructions, buying_price, selling_price
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
      RETURNING *;
    `;

    const values = [
      product.name,
      slug,
      product.description,
      product.stock,
      product.low_stock_threshold,
      product.discount_amount || 0,
      product.status,
      product.is_featured || false,
      product.category_id,
      product.sub_category_id,
      JSON.stringify(product.images || []),
      product.materials,
      JSON.stringify(product.available_sizes || []),
      product.care_instructions,
      product.buying_price,
      product.selling_price,
    ];

    const res = await db.query(query, values);
    return res.rows[0];
  }

  async findAll(page, limit) {
    const offset = (page - 1) * limit;
    const res = await db.query(`SELECT ${this.columnNames} FROM bq_products p 
                                INNER JOIN bq_categories c ON c.category_id = p.category_id
                                INNER JOIN bq_subcategories s ON s.sub_category_id = p.sub_category_id
                                WHERE p.status <> 'deleted'
                                ORDER BY p.created_at DESC LIMIT $1 OFFSET $2`, [limit, offset]);
    return res.rows;
  }

  async findById(id) {
  const productRes = await db.query(
    `SELECT ${this.columnNames} FROM bq_products p 
                                INNER JOIN bq_categories c ON c.category_id = p.category_id
                                INNER JOIN bq_subcategories s ON s.sub_category_id = p.sub_category_id
                                WHERE p.product_id = $1 AND p.status <> 'deleted'`,
    [id]
  );

  const ratingRes = await db.query(
    `SELECT ROUND(AVG(rating)::numeric, 1) AS average_rating FROM bq_product_feedback WHERE product_id = $1`,
    [id]
  );

  if (!productRes.rows.length) return null;

  return {
    ...productRes.rows[0],
    averageRating: ratingRes.rows[0].average_rating || 0
  };
}


  async update(product_id, updates) {
    const fields = [];
    const values = [];
    let i = 1;

    for (const key in updates) {
      fields.push(`${key} = $${i}`);
      values.push(
        key === "images" || key === "available_sizes"
          ? JSON.stringify(updates[key])
          : updates[key]
      );
      i++;
    }

    values.push(product_id);

    const query = `
      UPDATE bq_products SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP
      WHERE product_id = $${i} RETURNING *;
    `;

    const res = await db.query(query, values);
    return res.rows[0];
  }

  async delete(id) {
    await db.query(`UPDATE bq_products SET status ='deleted' WHERE product_id = $1`, [id]);
  }
}

module.exports = new ProductRepository();
