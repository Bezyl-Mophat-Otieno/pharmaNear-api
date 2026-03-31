const db = require("..");
const { generateSlug } = require("../../utils/slug");

class ProductRepository {
  columnNames = `
      p.product_id,
      p.name,
      b.business_id,
      b.business_name,
      b.latitude,
      b.longitude,
      b.address,
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
      p.requires_prescription,
      p.dosage_form,
      p.strength,
      p.manufacturer,
      p.created_at,
      p.updated_at
  `
  async create(product, businessId) {
    const slug = generateSlug(product.name);
    const query = `
      INSERT INTO ph_products (
        business_id, name, slug, description, stock, low_stock_threshold, discount_amount,
        status, is_featured, category_id,sub_category_id, images,
        materials, available_sizes, care_instructions, buying_price, selling_price
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
      RETURNING *;
    `;

    const values = [
      businessId,
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

  async findAll(page, limit, businessId) {
    const offset = (page - 1) * limit;
    let query = `SELECT ${this.columnNames} FROM ph_products p 
                                INNER JOIN ph_categories c ON c.category_id = p.category_id
                                INNER JOIN ph_subcategories s ON s.sub_category_id = p.sub_category_id
                                INNER JOIN ph_sellers b ON b.business_id = p.business_id
                                WHERE p.status <> 'deleted'
                `
    const params = []
    if(businessId){
      query += ` AND p.business_id = $1 `;
      params.push(businessId)
    }

    query += `ORDER BY p.created_at DESC`
    const res = await db.query(query, params);
    return res.rows;
  }

  async findById(id) {
  const productRes = await db.query(
    `SELECT ${this.columnNames} FROM ph_products p 
                                INNER JOIN ph_categories c ON c.category_id = p.category_id
                                INNER JOIN ph_subcategories s ON s.sub_category_id = p.sub_category_id
                                INNER JOIN ph_sellers b ON b.business_id = p.business_id
                                WHERE p.product_id = $1 AND p.status <> 'deleted'`,
    [id]
  );

  const ratingRes = await db.query(
    `SELECT ROUND(AVG(rating)::numeric, 1) AS average_rating FROM ph_product_feedback WHERE product_id = $1`,
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
      UPDATE ph_products SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP
      WHERE product_id = $${i} RETURNING *;
    `;

    const res = await db.query(query, values);
    return res.rows[0];
  }

  async delete(id) {
    await db.query(`UPDATE ph_products SET status ='deleted' WHERE product_id = $1`, [id]);
  }
  async searchProducts({
    query,
    userLat,
    userLng,
    radiusKm = 2000,
    limit = 10,
    offset = 0,
    businessId = null,
    requiresPrescription = null,
    categoryId = null,
    manufacturer = null,
  }) {
    const values = [];
    let i = 1;

    let distanceSelect = "";
    let distanceWhere = "";

    if (userLat && userLng) {
      distanceSelect = `,
        ST_Distance(
          b.location,
          ST_MakePoint($${i + 1}, $${i})::geography
        ) / 1000 AS distance_km
      `;
      values.push(userLat, userLng); // $i = lat, $i+1 = lng
      i += 2;

      distanceWhere = `
        AND ST_DWithin(
          b.location,
          ST_MakePoint($${i - 1}, $${i - 2})::geography,
          $${i} * 1000
        )
      `;
      values.push(radiusKm);
      i++;
    }

    // Primary filter: product name
    values.push(`%${query}%`);
    const nameParam = i++;

    // Secondary filters
    let businessFilter = "";
    if (businessId) {
      values.push(businessId);
      businessFilter = `AND p.business_id = $${i++}`;
    }

    let prescriptionFilter = "";
    if (requiresPrescription !== null) {
      values.push(requiresPrescription);
      prescriptionFilter = `AND p.requires_prescription = $${i++}`;
    }

    let categoryFilter = "";
    if (categoryId) {
      values.push(categoryId);
      categoryFilter = `AND p.category_id = $${i++}`;
    }

    // ORDER: cheapest first, then closest
    const orderBy = userLat && userLng
      ? "p.selling_price ASC, distance_km ASC"
      : "p.selling_price ASC";

    values.push(limit, offset);
    const limitParam = i++;
    const offsetParam = i++;

    const sql = `
      SELECT
        ${this.columnNames}
        ${distanceSelect}
      FROM ph_products p
      INNER JOIN ph_sellers b ON b.business_id = p.business_id
      INNER JOIN ph_categories c ON c.category_id = p.category_id
      INNER JOIN ph_subcategories s ON s.sub_category_id = p.sub_category_id
      WHERE
        p.status = 'available'
        AND p.name ILIKE $${nameParam}
        ${distanceWhere}
        ${businessFilter}
        ${prescriptionFilter}
        ${categoryFilter}
      ORDER BY ${orderBy}
      LIMIT $${limitParam} OFFSET $${offsetParam};
    `;

    const res = await db.query(sql, values);
    return res.rows;
  }

  async countSearch({
    query,
    userLat,
    userLng,
    radiusKm = 2000,
    businessId = null,
    requiresPrescription = null,
    categoryId = null,
  }) {
    const values = [];
    let i = 1;

    let distanceWhere = "";
    if (userLat && userLng) {
      values.push(userLat, userLng);
      i += 2;
      distanceWhere = `
        AND ST_DWithin(
          b.location,
          ST_MakePoint($${i - 1}, $${i - 2})::geography,
          $${i} * 1000
        )
      `;
      values.push(radiusKm);
      i++;
    }

    values.push(`%${query}%`);
    const nameParam = i++;

    let businessFilter = "";
    if (businessId) { values.push(businessId); businessFilter = `AND p.business_id = $${i++}`; }

    let prescriptionFilter = "";
    if (requiresPrescription !== null) { values.push(requiresPrescription); prescriptionFilter = `AND p.requires_prescription = $${i++}`; }

    let categoryFilter = "";
    if (categoryId) { values.push(categoryId); categoryFilter = `AND p.category_id = $${i++}`; }

    const sql = `
      SELECT COUNT(*) AS total
      FROM ph_products p
      INNER JOIN ph_sellers b ON b.business_id = p.business_id
      INNER JOIN ph_categories c ON c.category_id = p.category_id
      INNER JOIN ph_subcategories s ON s.sub_category_id = p.sub_category_id
      WHERE
        p.status = 'available'
        AND p.name ILIKE $${nameParam}
        ${distanceWhere}
        ${businessFilter}
        ${prescriptionFilter}
        ${categoryFilter};
    `;

    const res = await db.query(sql, values);
    return parseInt(res.rows[0].total, 10);
  }

async findByIdWithBusiness(productId, userLat, userLng) {
  const values = [productId];
  let distanceSelect = "";

  if (userLat && userLng) {
    distanceSelect = `,
      ST_Distance(
        b.location,
        ST_MakePoint($3, $2)::geography
      ) / 1000 AS distance_km
    `;
    values.push(userLat, userLng);
  }

  const sql = `
    SELECT
      ${this.columnNames}
      ${distanceSelect}
    FROM ph_products p
    INNER JOIN ph_sellers b ON b.business_id = p.business_id
    INNER JOIN ph_categories c ON c.category_id = p.category_id
    INNER JOIN ph_subcategories s ON s.sub_category_id = p.sub_category_id
    WHERE p.product_id = $1 AND p.status = 'active';
  `;

  const res = await db.query(sql, values);
  return res.rows[0] || null;
}


}

module.exports = new ProductRepository();
