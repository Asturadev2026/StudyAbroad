import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

export const neon = new Pool({
  connectionString: process.env.NEON_DB_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// test connection
(async () => {
  try {
    const res = await neon.query("SELECT 1");
    console.log("✅ Neon DB Connected");
  } catch (err) {
    console.error("❌ Neon DB Connection Failed:", err);
  }
})();