import { db } from "../db/index.js";
import { neon } from "../db/neon.js";
import { generateEmbedding } from "./embeddingService.js";

const RESULT_LIMIT = 7;
const MIN_RESULT_LIMIT = 6;
const CANDIDATE_LIMIT = 50;
const MIN_STRICT_RESULTS = 3;

const COUNTRY_ID_ALIASES = {
  232: [285], // UK -> United Kingdom
  285: [232], // United Kingdom -> UK
  233: [286], // USA -> United States
  286: [233], // United States -> USA
};

const STUDY_LEVEL_LABELS = {
  2: "diploma",
  22: "bachelor",
  24: "master",
  25: "phd",
  26: "certificate",
};

const LEVEL_TITLE_KEYWORDS = {
  bachelor: ["bachelor", "bsc", "ba ", "b.a", "beng", "llb"],
  foundation: ["foundation"],
  diploma: ["diploma"],
  certificate: ["certificate"],
  master: ["master", "masters", "msc", "ma ", "m.a", "mba"],
  phd: ["phd", "doctor", "doctoral"],
};

const FIELD_MAP = {
  "Engineering / IT": {
    match: ["engineering", "it", "technology", "computer", "software"],
    keywords: ["engineering", "computer", "software", "it", "technology"],
    fallbackKeywords: ["engineering", "computer", "software", "it", "technology"],
    blockedKeywords: ["culinary", "cooking", "cookery", "kitchen", "arts", "fine art", "design", "fashion", "hospitality", "tourism", "dental", "health", "medical", "nursing"],
  },
  "Arts / Humanities": {
    match: ["arts", "humanities", "history", "literature", "philosophy"],
    keywords: ["arts", "history", "literature", "humanities", "philosophy"],
    fallbackKeywords: ["arts", "history", "literature", "humanities", "philosophy"],
    blockedKeywords: ["engineering", "business", "commerce", "management", "it", "construction", "hospitality", "tourism", "culinary", "cooking", "cookery", "kitchen", "computer", "software", "agriculture"],
  },
  Agriculture: {
    match: ["agriculture", "farming", "horticulture", "agronomy", "environment"],
    keywords: ["agriculture", "farming", "horticulture", "agronomy", "environment"],
    fallbackKeywords: ["agriculture", "horticulture", "environment", "food science"],
    blockedKeywords: [
      "business",
      "it",
      "computer",
      "software",
      "design",
      "hospitality",
      "hotel",
      "tourism",
      "culinary",
      "cooking",
      "cookery",
      "kitchen",
      "architecture",
      "architectural",
      "construction",
      "building",
      "built environment",
      "arts",
      "fine art",
      "fashion",
      "media",
      "criminology",
      "criminal",
      "law",
      "psychology",
    ],
  },
  "Business / MBA": {
    match: ["business", "mba", "management", "marketing", "finance", "commerce"],
    keywords: ["business", "mba", "management", "marketing", "finance", "commerce"],
    fallbackKeywords: ["business", "management", "marketing", "finance", "commerce"],
    blockedKeywords: ["engineering", "construction", "architecture", "architectural", "design", "culinary", "cooking", "cookery", "fine art", "arts", "information technology"],
  },
};

const FIELD_PROFILES = [
  ...Object.entries(FIELD_MAP).map(([field, config]) => ({ field, ...config })),
];

function normalizeText(value = "") {
  return String(value).toLowerCase().trim();
}

function titleContainsAny(title = "", keywords = []) {
  const normalizedTitle = normalizeText(title);
  return keywords.some((keyword) => normalizedTitle.includes(normalizeText(keyword)));
}

function inputContainsKeyword(input, keyword) {
  const normalizedInput = normalizeText(input);
  const normalizedKeyword = normalizeText(keyword);

  if (normalizedKeyword === "it") {
    return /\b(it|information technology)\b/i.test(normalizedInput);
  }

  return new RegExp(`\\b${escapeRegExp(normalizedKeyword)}\\b`, "i").test(normalizedInput);
}

function normalizeArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value.filter(Boolean) : [value];
}

function normalizeCountryIds(userInput = {}) {
  const ids = normalizeArray(userInput.countries || userInput.countryIds)
    .map((value) => Number(value))
    .filter(Number.isInteger);

  return [
    ...new Set(ids.flatMap((id) => [id, ...(COUNTRY_ID_ALIASES[id] || [])])),
  ];
}

function getOriginalCountryIds(userInput = {}) {
  return normalizeArray(userInput.countries || userInput.countryIds)
    .map((value) => Number(value))
    .filter(Number.isInteger);
}

function mapQualificationToStudyLevel(qualification = "") {
  const normalized = normalizeText(qualification);

  if (normalized.includes("post graduate") || normalized.includes("masters") || normalized.includes("master")) {
    return 24;
  }

  if (normalized.includes("graduate") || normalized.includes("bachelors") || normalized.includes("bachelor")) {
    return 24;
  }

  if (normalized.includes("12th")) {
    return 22;
  }

  return null;
}

