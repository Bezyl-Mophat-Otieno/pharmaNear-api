const db = require("..");

class BusinessRepository {
  columnNames = `
    b.business_id,
    b.owner_user_id,
    b.business_name,
    b.address,
    b.business_type,
    b.latitude,
    b.longitude,
    b.status,
    b.created_at,
    b.updated_at
  `;

  /* ------------------------------------------------------------------
     CREATE BUSINESS (Tenant onboarding)
  ------------------------------------------------------------------ */
  async create(business) {
    const query = `
      INSERT INTO ph_businesses (
        owner_user_id,
        business_name,
        address,
        business_type,
        latitude,
        longitude
      )
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *;
    `;

    const values = [
      business.owner_user_id,
      business.business_name,
      business.address,
      business.business_type || null,
      business.latitude,
      business.longitude
    ];

    const res = await db.query(query, values);
    return res.rows[0];
  }

  /* ------------------------------------------------------------------
     FIND BUSINESS BY ID
  ------------------------------------------------------------------ */
  async findById(businessId) {
    const res = await db.query(
      `SELECT ${this.columnNames}
       FROM ph_businesses b
       WHERE b.business_id = $1`,
      [businessId]
    );

    return res.rows[0] || null;
  }

  /* ------------------------------------------------------------------
     FIND BUSINESS BY OWNER (Tenant dashboard)
  ------------------------------------------------------------------ */
  async findByOwner(userId) {
    const res = await db.query(
      `SELECT ${this.columnNames}
       FROM ph_businesses b
       WHERE b.owner_user_id = $1
       ORDER BY b.created_at DESC`,
      [userId]
    );

    return res.rows;
  }

  /* ------------------------------------------------------------------
     ADMIN: LIST BUSINESSES WITH FILTERS + PAGINATION
  ------------------------------------------------------------------ */
  async findAll({ status, page = 1, limit = 20 }) {
    const offset = (page - 1) * limit;
    const conditions = [];
    const values = [];
    let i = 1;

    if (status) {
      conditions.push(`b.status = $${i++}`);
      values.push(status);
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    const query = `
      SELECT ${this.columnNames}
      FROM ph_businesses b
      ${whereClause}
      ORDER BY b.created_at DESC
      LIMIT $${i++} OFFSET $${i};
    `;

    values.push(limit, offset);

    const res = await db.query(query, values);
    return res.rows;
  }

  /* ------------------------------------------------------------------
     ADMIN: BUSINESS STATS (Dashboard cards)
  ------------------------------------------------------------------ */
  async getStats() {
    const res = await db.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'approved') AS approved,
        COUNT(*) FILTER (WHERE status = 'pending') AS pending,
        COUNT(*) FILTER (WHERE status = 'rejected') AS rejected,
        COUNT(*) FILTER (WHERE status = 'suspended') AS suspended,
        COUNT(*) AS total
      FROM ph_businesses;
    `);

    return res.rows[0];
  }

  /* ------------------------------------------------------------------
     UPDATE BUSINESS (allowed mainly when rejected)
  ------------------------------------------------------------------ */
  async update(businessId, updates) {
    const fields = [];
    const values = [];
    let i = 1;

    for (const key in updates) {
      fields.push(`${key} = $${i}`);
      values.push(updates[key]);
      i++;
    }

    values.push(businessId);

    const query = `
      UPDATE ph_businesses
      SET ${fields.join(", ")},
          updated_at = CURRENT_TIMESTAMP
      WHERE business_id = $${i}
      RETURNING *;
    `;

    const res = await db.query(query, values);
    return res.rows[0];
  }

  /* ------------------------------------------------------------------
     ADMIN: APPROVE BUSINESS
  ------------------------------------------------------------------ */
  async approve(businessId) {
    const res = await db.query(
      `
      UPDATE ph_businesses
      SET status = 'approved',
          updated_at = CURRENT_TIMESTAMP
      WHERE business_id = $1
      RETURNING *;
      `,
      [businessId]
    );

    return res.rows[0];
  }

  /* ------------------------------------------------------------------
     ADMIN: REJECT BUSINESS
  ------------------------------------------------------------------ */
  async reject(businessId) {
    const res = await db.query(
      `
      UPDATE ph_businesses
      SET status = 'rejected',
          updated_at = CURRENT_TIMESTAMP
      WHERE business_id = $1
      RETURNING *;
      `,
      [businessId]
    );

    return res.rows[0];
  }

  /* ------------------------------------------------------------------
     ADMIN: DELETE BUSINESS (hard delete – destructive)
  ------------------------------------------------------------------ */
  async delete(businessId) {
    await db.query(
      `DELETE FROM ph_businesses WHERE business_id = $1`,
      [businessId]
    );
  }
}

module.exports = new BusinessRepository();
