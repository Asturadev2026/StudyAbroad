import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const COURSES_FILE_PATH = path.resolve(__dirname, "../../courses.txt");
const GENERIC_PROGRAM_URL = "https://global.stunel.com/program/";
const STUDY_LEVEL_URL_LABELS = {
  2: "diploma",
  22: "bachelors",
  24: "masters",
  25: "phd",
  26: "certificate",
};

let courseLinkCache = null;

function setUniqueLink(map, duplicateKeys, key, url) {
  if (!key || duplicateKeys.has(key)) return;

  if (map.has(key) && map.get(key) !== url) {
    map.delete(key);
    duplicateKeys.add(key);
    return;
  }

  map.set(key, url);
}

function addCandidate(map, key, candidate) {
  if (!key) return;

  const existing = map.get(key) || [];
  existing.push(candidate);
  map.set(key, existing);
}

function normalizeCourseTitle(title = "") {
  return String(title)
    .toLowerCase()
    .replace(/\([^)]*\)/g, "")
    .replace(/\b(honours|honors|degree|program|programme)\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeCourseKeyTitle(title = "") {
  return String(title)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeUniversityName(university = "") {
  return String(university)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildCourseUniversityKey(title = "", university = "") {
  const normalizedTitle = normalizeCourseKeyTitle(title);
  const normalizedUniversity = normalizeUniversityName(university);

  if (!normalizedTitle || !normalizedUniversity) return "";

  return `${normalizedTitle}|${normalizedUniversity}`;
}

function normalizeLevel(value = "") {
  return String(value).toLowerCase().trim();
}

function getLevelFromUrl(url = "") {
  try {
    return normalizeLevel(new URL(url).searchParams.get("level"));
  } catch {
    return "";
  }
}

function getStudyLevelLabel(studyLevel) {
  return STUDY_LEVEL_URL_LABELS[Number(studyLevel)] || normalizeLevel(studyLevel);
}

function buildCourseUniversityLevelKey(title = "", university = "", level = "") {
  const courseUniversityKey = buildCourseUniversityKey(title, university);
  const normalizedLevel = normalizeLevel(level);

  if (!courseUniversityKey || !normalizedLevel) return "";

  return `${courseUniversityKey}|${normalizedLevel}`;
}

function slugifyCourseTitle(title = "") {
  return String(title)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function buildCourseSpecificLink(title = "", baseUrl = GENERIC_PROGRAM_URL) {
  const slug = slugifyCourseTitle(title);
  if (!slug) return baseUrl;

  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return `${normalizedBase}${slug}`;
}

function parseCourseLinkLine(line = "") {
  const [title, university, url, iconUrl] = line.split("|").map((part) => part?.trim());

  if (!title || !url || !/^https?:\/\//i.test(url)) {
    return null;
  }

  return {
    title,
    university,
    url,
    iconUrl: /^https?:\/\//i.test(iconUrl || "") ? iconUrl : "",
  };
}

async function loadCourseLinks() {
  if (courseLinkCache) {
    return courseLinkCache;
  }

  const byExactTitle = new Map();
  const byNormalizedTitle = new Map();
  const byCourseAndUniversity = new Map();
  const byCourseUniversityAndLevel = new Map();
  const byUrl = new Map();
  const byIconUrl = new Map();
  const byUniversityIcon = new Map();
  const exactTitleCandidates = new Map();
  const normalizedTitleCandidates = new Map();
  const duplicateExactTitles = new Set();
  const duplicateNormalizedTitles = new Set();
  const duplicateCourseUniversities = new Set();
  const duplicateCourseUniversityLevels = new Set();

  try {
    const file = await fs.readFile(COURSES_FILE_PATH, "utf8");

    for (const line of file.split(/\r?\n/)) {
      const parsed = parseCourseLinkLine(line);
      if (!parsed) continue;
      const candidate = {
        ...parsed,
        level: getLevelFromUrl(parsed.url),
      };
      const exactTitleKey = parsed.title.toLowerCase();
      const normalizedTitleKey = normalizeCourseTitle(parsed.title);

      setUniqueLink(
        byExactTitle,
        duplicateExactTitles,
        exactTitleKey,
        parsed.url
      );
      setUniqueLink(
        byNormalizedTitle,
        duplicateNormalizedTitles,
        normalizedTitleKey,
        parsed.url
      );
      setUniqueLink(
        byCourseAndUniversity,
        duplicateCourseUniversities,
        buildCourseUniversityKey(parsed.title, parsed.university),
        parsed.url
      );
      setUniqueLink(
        byCourseUniversityAndLevel,
        duplicateCourseUniversityLevels,
        buildCourseUniversityLevelKey(parsed.title, parsed.university, getLevelFromUrl(parsed.url)),
        parsed.url
      );

      if (parsed.university) {
        byUrl.set(parsed.url, parsed.university);
      }

      if (parsed.iconUrl) {
        byIconUrl.set(parsed.url, parsed.iconUrl);
        byUniversityIcon.set(normalizeUniversityName(parsed.university), parsed.iconUrl);
      }

      addCandidate(exactTitleCandidates, exactTitleKey, candidate);
      addCandidate(normalizedTitleCandidates, normalizedTitleKey, candidate);
    }
  } catch (err) {
    console.warn("Course link file not available:", err.message);
  }

  courseLinkCache = {
    byExactTitle,
    byNormalizedTitle,
    byCourseAndUniversity,
    byCourseUniversityAndLevel,
    byUrl,
    byIconUrl,
    byUniversityIcon,
    exactTitleCandidates,
    normalizedTitleCandidates,
  };
  return courseLinkCache;
}

function chooseCandidate(candidates = [], studyLevel = "") {
  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0];

  const level = getStudyLevelLabel(studyLevel);
  const levelMatches = level
    ? candidates.filter((candidate) => candidate.level === level)
    : [];

  if (levelMatches.length === 1) return levelMatches[0];
  if (levelMatches.length > 1) return levelMatches[0];

  return null;
}

export async function getCourseLinkDetails(title = "", university = "", studyLevel = "") {
  const links = await loadCourseLinks();
  const exactKey = String(title).toLowerCase().trim();
  const normalizedKey = normalizeCourseTitle(title);
  const courseUniversityLevelKey = buildCourseUniversityLevelKey(
    title,
    university,
    getStudyLevelLabel(studyLevel)
  );
  const courseUniversityKey = buildCourseUniversityKey(title, university);
  const storedUrl = links.byCourseUniversityAndLevel.get(courseUniversityLevelKey)
    || links.byCourseAndUniversity.get(courseUniversityKey)
    || links.byExactTitle.get(exactKey)
    || links.byNormalizedTitle.get(normalizedKey)
    || GENERIC_PROGRAM_URL;
  const fallbackCandidate = storedUrl === GENERIC_PROGRAM_URL
    ? chooseCandidate(links.exactTitleCandidates.get(exactKey), studyLevel)
      || chooseCandidate(links.normalizedTitleCandidates.get(normalizedKey), studyLevel)
    : null;

  if (fallbackCandidate) {
    return {
      url: fallbackCandidate.url,
      university: university || fallbackCandidate.university || "",
      iconUrl: fallbackCandidate.iconUrl
        || links.byUniversityIcon.get(normalizeUniversityName(fallbackCandidate.university))
        || "",
    };
  }

  if (storedUrl.replace(/\/+$/, "") === GENERIC_PROGRAM_URL.replace(/\/+$/, "")) {
    return {
      url: buildCourseSpecificLink(title, storedUrl),
      university,
      iconUrl: "",
    };
  }

  return {
    url: storedUrl,
    university: university || links.byUrl.get(storedUrl) || "",
    iconUrl: links.byIconUrl.get(storedUrl)
      || links.byUniversityIcon.get(normalizeUniversityName(university || links.byUrl.get(storedUrl)))
      || "",
  };
}

export async function getCourseLink(title = "", university = "", studyLevel = "") {
  const details = await getCourseLinkDetails(title, university, studyLevel);
  return details.url;
}

export async function attachCourseLinks(courses = []) {
  return Promise.all(
    courses.map(async (course) => {
      const details = await getCourseLinkDetails(
        course.course_name || course.title,
        course.university || course.university_name,
        course.study_level || course.study_levels
      );

      return {
        ...course,
        university: course.university || course.university_name || details.university,
        university_name: course.university_name || course.university || details.university,
        course_link: details.url,
        icon_link: course.icon_link || course.icon_url || details.iconUrl,
      };
    })
  );
}
