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
    service,

    countryIds,

    qualification,
    education,
    field,

    ieltsScore,
    intake,

    visaDuration,
    purpose,

    spouseName,
    spouseEmail,
    spousePhone,
    spouseVisaType,

    address,
    description,

    exam,
    mode,
    timing,
    goal,

    summary,
  } = data;

  const [result] = await db.query(
    `
    INSERT INTO leads (
      name,
      email,
      phone,

      visa_type,
      service,

      country_ids,

      qualification,
      education,
      field_of_study,

      ielts_score,
      intake,

      visa_duration,
      purpose,

      spouse_name,
      spouse_email,
      spouse_phone,
      spouse_visa_type,

      address,
      description,

      exam,
      coaching_mode,
      coaching_timing,
      coaching_goal,

      summary
    )
    VALUES (
      ?, ?, ?,
      ?, ?,
      ?,
      ?, ?, ?,
      ?, ?,
      ?, ?,
      ?, ?, ?, ?,
      ?, ?,
      ?, ?, ?, ?,
      ?
    )
    `,
    [
      name || "",
      email || "",
      mobile || "",

      visaType || "",
      service || "",

      JSON.stringify(countryIds || []),

      qualification || "",
      education || "",
      field || "",

      ieltsScore || "",
      intake || "",

      visaDuration || "",
      purpose || "",

      spouseName || "",
      spouseEmail || "",
      spousePhone || "",
      spouseVisaType || "",

      address || "",
      description || "",

      exam || "",
      mode || "",
      timing || "",
      goal || "",

      summary || "",
    ]
  );

  return {
    leadId: result.insertId,
  };
};
export const getStudyLevels = async () => {
  const [rows] = await db.query(`
    SELECT id, title
FROM study_levels
WHERE is_active = 1
ORDER BY title
  `);

  return rows;
};