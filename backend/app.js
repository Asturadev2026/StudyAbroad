import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";

import crmRoutes from "./routes/crm.js";
import recommendationRoutes from "./routes/recommend.js";
import aiRoutes from "./routes/ai.js"; // ✅ moved to top

const app = express();

// ✅ CORS
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://study-abroad-gilt.vercel.app"
  ]
}));

// ✅ Middleware
app.use(express.json());

// ✅ ROUTES
app.use("/api", crmRoutes);

// OPTION 1 (keep both)
app.use("/api", recommendationRoutes); // /api/recommend
app.use("/api/ai", aiRoutes);          // /api/ai/counsellor

// -----------------------------------
// OR OPTION 2 (cleaner - recommended)
// Remove recommendationRoutes
// and use only aiRoutes for everything
// -----------------------------------

// app.use("/api/ai", aiRoutes);

// ✅ Global error handler
app.use((err, req, res, next) => {
  console.error("🔥 Global Error:", err);
  res.status(500).json({ error: "Something went wrong" });
});

// ✅ PORT
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
