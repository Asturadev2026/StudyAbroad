import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COURSES_FILE_PATH = path.resolve(
  __dirname,
  "../../courses.json"
);

const GENERIC_PROGRAM_URL =
  "https://global.stunel.com/program/";

let courseCache = null;

// ---------------------------------------------------
// NORMALIZE TEXT
// ---------------------------------------------------
function normalize(text = "") {

  return String(text)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\([^)]*\)/g, "")
    .replace(/honours|honors/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ---------------------------------------------------
// SLUGIFY
// ---------------------------------------------------
function slugify(text = "") {

  return String(text)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");
}

// ---------------------------------------------------
// GENERIC LINK
// ---------------------------------------------------
function buildGenericLink(title = "") {

  return (
    GENERIC_PROGRAM_URL +
    slugify(title)
  );
}

// ---------------------------------------------------
// LOAD COURSES.JSON
// ---------------------------------------------------
async function loadCourses() {

  if (courseCache) {
    return courseCache;
  }

  try {

    const file =
      await fs.readFile(
        COURSES_FILE_PATH,
        "utf8"
      );

    const courses =
      JSON.parse(file);

    courseCache = courses;

    console.log(
      `✅ Loaded ${courses.length} courses`
    );

    return courses;

  } catch (err) {

    console.error(
      "❌ Failed loading courses.json:",
      err.message
    );

    return [];
  }
}

// ---------------------------------------------------
// FIND BEST MATCH
// ---------------------------------------------------
function findBestCourseMatch(
  courses,
  title = ""
) {

  const normalizedInput =
    normalize(title);

  const inputWords =
    normalizedInput
      .split(" ")
      .filter(word => word.length > 2);

  let bestMatch = null;
  let bestScore = 0;

  for (const course of courses) {

    const dbTitle =
      normalize(
        course.program_name
      );

    const dbWords =
      dbTitle
        .split(" ")
        .filter(word => word.length > 2);

    let score = 0;

    // -----------------------------------
    // WORD OVERLAP SCORE
    // -----------------------------------
    for (const word of inputWords) {

      if (
        dbWords.includes(word)
      ) {
        score++;
      }
    }

    // -----------------------------------
    // BONUS SCORE
    // -----------------------------------
    if (
      dbTitle.includes(normalizedInput)
      || normalizedInput.includes(dbTitle)
    ) {
      score += 5;
    }

    // -----------------------------------
    // BEST MATCH
    // -----------------------------------
    if (score > bestScore) {

      bestScore = score;
      bestMatch = course;
    }
  }

  // -----------------------------------
  // MATCH FOUND
  // -----------------------------------
  if (bestScore >= 3) {

    console.log("\n✅ MATCH FOUND");
    console.log("INPUT:", title);
    console.log("MATCH:", bestMatch.program_name);
    console.log("SCORE:", bestScore);

    return bestMatch;
  }

  // -----------------------------------
  // NO MATCH
  // -----------------------------------
  console.log("\n❌ NO MATCH");
  console.log("INPUT:", title);

  return null;
}

// ---------------------------------------------------
// GET COURSE DETAILS
// ---------------------------------------------------
export async function getCourseLinkDetails(
  title = ""
) {

  const courses =
    await loadCourses();

  const matchedCourse =
    findBestCourseMatch(
      courses,
      title
    );

  // -----------------------------------------
  // NO MATCH
  // -----------------------------------------
  if (!matchedCourse) {

    return {

      program_name:
        title,

      url:
        buildGenericLink(title),

      university:
        "University details available on request",

      iconUrl: "",

      location:
        "Australia",

      study_level:
        "Program",

      study_stream:
        "General",

      intakes:
        "N/A",

      duration:
        "N/A",

      fees:
        "N/A"
    };
  }

  // -----------------------------------------
  // MATCH FOUND
  // -----------------------------------------
  return {

    program_name:
      matchedCourse.program_name,

    url:
      matchedCourse.program_link
      || buildGenericLink(title),

    university:
      matchedCourse.university_name
      || "University details available on request",

    iconUrl:
      matchedCourse.university_logo
      || "",

    location:
      matchedCourse.location
      || "Australia",

    study_level:
      matchedCourse.study_level
      || "Program",

    study_stream:
      matchedCourse.study_stream
      || "General",

    intakes:
      matchedCourse.intakes
      || "N/A",

    duration:
      matchedCourse.duration
      || "N/A",

    fees:
      matchedCourse.fees
      || "N/A"
  };
}

// ---------------------------------------------------
// GET ONLY LINK
// ---------------------------------------------------
export async function getCourseLink(
  title = ""
) {

  const details =
    await getCourseLinkDetails(
      title
    );

  return details.url;
}

// ---------------------------------------------------
// ATTACH DETAILS TO AI COURSES
// ---------------------------------------------------
export async function attachCourseLinks(
  courses = []
) {

  return Promise.all(

    courses.map(async (course) => {

      const courseTitle =
        course.course_name
        || course.title
        || "";

      const details =
        await getCourseLinkDetails(
          courseTitle
        );

      console.log("\n-----------------------------------");
      console.log("VECTOR TITLE:", courseTitle);
      console.log("MATCHED JSON:", details);
      console.log("-----------------------------------\n");

      return {

        // -----------------------------------
        // COURSE NAME
        // -----------------------------------
        course_name:
          details.program_name,

        title:
          details.program_name,

        // -----------------------------------
        // UNIVERSITY
        // -----------------------------------
        university:
          details.university,

        university_name:
          details.university,

        // -----------------------------------
        // LOCATION
        // -----------------------------------
        location:
          details.location,

        country:
          details.location,

        // -----------------------------------
        // COURSE DETAILS
        // -----------------------------------
        study_level:
          details.study_level,

        study_stream:
          details.study_stream,

        intakes:
          details.intakes,

        duration:
          details.duration,

        fees:
          details.fees,

        // -----------------------------------
        // LINKS
        // -----------------------------------
        course_link:
          details.url,

        icon_link:
          details.iconUrl,

        // -----------------------------------
        // VECTOR DATA
        // -----------------------------------
        match_score:
          course.match_score,

        reason:
          course.reason,

        category:
          course.category,

        type:
          course.type || "direct",
      };
    })
  );
}