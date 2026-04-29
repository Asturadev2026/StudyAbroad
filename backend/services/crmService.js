import { db } from "../db/index.js";

export const getCountries = async () => {
  const [rows] = await db.query(
    "SELECT id, name FROM countries WHERE is_active = 1"
  );
  return rows;
};

export const getStatesByCountry = async (countryId) => {
  const [rows] = await db.query(
    "SELECT id, name FROM states WHERE country_id = ?",
    [countryId]
  );
  return rows;
};

export const createLead = async (data) => {
  const {
    name,
    email,
    mobile,
    visaType,
    address,
    education,
    countryIds,
  } = data;

  const [result] = await db.query(
    `INSERT INTO leads 
    (name, email, phone, visa_type, address, education)
    VALUES (?, ?, ?, ?, ?, ?)`,
    [
      name || "",
      email || "",
      mobile || "",
      visaType || "",
      address || "",
      education || "",
    ]
  );

  const leadId = result.insertId;

  // countries (unchanged)
  if (countryIds && countryIds.length > 0) {
    const values = countryIds.map((cid) => [leadId, cid]);

    await db.query(
      `INSERT INTO lead_countries (lead_id, country_id)
       VALUES ?`,
      [values]
    );
  }

  return { leadId };
};