function mapQualificationToStudyLevels(qualification = "") {
  return getQualificationPlan(qualification).queryLevels;
}

function mapQualificationToAllowedLevels(qualification = "") {
  const normalized = normalizeText(qualification);

  if (normalized.includes("12th")) {
    return ["bachelor", "foundation"];
  }

  if (normalized.includes("diploma")) {
    return ["diploma", "certificate"];
  }

  if (normalized.includes("post graduate") || normalized.includes("masters") || normalized.includes("master")) {
    return ["master", "phd"];
  }

  if (normalized.includes("graduate") || normalized.includes("bachelors") || normalized.includes("bachelor")) {
    return ["master"];
  }

  return ["bachelor"];
}

function getQualificationPlan(qualification = "") {
  const allowedLevels = mapQualificationToAllowedLevels(qualification);
  const levelToStudyIds = {
    bachelor: [22],
    foundation: [22],
    diploma: [2],
    certificate: [26],
    master: [24],
    phd: [25],
  };
  const queryLevels = [
    ...new Set(allowedLevels.flatMap((level) => levelToStudyIds[level] || [])),
  ];

  return {
    allowedLevels,
    directLevels: queryLevels,
    pathwayLevels: [],
    queryLevels,
  };
}

function getCourseLevelType(course, qualification = "") {
  return matchesLevel(course, qualification) ? "direct" : null;
}

function matchesLevel(course, qualification = "") {
  const allowedLevels = mapQualificationToAllowedLevels(qualification);
  const title = normalizeText(course.title || "");
  const studyLevel = Number(course.study_levels);
  const normalizedQualification = normalizeText(qualification);

  if (titleContainsAny(title, ["bachelor"]) && titleContainsAny(title, ["master", "masters", "msc", "ma ", "m.a", "mba"])) {
    return false;
  }

  if (!normalizedQualification.includes("12th") && titleContainsAny(title, ["foundation", "pathway"])) {
    return false;
  }

  if (normalizedQualification.includes("graduate") || normalizedQualification.includes("bachelor")) {
    if (titleContainsAny(title, ["bachelor", "foundation", "diploma", "certificate"])) {
      return false;
    }
  }

  if (normalizedQualification.includes("post graduate") || normalizedQualification.includes("masters") || normalizedQualification.includes("master")) {
    if (titleContainsAny(title, ["bachelor", "foundation", "diploma", "certificate"])) {
      return false;
    }
  }

  if (normalizedQualification.includes("diploma")) {
    if (titleContainsAny(title, ["bachelor", "master", "masters", "msc", "foundation", "pathway", "phd", "graduate certificate"])) {
      return false;
    }
  }

  if (studyLevel === 22) {
    return allowedLevels.includes("bachelor") || allowedLevels.includes("foundation");
  }

  if (studyLevel === 2) {
    return allowedLevels.includes("diploma");
  }

  if (studyLevel === 26) {
    return allowedLevels.includes("certificate");
  }

  if (studyLevel === 24) {
    return allowedLevels.includes("master");
  }

  if (studyLevel === 25) {
    return allowedLevels.includes("phd");
  }

  return allowedLevels.some((level) => titleContainsAny(title, LEVEL_TITLE_KEYWORDS[level] || [level]));
}

function extractFieldKeywords(field = "") {
  const profile = getFieldProfile(field);
  return profile ? profile.keywords : String(field)
    .split(/[^a-zA-Z0-9]+/)
    .map((word) => word.trim().toLowerCase())
    .filter((word) => word.length > 1);
}

function getFieldProfile(field = "") {
  const profile = FIELD_PROFILES.find((item) =>
    item.match.some((keyword) => inputContainsKeyword(field, keyword))
  );

  return profile || null;
}

function getFieldKeywords(field = "", useFallback = false) {
  const profile = getFieldProfile(field);

  if (!profile) {
    return extractFieldKeywords(field);
  }

  return useFallback ? profile.fallbackKeywords : profile.keywords;
}

function buildEmbeddingQuery(userInput, studyLevel, fieldKeywords) {
  const level = STUDY_LEVEL_LABELS[studyLevel] || "program";
  return `${level} ${fieldKeywords.join(" ")} programs ${userInput.goal || ""} ${userInput.intake || ""}`.trim();
}

function buildTextSearchPatterns(fieldKeywords) {
  return fieldKeywords
    .filter((keyword) => normalizeText(keyword).length > 2)
    .map((keyword) => `%${keyword}%`);
}

function courseSearchText(course = {}) {
  return normalizeText(`${course.title || ""} ${course.description || ""}`);
}

