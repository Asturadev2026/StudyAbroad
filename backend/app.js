import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";

import crmRoutes from "./routes/crm.js";

const app = express();

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://study-abroad-gilt.vercel.app"
  ]
}));
app.use(express.json());

app.use("/api", crmRoutes);

// ✅ Global error handler
app.use((err, req, res, next) => {
  console.error("🔥 Global Error:", err);
  res.status(500).json({ error: "Something went wrong" });
});

// ✅ Use env port
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
