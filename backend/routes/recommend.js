import express from "express";
import { getRecommendations } from "../services/recommendationService.js";
import { formatRecommendations } from "../services/recommendationFormatter.js";

const router = express.Router(); // ✅ REQUIRED

router.post("/recommend", async (req, res) => {
  console.log("🚀 /recommend API HIT");

  try {
    const userData = req.body;

    console.log("🧠 USER DATA:", userData);

    // 🔹 Step 1: RAG
    const courses = await getRecommendations(userData);

    console.log("📊 RAW COURSES:", courses.length);

    // 🔹 Step 2: LLM formatting
    let formatted = null;

    try {
      formatted = await formatRecommendations(userData, courses);
      console.log("✨ LLM OUTPUT:", formatted);
    } catch (err) {
      console.error("⚠️ LLM failed:", err.message);
    }

    res.json({
      success: true,
      courses,
      formatted,
    });

  } catch (err) {
    console.error("❌ Recommendation error:", err);

    res.status(500).json({
      success: false,
      error: "Failed to get recommendations",
    });
  }
});

export default router; // ✅ NOW WORKS