function textMatchesAnyKeyword(text, keywords = []) {
  return keywords.some((keyword) => textContainsKeyword(text, keyword));
}

function hasBlockedFieldKeyword(course, field = "") {
  const profile = getFieldProfile(field);
  const text = courseSearchText(course);

  if (textContainsKeyword(text, "architecture") || textContainsKeyword(text, "architectural")) {
    return !inputContainsKeyword(field, "architecture");
  }

  return Boolean(profile?.blockedKeywords?.length)
    && textMatchesAnyKeyword(text, profile.blockedKeywords);
}

function isAllowedProgramType(course = {}, qualification = "") {
  const title = normalizeText(course.title || "");
  const text = courseSearchText(course);
  const blockedProgramTerms = [
    "study abroad",
    "short course",
    "scholarship",
    "summer school",
    "bootcamp",
    "workshop",
    "seminar",
    "comptia",
  ];

  if (blockedProgramTerms.some((term) => textContainsKeyword(text, term))) {
    return false;
  }

  if (!normalizeText(qualification).includes("diploma") && textContainsKeyword(title, "certificate")) {
    return false;
  }

  return true;
}

function matchesField(course, field = "", useFallback = false) {
  const keywords = getFieldKeywords(field, useFallback);
  const title = normalizeText(course.title || "");
  const text = courseSearchText(course);

  if (hasBlockedFieldKeyword(course, field)) {
    return false;
  }

  if (inputContainsKeyword(field, "engineering") || inputContainsKeyword(field, "it")) {
    const strongTerms = ["engineering", "computer", "software", "information technology"];
    return textMatchesAnyKeyword(title, strongTerms)
      || textMatchesAnyKeyword(text, strongTerms);
  }

  if (inputContainsKeyword(field, "business") || inputContainsKeyword(field, "mba")) {
    const strongBusinessTerms = ["business", "mba", "marketing", "finance", "commerce"];

    if (textMatchesAnyKeyword(title, strongBusinessTerms)) {
      return true;
    }

    return textContainsKeyword(title, "management")
      && textMatchesAnyKeyword(text, ["business", "administration", "operations", "leadership", "commerce", "finance", "marketing"]);
  }

  if (inputContainsKeyword(field, "agriculture")) {
    const strictTitleTerms = ["agriculture", "farming", "horticulture", "agronomy", "food science"];
    const fallbackTerms = ["agriculture", "farming", "horticulture", "agronomy", "food science", "environment"];

    if (!useFallback) {
      return textMatchesAnyKeyword(title, strictTitleTerms);
    }

    return textMatchesAnyKeyword(title, fallbackTerms)
      || textMatchesAnyKeyword(text, strictTitleTerms);
  }

  if (inputContainsKeyword(field, "arts") || inputContainsKeyword(field, "humanities")) {
    return textMatchesAnyKeyword(title, keywords)
      || textMatchesAnyKeyword(text, ["arts", "humanities", "history", "literature", "philosophy"]);
  }

  return textMatchesAnyKeyword(title, keywords) || textMatchesAnyKeyword(text, keywords);
}

