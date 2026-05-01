import { db } from "../db/index.js";
import { neon } from "../db/neon.js";
import { generateBatchEmbeddings } from "./embeddingService.js";

// 🔹 CONFIG
const BATCH_SIZE = 50;

// 🔹 chunk utility
function chunkArray(array, size) {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

// 🔥 FINAL JSON FIX (STRINGIFY ALWAYS)
function safeJSON(value) {
  try {
    if (!value || value === "NULL") return "[]";

    if (typeof value === "object") {
      return JSON.stringify(value);
    }

    return JSON.stringify(JSON.parse(value));

  } catch {
    const arr = String(value)
      .split(",")
      .map(v => v.trim())
      .filter(Boolean);

    return JSON.stringify(arr);
  }
}

// 🔥 VECTOR FORMAT FIX
function formatVector(vec) {
  if (!Array.isArray(vec)) return null;
  return `[${vec.join(",")}]`;
}

// 🔹 MAIN FUNCTION
export async function syncPrograms() {
  console.log("🚀 Starting sync...");

  const dbCheck = await neon.query("SELECT current_database()");
  console.log("🧠 Connected Neon DB:", dbCheck.rows);

  const [rows] = await db.execute(`
    SELECT id, title, description, country_id,
           study_levels, study_streams, intakes,
           avarage_salary, updated_at
    FROM university_programs
  `);

  console.log(`📦 Total programs: ${rows.length}`);

  const chunks = chunkArray(rows, BATCH_SIZE);

  let batchNumber = 1;

  for (const chunk of chunks) {
    console.log(`⚡ Batch ${batchNumber}/${chunks.length}`);

    try {
      // 🔹 Prepare texts
      const texts = chunk.map(p => `
        ${p.title}
        ${p.description?.slice(0, 300)}
        Level: ${p.study_levels}
        Streams: ${JSON.stringify(p.study_streams)}
      `);

      // 🔹 Embeddings
      const embeddings = await generateBatchEmbeddings(texts);

      if (batchNumber === 1) {
        console.log("🧪 Embedding sample:", embeddings[0]?.slice(0, 5));
      }

      // 🔹 Bulk insert
      const values = [];
      const placeholders = [];

      chunk.forEach((p, i) => {
        const base = i * 10;

        placeholders.push(
          `($${base+1},$${base+2},$${base+3},$${base+4},$${base+5},
            $${base+6},$${base+7},$${base+8},$${base+9},$${base+10})`
        );

        values.push(
          p.id,
          p.title,
          p.description,
          p.country_id,
          p.study_levels,
          safeJSON(p.study_streams),   // ✅ FIXED
          safeJSON(p.intakes),         // ✅ FIXED
          p.avarage_salary,
          formatVector(embeddings[i]), // ✅ FIXED
          p.updated_at
        );
      });

      await neon.query(
        `INSERT INTO university_programs
         (id, title, description, country_id, study_levels, study_streams, intakes, average_salary, embedding, updated_at)
         VALUES ${placeholders.join(",")}
         ON CONFLICT (id)
         DO UPDATE SET
           title = EXCLUDED.title,
           description = EXCLUDED.description,
           embedding = EXCLUDED.embedding,
           updated_at = EXCLUDED.updated_at`,
        values
      );

      console.log(`✅ Batch ${batchNumber} inserted ${chunk.length}`);

    } catch (err) {
      console.error(`❌ Batch ${batchNumber} failed:`, err.message);
    }

    batchNumber++;
  }

  const count = await neon.query("SELECT COUNT(*) FROM university_programs");
  console.log("📊 FINAL rows:", count.rows[0].count);

  console.log("✅ DONE");
}

// 🔹 RUN
if (process.argv[1].includes("syncPrograms.js")) {
  syncPrograms()
    .then(() => process.exit())
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}