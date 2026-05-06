import express from "express";
import { getRecommendations } from "../services/recommendationService.js";

const router = express.Router();

router.post("/recommend", async (req, res) => {
  try {
    const result = await getRecommendations(req.body || {});

    res.json({
      success: true,
      fallback_used: result.fallback_used,
      message: result.message,
      topPicks: result.topPicks || [],
      otherOptions: result.otherOptions || [],
      pathwayOptions: result.pathwayOptions || [],
      courses: result.courses,
      count: result.courses.length,
      formatted: result.formatted,
    });
  } catch (err) {
    console.error("Recommendation error:", err);

    res.status(500).json({
      success: false,
      fallback_used: false,
      message: "Failed to get recommendations",
      topPicks: [],
      otherOptions: [],
      pathwayOptions: [],
      courses: [],
      count: 0,
      formatted: null,
      error: "Failed to get recommendations",
    });
  }
});

export default router;
