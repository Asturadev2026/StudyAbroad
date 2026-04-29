import express from "express";
import { pool } from "../db/index.js";

const router = express.Router();

router.get("/:email", async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM users WHERE email=$1",
    [req.params.email]
  );

  if (result.rows.length === 0)
    return res.json({ exists: false });

  res.json({ exists: true, user: result.rows[0] });
});

router.post("/save-user", async (req, res) => {
  const { name, email, country, course } = req.body;

  await pool.query(
    `INSERT INTO users(name,email,country,course)
     VALUES($1,$2,$3,$4)
     ON CONFLICT(email)
     DO UPDATE SET name=$1,country=$3,course=$4`,
    [name, email, country, course]
  );

  res.json({ success: true });
});

export default router;
