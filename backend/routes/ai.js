import express from "express";
import { getRecommendations } from "../services/aiService.js";

const router = express.Router();

router.post("/recommend", async (req, res) => {
  const result = await getRecommendations(req.body);
  res.json({ message: result });
});

export default router;
