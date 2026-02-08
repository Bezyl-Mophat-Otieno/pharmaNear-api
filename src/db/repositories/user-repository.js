const db = require("../index");
const { log, LOG_LEVELS } = require("../../utils/logger");
const {bcryptVerifyPassword} = require("../../utils/bcrypt");

class UserRepository {
  async findByEmail(email) {
    try {
      const result = await db.query("SELECT * FROM ph_users WHERE email = $1", [email]);
      return result.rows[0] || null;
    } catch (err) {
      log(LOG_LEVELS.ERROR, "UserRepository.findByEmail failed", {
        error: err.message,
        stack: err.stack,
      });
      throw err;
    }
  }

  async createUser({ name, email, password, role= "customer" }) {
    try {
      const result = await db.query(
        "INSERT INTO ph_users (name, email, password, role, status) VALUES ($1, $2, $3, $4, 'active') RETURNING *",
        [name, email, password, role]
      );
      return result.rows[0];
    } catch (err) {
      log(LOG_LEVELS.ERROR, "UserRepository.createUser failed", {
        error: err.message,
        stack: err.stack,
      });
      throw err;
    }
  }


  async verifyPassword(hashedPassword, userPassword) {
    try {
      if (!hashedPassword) return false;    
      return bcryptVerifyPassword(hashedPassword, userPassword); 
    } catch (err) {
      log(LOG_LEVELS.ERROR, "UserRepository.verifyPassword failed", {
        error: err.message,
        stack: err.stack,
      });
      throw err;
    }
  }

  async updatePassword(userId, newPassword) {
    try {
      const
        result = await db.query(
          "UPDATE ph_users SET password_hash = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
          [newPassword, userId]
        );
      return result.rows[0];
    } catch (err) {
      log(LOG_LEVELS.ERROR, "UserRepository.updatePassword failed", {
        error: err.message,
        stack: err.stack,
        userId,
      });
      throw err;
    } 
  }

  async getUsers(page = 1, limit = 10, role = 'user') {
      try {
        const offset = (page - 1) * limit;
        const result = await db.query(
          `SELECT * FROM ph_users WHERE role=$1 AND deleted = 0 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
          [role, limit, offset]
        );
        return result.rows;
      } catch (err) {
        log(LOG_LEVELS.ERROR, "UserRepository.getUsers failed", {
          error: err.message,
          stack: err.stack,
          page,
          limit,
        });
        throw err;
      }
    }

  async deleteUser(userId) {
    try {
      const result = await db.query(
        "UPDATE ph_users SET deleted = 1 WHERE user_id = $1 RETURNING *",
        [userId]
      );
      return result.rowCount > 0;
    } catch (err) {
      log(LOG_LEVELS.ERROR, "UserRepository.deleteUser failed", {
        error: err.message,
        stack: err.stack,
        userId,
      });
      throw err;
    }
  }

  async suspendUser(userId) {
    try {
      const result = await db.query(
        "UPDATE ph_users SET status = 'suspended', updated_at = NOW() WHERE user_id = $1 RETURNING *",
        [userId]
      );
      return result.rows[0];
    } catch (err) {
      log(LOG_LEVELS.ERROR, "UserRepository.suspendUser failed", {
        error: err.message,
        stack: err.stack,
        userId,
      });
      throw err;
    }
  }

  async reactivateUser(userId) {
    try {
      const result = await db.query(
        "UPDATE ph_users SET status = 'active', updated_at = NOW() WHERE user_id = $1 RETURNING *",
        [userId]
      );
      return result.rows[0];
    } catch (err) {
      log(LOG_LEVELS.ERROR, "UserRepository.reactivateUser failed", {
        error: err.message,
        stack: err.stack,
        userId,
      });
      throw err;
    }
  }
};

module.exports = new UserRepository;
