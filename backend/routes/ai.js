import express from "express";
import {
  getRecommendations,
  handleCounsellorQuery,
} from "../services/aiService.js";

const router = express.Router();


// =====================================
// 🎯 1. COURSE RECOMMENDATION API
// (USED IN YOUR FLOW)
// =====================================
router.post("/recommend", async (req, res) => {
  try {
    const result = await getRecommendations(req.body);

    res.json({
      courses: result.courses || [],
      formatted: result.formatted || null,
    });

  } catch (err) {
    console.error("❌ RECOMMEND ERROR:", err);

    res.status(500).json({
      courses: [],
      formatted: null,
    });
  }
});


// =====================================
// 🤖 2. AI COUNSELLOR (NEW)
// (USED FOR FALLBACK CHAT)
// =====================================
router.post("/counsellor", async (req, res) => {
  try {
    const { query, context } = req.body;

    const answer = await handleCounsellorQuery(query, context);

    res.json({
      answer,
    });

  } catch (err) {
    console.error("❌ COUNSELLOR ERROR:", err);

    res.status(500).json({
      answer: "⚠️ I'm having trouble responding right now. Please try again.",
    });
  }
});


export default router;