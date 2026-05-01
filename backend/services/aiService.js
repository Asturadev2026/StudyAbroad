import OpenAI from "openai";
import { searchSimilarDocs } from "./embeddingService.js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY ,
});


// ========================================
// 🎯 1. COURSE RECOMMENDATION (FLOW BASED)
// ========================================
export const getRecommendations = async (context) => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
You are a study abroad expert.

Based on the student profile, recommend:
- Best countries
- Best universities
- Suitable courses

Keep response structured and clear.
          `,
        },
        {
          role: "user",
          content: `
Student profile:
${JSON.stringify(context)}

Give top recommendations.
          `,
        },
      ],
    });

    const text = response.choices[0].message.content;

    return {
      formatted: text,
      courses: [],
    };

  } catch (err) {
    console.error("❌ Recommendation Error:", err);

    return {
      formatted: "⚠️ Unable to fetch recommendations right now.",
      courses: [],
    };
  }
};


import { db } from "../db/index.js";



// ========================================
// 🤖 AI COUNSELLOR (SMART + CONTROLLED)
// ========================================
export const handleCounsellorQuery = async (query, context) => {
  try {
    const lower = query.toLowerCase();

    // ========================================
    // 🧠 STEP 1: QUICK GREETING EXIT (IMPORTANT)
    // ========================================
    if (["hi", "hello", "hey"].includes(lower.trim())) {
      return "Hi! 👋 Are you planning to study abroad? I can guide you with courses, countries, and visa options.";
    }

    // ========================================
    // 🧠 STEP 2: DECIDE IF DB IS NEEDED
    // ========================================
    let needsDB = false;

    try {
      const decision = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `
Decide if this query needs database lookup.

Rules:
- If user asks about universities, courses, countries → YES
- If greeting, general talk → NO

Respond ONLY with: YES or NO
            `,
          },
          {
            role: "user",
            content: query,
          },
        ],
      });

      const decisionText = decision.choices[0].message.content.trim();

      if (decisionText === "YES") {
        needsDB = true;
      }

      console.log("🧠 NEED DB:", needsDB);

    } catch (err) {
      console.log("⚠️ Decision failed");
    }

    // ========================================
    // 🔍 STEP 3: RAG (ONLY IF NEEDED)
    // ========================================
    let docs = [];

    if (needsDB) {
      try {
        docs = await searchSimilarDocs(query);
        console.log("🔍 RAG:", docs);
      } catch (err) {
        console.log("⚠️ RAG failed");
      }
    }

    // ========================================
    // 🗄️ STEP 4: SQL (ONLY IF NEEDED)
    // ========================================
    let dbData = [];

    if (needsDB) {
      try {
        const sqlGen = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `
You are an expert MySQL query generator.

Database schema:
- universities(id, name, country_id, description)
- university_programs(id, university_id, title, description)
- countries(id, name)

Rules:
- Only SELECT queries
- LIMIT 5
- Use JOIN where needed
- Use LIKE '%keyword%'
- Return ONLY SQL
              `,
            },
            {
              role: "user",
              content: query,
            },
          ],
        });

        const sqlQuery = sqlGen.choices[0].message.content.trim();

        console.log("🧠 SQL:", sqlQuery);

        // 🔒 SAFETY CHECK
        if (sqlQuery.toLowerCase().startsWith("select")) {
          const [rows] = await db.query(sqlQuery);
          dbData = rows;
        }

        console.log("🗄️ DB DATA:", dbData);

      } catch (err) {
        console.log("⚠️ SQL failed:", err.message);
      }
    }

    // ========================================
    // 🤖 STEP 5: FINAL RESPONSE (LLM)
    // ========================================
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
You are a professional study abroad counsellor.

RULES:
- Answer clearly and confidently
- NEVER ask to rephrase
- If DB data exists → use it
- Otherwise answer normally like a counsellor

Database:
${JSON.stringify(dbData)}

RAG:
${docs.join("\n")}

If universities are asked:
- Show list
- Mention country
- Add short helpful info

Keep answers clean and structured.
          `,
        },
        {
          role: "user",
          content: query,
        },
      ],
    });

    let answer = response.choices[0].message.content;

    // ========================================
    // 🛡️ STEP 6: FALLBACK
    // ========================================
    if (
      !answer ||
      answer.toLowerCase().includes("rephrase") ||
      answer.length < 10
    ) {
      return `Sure! I can help 😊

Popular study options:
- Engineering / IT
- Business / MBA
- Agriculture
- Arts / Humanities

Which one are you interested in?`;
    }

    return answer;

  } catch (err) {
    console.error("❌ Counsellor Error:", err);

    return "I can help you with courses, countries, and visas. What would you like to explore?";
  }
};