function isSafeRecommendation(course, userInput = {}, useFallback = false) {
  return matchesField(course, userInput.field, useFallback)
    && matchesLevel(course, userInput.qualification)
    && isAllowedProgramType(course, userInput.qualification);
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function textContainsKeyword(text, keyword) {
  const normalizedKeyword = normalizeText(keyword);

  if (normalizedKeyword === "it") {
    return /\b(it|information technology)\b/i.test(text);
  }

  return new RegExp(`\\b${escapeRegExp(normalizedKeyword)}\\b`, "i").test(text);
}

function countTitleKeywordMatches(course, fieldKeywords) {
  const title = normalizeText(course.title);
  return fieldKeywords.filter((keyword) => textContainsKeyword(title, keyword)).length;
}

function countTextKeywordMatches(course, fieldKeywords) {
  const text = courseSearchText(course);
  return fieldKeywords.filter((keyword) => textContainsKeyword(text, keyword)).length;
}

function titleHasAdvancedSignal(title = "") {
  const normalized = normalizeText(title);
  return /\b(honours|honors|advanced|research|thesis|integrated|mres|mphil)\b/i.test(normalized);
}

function isArtsHumanitiesProfile(fieldKeywords) {
  const normalizedKeywords = fieldKeywords.map((keyword) => normalizeText(keyword));
  return normalizedKeywords.includes("arts") || normalizedKeywords.includes("humanities");
}

function courseTextMatchesField(course, fieldKeywords) {
  const title = normalizeText(course.title || "");
  const description = normalizeText(course.description || "");
  const text = `${title} ${description}`;

  if (isArtsHumanitiesProfile(fieldKeywords)) {
    const strongTextTerms = [
      "arts",
      "humanities",
      "media",
      "communication",
      "creative",
      "fine art",
      "visual art",
      "performing arts",
      "cultural",
      "indigenous studies",
    ];

    return strongTextTerms.some((keyword) => textContainsKeyword(text, keyword))
      || textContainsKeyword(title, "design")
      || textContainsKeyword(title, "architecture")
      || textContainsKeyword(title, "fashion");
  }

  return fieldKeywords.some((keyword) => textContainsKeyword(text, keyword));
}

function studyStreamsMatch(studyStreams, tokens) {
  const streamValues = normalizeArray(studyStreams).map((value) => normalizeText(value));
  return tokens.some((token) => streamValues.includes(normalizeText(token)));
}

function courseMatchesField(course, fieldKeywords, streamTokens) {
  return studyStreamsMatch(course.study_streams, fieldKeywords)
    || courseTextMatchesField(course, fieldKeywords)
    || (studyStreamsMatch(course.study_streams, streamTokens) && courseTextMatchesField(course, fieldKeywords));
}

function inferCategory(course) {
  const text = normalizeText(`${course.title || ""} ${course.description || ""}`);

  if (
    textContainsKeyword(text, "Agriculture")
    || textContainsKeyword(text, "Farming")
    || textContainsKeyword(text, "Horticulture")
    || textContainsKeyword(text, "Agronomy")
    || textContainsKeyword(text, "Food Science")
  ) {
    return "Agriculture";
  }

  if (
    textContainsKeyword(text, "Environment")
    || textContainsKeyword(text, "Environmental")
  ) {
    return "Environment";
  }

  if (
    textContainsKeyword(text, "Arts")
    || textContainsKeyword(text, "Humanities")
    || textContainsKeyword(text, "Fine Art")
    || textContainsKeyword(text, "Creative")
    || textContainsKeyword(text, "Cultural")
  ) {
    return "Arts / Humanities";
  }

  if (
    textContainsKeyword(text, "Media")
    || textContainsKeyword(text, "Communication")
    || textContainsKeyword(text, "Design")
    || textContainsKeyword(text, "Architecture")
    || textContainsKeyword(text, "Fashion")
  ) {
    return "Design / Media";
  }

  if (
    textContainsKeyword(text, "Artificial Intelligence")
    || textContainsKeyword(text, "AI")
    || textContainsKeyword(text, "Data")
    || textContainsKeyword(text, "Analytics")
    || textContainsKeyword(text, "Machine Learning")
  ) {
    return "AI / Data Science";
  }

  if (
    (textContainsKeyword(text, "Business") || textContainsKeyword(text, "Management"))
    && (textContainsKeyword(text, "IT") || textContainsKeyword(text, "Technology") || textContainsKeyword(text, "Information"))
  ) {
    return "Hybrid (Business + IT)";
  }

  if (textContainsKeyword(text, "Software")) return "Software Engineering";
  if (textContainsKeyword(text, "Computer")) return "Computer Science";
  if (textContainsKeyword(text, "Engineering")) return "Engineering";
  if (textContainsKeyword(text, "Technology") || textContainsKeyword(text, "IT") || textContainsKeyword(text, "Information")) return "Information Technology";

  return "Other";
}

function buildReason(course) {
  const category = inferCategory(course);

  return getReasonForCategory(category, 0);
}

function getReasonForCategory(category, index = 0) {
  const reasonsByCategory = {
    "Software Engineering": [
      "Strong focus on software development",
      "Good fit for building practical coding and application design skills",
    ],
    "Computer Science": [
      "Strong foundation in programming and advanced computing",
      "Builds core computing knowledge for technical postgraduate pathways",
    ],
    "Information Technology": [
      "Covers IT systems, networking, and enterprise tech",
      "Useful for applied technology roles and systems-focused learning",
    ],
    Engineering: [
      "Covers core engineering principles with practical learning",
      "Good fit for technical problem-solving and applied engineering skills",
    ],
    "AI / Data Science": [
      "Focus on machine learning, data, and future technologies",
      "Strong option for data-driven and emerging technology pathways",
    ],
    "Hybrid (Business + IT)": [
      "Combines technology with business skills",
      "Useful if you want technical knowledge with management flexibility",
    ],
    "Arts / Humanities": [
      "Builds creative, cultural, and communication-focused skills",
      "Good fit for humanities, creative arts, and broad career pathways",
    ],
    "Design / Media": [
      "Focuses on visual, media, and design-led creative work",
      "Useful for creative industry roles and portfolio-based careers",
    ],
    Agriculture: [
      "Strong fit for agriculture, farming, and applied land-based studies",
      "Relevant for practical agriculture and sustainable production pathways",
    ],
    Environment: [
      "Connects environmental knowledge with practical sustainability skills",
      "Useful for environment-focused roles linked to agriculture and food systems",
    ],
  };

  const reasons = reasonsByCategory[category] || ["Matches your selected study profile"];
  return reasons[index % reasons.length];
}

function buildReasonForCourse(course, userInput = {}) {
  const text = courseSearchText(course);
  const field = normalizeText(userInput.field);

  if (field.includes("business") || field.includes("mba")) {
    if (textContainsKeyword(text, "marketing")) return "Relevant for branding, digital strategy, and market growth roles";
    if (textContainsKeyword(text, "finance")) return "Builds finance, analysis, and commercial decision-making skills";
    if (textContainsKeyword(text, "commerce")) return "Covers commerce foundations for business and management careers";
    return "Develops management, operations, and leadership skills";
  }

  if (field.includes("engineering") || inputContainsKeyword(userInput.field, "it")) {
    if (textContainsKeyword(text, "software")) return "Strong fit for software systems, coding, and application development";
    if (textContainsKeyword(text, "computer")) return "Builds computing, systems, and technical problem-solving skills";
    if (textContainsKeyword(text, "technology")) return "Covers applied technology skills for modern technical roles";
    return "Focuses on engineering systems, design, and practical technical skills";
  }

  if (field.includes("agriculture")) {
    if (textContainsKeyword(text, "horticulture")) return "Relevant for plant production, horticulture, and practical growing skills";
    if (textContainsKeyword(text, "environment")) return "Connects agriculture with sustainability and environmental practice";
    if (textContainsKeyword(text, "food science")) return "Links food systems with applied agricultural knowledge";
    return "Strong fit for agriculture, farming, and land-based study pathways";
  }

  if (field.includes("arts") || field.includes("humanities")) {
    if (textContainsKeyword(text, "history")) return "Develops historical analysis, research, and cultural understanding";
    if (textContainsKeyword(text, "literature")) return "Builds writing, interpretation, and literature-focused analytical skills";
    if (textContainsKeyword(text, "philosophy")) return "Strengthens critical thinking, reasoning, and humanities foundations";
    return "Builds creative, cultural, and communication-focused humanities skills";
  }

  return getReasonForCategory(course.category || inferCategory(course), 0);
}

function preparePresentationRows(rows, userInput) {
  const usedScores = new Set();
  const categoryCounts = new Map();

  return rows.map((row) => {
    let score = row.match_score;

    while (usedScores.has(score) && score > 70) {
      score -= 1;
    }

    usedScores.add(score);

    const category = row.category || inferCategory(row);
    const categoryIndex = categoryCounts.get(category) || 0;
    categoryCounts.set(category, categoryIndex + 1);

    return {
      ...row,
      match_score: score,
      reason: buildReasonForCourse({ ...row, category }, userInput) || getReasonForCategory(category, categoryIndex),
    };
  });
}

async function getNeonCapabilities() {
  const [tables, columns] = await Promise.all([
    neon.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('countries', 'universities')
    `),
    neon.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'university_programs'
        AND column_name IN ('university_id')
    `),
  ]);

  return {
    hasCountries: tables.rows.some((row) => row.table_name === "countries"),
    hasUniversities: tables.rows.some((row) => row.table_name === "universities"),
    hasUniversityId: columns.rows.some((row) => row.column_name === "university_id"),
  };
}
async function getNamesFromMysql(table, ids) {
  const safeIds = [...new Set(ids.map(Number).filter(Number.isInteger))];
  if (safeIds.length === 0) return new Map();

  const placeholders = safeIds.map(() => "?").join(",");
  const [rows] = await db.query(
    `SELECT id, name FROM ${table} WHERE id IN (${placeholders})`,
    safeIds
  );

  return new Map(rows.map((row) => [Number(row.id), row.name]));
}

