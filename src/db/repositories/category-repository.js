const db = require("..");

class CategoryRepository {
  async create({ name, description }) {
    const res = await db.query(
      `INSERT INTO ph_categories (name, description)
       VALUES ($1, $2) RETURNING *`,
      [name, description]
    );
    const newCategory = res.rows[0];
    return {...(newCategory ?? {}), subcategories: []};
  }

  async findAll() {

  const sqlQuery = `
    SELECT 
      c.category_id,
      c.name,
      c.description,
      c.created_at,
      c.updated_at,
      COALESCE(
        json_agg(
          json_build_object(
            'sub_category_id', s.sub_category_id,
            'name', s.name,
            'description', s.description,
            'created_at', s.created_at,
            'updated_at', s.updated_at
          )
        ) FILTER (WHERE s.sub_category_id IS NOT NULL), 
        '[]'
      ) AS subcategories
    FROM ph_categories c
    LEFT JOIN ph_subcategories s 
      ON s.category_id = c.category_id
    GROUP BY c.category_id, c.name, c.description, c.created_at, c.updated_at
    ORDER BY c.category_id;
  `;

    const res = await db.query(sqlQuery);
    return res.rows;
  }

  async findById(id) {
    const res = await db.query("SELECT * FROM ph_categories WHERE category_id = $1", [id]);
    return res.rows[0];
  }

  async update(id, { name, description }) {
    const res = await db.query(
      `UPDATE ph_categories SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP
       WHERE category_id = $3 RETURNING *`,
      [name, description, id]
    );
    const subCategories = await db.query(
      `SELECT * FROM ph_subcategories WHERE category_id = $1 ORDER BY name`,
      [id]
    );
    const updatedCategory = res.rows[0];
    return {...(updatedCategory?? {}), subcategories: subCategories.rows};
  }

  async delete(id) {
    await db.query("DELETE FROM ph_categories WHERE category_id = $1", [id]);
  }
}

module.exports = new CategoryRepository();
