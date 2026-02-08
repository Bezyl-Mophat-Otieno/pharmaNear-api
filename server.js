const app = require("./src/app");
const { pool } = require("./src/db");
const { log, LOG_LEVELS } = require("./src/utils/logger");

const PORT = process.env.PORT || 3001;

(async () => {
  try {
    await pool.query("SELECT 1");
    log(LOG_LEVELS.INFO, "✅ Connected to PostgreSQL database");
    app.listen(PORT, () => {
      log(LOG_LEVELS.INFO, `✅ Server is running on port ${PORT}`);
    });
  } catch (err) {
    log(LOG_LEVELS.ERROR, "❌ Failed to connect to PostgreSQL", {
      error: err.message,
      stack: err.stack,
    });
    process.exit(1); 
  }
})();