async function resolveStudyStreamTokens(studyLevels, fieldKeywords) {
  return fieldKeywords;
}

async function queryCandidates({
  capabilities,
  studyLevels,
  countryIds,
  fieldKeywords,
  streamTokens,
  vector,
  includeCountryFilter,
}) {
  const safeStudyLevels = normalizeArray(studyLevels).map(Number).filter(Number.isInteger);
  const textPatterns = buildTextSearchPatterns(fieldKeywords);
  const universityIdSelect = capabilities.hasUniversityId
    ? "p.university_id"
    : "NULL::int AS university_id";
  const universitySelect = capabilities.hasUniversities
    ? "u.name AS university_name"
    : "NULL::text AS university_name";
  const countrySelect = capabilities.hasCountries
    ? "c.name AS country_name"
    : "NULL::text AS country_name";
  const universityJoin = capabilities.hasUniversities && capabilities.hasUniversityId
    ? "LEFT JOIN universities u ON u.id = p.university_id"
    : "";
  const countryJoin = capabilities.hasCountries
    ? "LEFT JOIN countries c ON c.id = p.country_id"
    : "";
  const countryFilter = includeCountryFilter && countryIds.length > 0
    ? "AND p.country_id = ANY($1::int[])"
    : "";

  if (!includeCountryFilter || countryIds.length === 0) {
    const result = await neon.query(
      `
      SELECT
        p.id,
        p.title,
        p.description,
        ${universityIdSelect},
        p.country_id,
        p.study_levels,
        p.study_streams,
        p.intakes,
        p.average_salary,
        ${universitySelect},
        ${countrySelect},
        p.embedding <-> $3::vector AS distance
      FROM university_programs p
      ${universityJoin}
      ${countryJoin}
      WHERE
        p.embedding IS NOT NULL
        AND p.study_levels::int = ANY($1::int[])
        AND (
          p.study_streams ?| $2::text[]
          OR p.title ILIKE ANY($4::text[])
          OR p.description ILIKE ANY($4::text[])
          OR EXISTS (
            SELECT 1
            FROM jsonb_array_elements_text(p.study_streams) AS stream(value)
            WHERE stream.value = ANY($2::text[])
          )
        )
      ORDER BY p.embedding <-> $3::vector
      LIMIT ${CANDIDATE_LIMIT}
      `,
      [safeStudyLevels, streamTokens, vector, textPatterns]
    );

    return result.rows;
  }

  const result = await neon.query(
    `
    SELECT
      p.id,
      p.title,
      p.description,
      ${universityIdSelect},
      p.country_id,
      p.study_levels,
      p.study_streams,
      p.intakes,
      p.average_salary,
      ${universitySelect},
      ${countrySelect},
      p.embedding <-> $4::vector AS distance
    FROM university_programs p
    ${universityJoin}
    ${countryJoin}
    WHERE
      p.embedding IS NOT NULL
      ${countryFilter}
      AND p.study_levels::int = ANY($2::int[])
      AND (
        p.study_streams ?| $3::text[]
        OR p.title ILIKE ANY($5::text[])
        OR p.description ILIKE ANY($5::text[])
        OR EXISTS (
          SELECT 1
          FROM jsonb_array_elements_text(p.study_streams) AS stream(value)
          WHERE stream.value = ANY($3::text[])
        )
      )
    ORDER BY p.embedding <-> $4::vector
    LIMIT ${CANDIDATE_LIMIT}
    `,
    [countryIds, safeStudyLevels, streamTokens, vector, textPatterns]
  );

  return result.rows;
}

