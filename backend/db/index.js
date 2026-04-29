import dotenv from "dotenv";
dotenv.config();
import mysql from "mysql2/promise";

export const db = await mysql.createPool({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT,
  ssl: {
    rejectUnauthorized: false,
  },
});

// test connection
(async () => {
  try {
    const conn = await db.getConnection();
    console.log("✅ DB Connected");
    conn.release();
  } catch (err) {
    console.error("❌ DB Connection Failed:", err);
  }
})();
console.log("ENV CHECK:", {
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
});