const fs = require("fs");
const path = require("path");
const db = require("../db");
const { log, LOG_LEVELS } = require("../utils/logger");

const SCHEMA_ROOT = path.join(__dirname, "../db/schemas");

async function runMigrations() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    await db.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

    const subDirs = fs.readdirSync(SCHEMA_ROOT).filter(entry => {
      const fullPath = path.join(SCHEMA_ROOT, entry);
      return fs.statSync(fullPath).isDirectory();
    });

    for (const dir of subDirs.sort()) {
      const dirPath = path.join(SCHEMA_ROOT, dir);
      const files = fs
        .readdirSync(dirPath)
        .filter(f => f.endsWith(".sql"))
        .sort();

      for (const file of files) {
        const filePath = path.join(dirPath, file);

        const alreadyRun = await db.query(
          "SELECT 1 FROM migrations WHERE filename = $1",
          [file]
        );
        if (alreadyRun.rows.length > 0) {
          log(LOG_LEVELS.INFO, `⬅️  Skipping already applied: ${file}`);
          continue;
        }

        const sql = fs.readFileSync(filePath, "utf-8");

        try {
          log(LOG_LEVELS.INFO, `➡️  Applying: ${dir}/${file}`);
          await db.query("BEGIN");
          await db.query(sql);
          await db.query(
            "INSERT INTO migrations (filename) VALUES ($1)",
            [file]
          );
          await db.query("COMMIT");
          log(LOG_LEVELS.INFO, `✅ Applied: ${file}`);
        } catch (err) {
          await db.query("ROLLBACK");
          log(LOG_LEVELS.ERROR, `❌ Migration failed: ${file}`, {
            error: err.message,
          });
          throw err;
        }
      }
    }

    log(LOG_LEVELS.INFO, "🎉 All migrations complete");
    process.exit(0);
  } catch (err) {
    log(LOG_LEVELS.ERROR, "Migration script failed", {
      error: err.message,
      stack: err.stack,
    });
    process.exit(1);
  }
}

runMigrations();
