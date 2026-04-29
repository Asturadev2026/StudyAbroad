import express from "express";
import {
  getCountries,
  getStatesByCountry,
  createLead,
} from "../services/crmService.js";

const router = express.Router();

// ✅ GET COUNTRIES
router.get("/countries", async (req, res) => {
  try {
    const data = await getCountries();
    res.json(data);
  } catch (err) {
    console.error("❌ Error fetching countries:", err);
    res.status(500).json({ error: "Failed to fetch countries" });
  }
});

// ✅ GET STATES
router.get("/states/:countryId", async (req, res) => {
  try {
    const { countryId } = req.params;
    const data = await getStatesByCountry(countryId);
    res.json(data);
  } catch (err) {
    console.error("❌ Error fetching states:", err);
    res.status(500).json({ error: "Failed to fetch states" });
  }
});

// ✅ CREATE LEAD
router.post("/lead", async (req, res) => {
  try {
    const payload = req.body;

    console.log("📩 Incoming Lead:", payload);

    // 🔥 BASIC VALIDATION (important)
    if (!payload) {
      return res.status(400).json({ error: "No data provided" });
    }

    const result = await createLead(payload);

    res.json({
      success: true,
      leadId: result.leadId || result.insertId,
    });
  } catch (err) {
    console.error("❌ Error creating lead:", err);
    res.status(500).json({ error: "Failed to create lead" });
  }
});

export default router;