function removeDuplicateTitles(rows) {
  const counts = new Map();
  const unique = [];

  for (const row of rows) {
    const key = normalizeTitleGroup(row.title);
    const count = counts.get(key) || 0;

    if (count >= 1) continue;

    counts.set(key, count + 1);
    unique.push(row);
  }

  return unique;
}

function normalizeTitleGroup(title = "") {
  return normalizeText(title)
    .replace(/\([^)]*(honours|honors|industry|foundation|advanced|with placement year|integrated)[^)]*\)/gi, "")
    .replace(/\([^)]*\)/g, "")
    .replace(/\b(honours|honors|industry|foundation|advanced|with placement year|integrated|degree|program|programme|bachelor|master|masters|certificate|diploma)\b/gi, "")
    .replace(/\s*[-:]\s*(honours|honors|industry|foundation|advanced).*$/gi, "")
    .replace(/[^a-z0-9]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function applyCategoryDiversity(rows) {
  const categoryCounts = new Map();
  const selected = [];
  const overflow = [];

  for (const row of rows) {
    const category = inferCategory(row);
    const count = categoryCounts.get(category) || 0;

    if (count >= 2) {
      overflow.push(row);
      continue;
    }

    categoryCounts.set(category, count + 1);
    selected.push(row);
  }

  for (const row of overflow) {
    if (selected.length >= MIN_RESULT_LIMIT) break;
    selected.push(row);
  }

  return selected.slice(0, RESULT_LIMIT);
}

function calculateMatchScore(course, userInput, studyLevels, fieldKeywords, useFallback = false) {
  let score = 60;

  if (matchesField(course, userInput.field, useFallback)) score += 30;
  if (countTitleKeywordMatches(course, fieldKeywords) > 0) score += 20;
  if (countTextKeywordMatches(course, fieldKeywords) > 1) score += 5;
  if (matchesLevel(course, userInput.qualification)) score += 10;
  if (getCourseLevelType(course, userInput.qualification) === "pathway") score -= 8;

  if (normalizeText(userInput.goal).includes("higher") && titleHasAdvancedSignal(course.title)) {
    score += 5;
  }

  if (isBroadCombinedProgram(course.title)) score -= 8;

  return Math.max(70, Math.min(95, score));
}

function isBroadCombinedProgram(title = "") {
  const normalized = normalizeText(title);
  return normalized.includes(" / ")
    || normalized.includes("/")
    || normalized.includes(" and ")
    || normalized.includes("combined");
}

function salaryValue(course) {
  return Number(course.average_salary || 0);
}

function scoreAndSort(rows, userInput, studyLevels, fieldKeywords, useFallback = false) {
  return rows
    .map((row, index) => {
      const rawScore = calculateMatchScore(row, userInput, studyLevels, fieldKeywords, useFallback);
      const smallVariation = Math.min(4, index % 5);

      return {
        ...row,
        category: inferCategory(row),
        match_score: Math.max(70, rawScore - smallVariation),
      };
    })
    .sort((a, b) => {
      const scoreDiff = b.match_score - a.match_score;
      if (scoreDiff !== 0) return scoreDiff;

      const distanceDiff = Number(a.distance ?? 999) - Number(b.distance ?? 999);
      if (distanceDiff !== 0) return distanceDiff;

      return salaryValue(b) - salaryValue(a);
    });
}

async function enrichNames(rows) {
  const missingCountryIds = rows
    .filter((row) => !row.country_name)
    .map((row) => row.country_id);
  const missingUniversityIds = rows
    .filter((row) => !row.university_name && row.university_id)
    .map((row) => row.university_id);

  const [countryNames, universityNames] = await Promise.all([
    getNamesFromMysql("countries", missingCountryIds),
    getNamesFromMysql("universities", missingUniversityIds),
  ]);

  return rows.map((row) => ({
    ...row,
    country_name: row.country_name || countryNames.get(Number(row.country_id)) || String(row.country_id),
    university_name: row.university_name || universityNames.get(Number(row.university_id)) || null,
  }));
}

function mapCourse(row) {
  return {
    course_name: row.title,
    university: row.university_name,
    country: row.country_name,
    match_score: row.match_score,
    reason: row.reason || buildReason(row),
    category: row.category,
    type: row.type || "direct",
  };
}

async function getProgramCountsByCountry(countryIds) {
  const ids = [...new Set(countryIds.map(Number).filter(Number.isInteger))];
  if (ids.length === 0) return new Map();

  const result = await neon.query(
    `
    SELECT country_id, COUNT(*)::int AS count
    FROM university_programs
    WHERE country_id = ANY($1::int[])
    GROUP BY country_id
    `,
    [ids]
  );

  return new Map(result.rows.map((row) => [Number(row.country_id), Number(row.count)]));
}

function formatCountryList(countryNames) {
  const names = countryNames.filter(Boolean);
  return names.length > 0 ? names.join(", ") : "selected countries";
}

function buildFallbackMessage(countryNames, hasLimitedCountryData, fieldKeywords) {
  const countryText = formatCountryList(countryNames);
  const fieldText = fieldKeywords.slice(0, 2).join(" / ") || "relevant";

  if (hasLimitedCountryData) {
    return `Limited data for selected country. Showing best available ${fieldText} options.`;
  }

  return `No strong matches found in ${countryText}. Showing similar programs in other countries.`;
}

function splitRecommendationSections(courses = []) {
  const directCourses = courses.filter((course) => course.type !== "pathway");
  const pathwayOptions = courses.filter((course) => course.type === "pathway");

  return {
    topPicks: directCourses.slice(0, 2),
    otherOptions: directCourses.slice(2),
    pathwayOptions,
  };
}

async function buildFinalCourses(rows, userInput, studyLevels, fieldKeywords, useFallback = false) {
  const relevant = rows
    .filter((course) => isSafeRecommendation(course, userInput, useFallback))
    .map((course) => ({
      ...course,
      type: getCourseLevelType(course, userInput.qualification),
    }));
  const unique = removeDuplicateTitles(relevant);
  const scored = scoreAndSort(unique, userInput, studyLevels, fieldKeywords, useFallback);
  const diverse = applyCategoryDiversity(scored);
  const enriched = await enrichNames(diverse);
  const finalRows = enriched.filter((course) => isSafeRecommendation(course, userInput, useFallback));
  const presentationRows = preparePresentationRows(finalRows, userInput);

  return presentationRows.map(mapCourse);
}

function buildPersonalizedTip(userInput, fallbackUsed) {
  const goal = normalizeText(userInput.goal);

  if (goal.includes("higher")) {
    return fallbackUsed
      ? "For higher studies, shortlist advanced or honours-style programs first, then compare research options and pathway availability in each destination."
      : "For higher studies, prioritize honours, advanced, or research-oriented programs because they keep stronger postgraduate options open.";
  }

  if (goal.includes("job")) {
    return "For job outcomes, compare internship options, practical projects, and local post-study work pathways before choosing.";
  }

  if (goal.includes("pr")) {
    return "For PR goals, compare course relevance with each country's long-term skilled occupation and post-study work pathways.";
  }

  if (goal.includes("career")) {
    return "For a career switch, choose programs with practical projects and beginner-friendly foundations in the target field.";
  }

  return "Compare curriculum, intake, country pathway, and practical learning before finalizing your course shortlist.";
}

function formatCourseItem(course, index) {
  return `${index + 1}. ${course.course_name}
Country: ${course.country || "Country details available on request"}
Reason: ${course.reason}`;
}

function formatRecommendationText({ message, topPicks, otherOptions, pathwayOptions, userInput, fallbackUsed }) {
  const courses = [...topPicks, ...otherOptions, ...pathwayOptions];

  if (!courses.length) {
    return message || "Limited data available for your selected field and qualification. Please try a related field or different country.";
  }

  const messageBlock = message ? `${message}\n\n` : "";
  const topPickBlock = topPicks.length
    ? `Top Picks:\n\n${topPicks.map((course, index) => formatCourseItem(course, index)).join("\n\n")}`
    : "";
  const otherBlock = otherOptions.length
    ? `\n\n---\n\nOther Options:\n\n${otherOptions.map((course, index) => formatCourseItem(course, index + topPicks.length)).join("\n\n")}`
    : "";
  const pathwayBlock = pathwayOptions.length
    ? `\n\n---\n\nPathway Options:\n\n${pathwayOptions.map((course, index) => formatCourseItem(course, index)).join("\n\n")}`
    : "";

  return `Recommended Courses for You:

${messageBlock}${topPickBlock}${otherBlock}${pathwayBlock}

---

Tip:
${buildPersonalizedTip(userInput, fallbackUsed)}`;
}
export async function getRecommendations(userInput = {}) {
  const qualificationPlan = getQualificationPlan(userInput.qualification);
  const studyLevels = qualificationPlan.queryLevels;
  const primaryStudyLevel = studyLevels[0];
  const fieldKeywords = extractFieldKeywords(userInput.field);
  const fallbackFieldKeywords = getFieldKeywords(userInput.field, true);
  const countryIds = normalizeCountryIds(userInput);
  const originalCountryIds = getOriginalCountryIds(userInput);

  if (studyLevels.length === 0 || fieldKeywords.length === 0) {
    return {
      fallback_used: false,
      message: "Please provide qualification and field to get recommendations.",
      courses: [],
      topPicks: [],
      otherOptions: [],
      pathwayOptions: [],
    };
  }

  const [capabilities, selectedCountryNames, selectedCountryProgramCounts] = await Promise.all([
    getNeonCapabilities(),
    getNamesFromMysql("countries", originalCountryIds.length ? originalCountryIds : countryIds),
    getProgramCountsByCountry(countryIds),
  ]);
  const embedding = await generateEmbedding(buildEmbeddingQuery(userInput, primaryStudyLevel, fieldKeywords));
  const vector = `[${embedding.join(",")}]`;

  const attempts = [
    {
      includeCountryFilter: true,
      fieldKeywords,
      useFallback: false,
    },
    {
      includeCountryFilter: false,
      fieldKeywords,
      useFallback: false,
    },
    {
      includeCountryFilter: true,
      fieldKeywords: fallbackFieldKeywords,
      useFallback: true,
    },
    {
      includeCountryFilter: false,
      fieldKeywords: fallbackFieldKeywords,
      useFallback: true,
    },
  ];

  let fallbackUsed = false;
  let courses = [];

  for (const attempt of attempts) {
    const attemptStreamTokens = await resolveStudyStreamTokens(studyLevels, attempt.fieldKeywords);
    const rows = await queryCandidates({
      capabilities,
      studyLevels,
      countryIds,
      fieldKeywords: attempt.fieldKeywords,
      streamTokens: attemptStreamTokens,
      vector,
      includeCountryFilter: attempt.includeCountryFilter,
    });

    courses = await buildFinalCourses(rows, userInput, studyLevels, attempt.fieldKeywords, attempt.useFallback);
    fallbackUsed = !attempt.includeCountryFilter || attempt.useFallback;

    if (courses.length >= MIN_STRICT_RESULTS) {
      break;
    }
  }

  courses = courses
    .filter((course) => course.type === "pathway" || course.type === "direct")
    .slice(0, RESULT_LIMIT);
  const { topPicks, otherOptions, pathwayOptions } = splitRecommendationSections(courses);

  const message = courses.length === 0
    ? "Limited data available for your selected field and qualification. Please try a related field or different country."
    : fallbackUsed
    ? buildFallbackMessage(
        [...selectedCountryNames.values()],
        countryIds.some((countryId) => (selectedCountryProgramCounts.get(Number(countryId)) || 0) === 0),
        fallbackFieldKeywords
      )
    : "Showing programs that match your selected countries.";

  return {
    fallback_used: fallbackUsed,
    message,
    topPicks,
    otherOptions,
    pathwayOptions,
    courses,
    formatted: formatRecommendationText({
      message,
      topPicks,
      otherOptions,
      pathwayOptions,
      userInput,
      fallbackUsed,
    }),
  };
}
