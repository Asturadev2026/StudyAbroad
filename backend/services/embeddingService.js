import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ⏱️ timeout helper
function timeoutPromise(ms) {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error("⏱️ Embedding timeout")), ms)
  );
}

const MODEL = "text-embedding-3-small";

// ========================================
// 🔹 SINGLE EMBEDDING (USED IN RECOMMENDER)
// ========================================
export async function generateEmbedding(text) {
  try {
    const response = await Promise.race([
      client.embeddings.create({
        model: MODEL,
        input: text,
      }),
      timeoutPromise(10000),
    ]);

    return response.data[0].embedding;
  } catch (err) {
    console.error("❌ Single embedding failed:", err.message);
    throw err;
  }
}

// ========================================
// 🔹 BATCH EMBEDDINGS (USED IN SYNC SCRIPT)
// ========================================
export async function generateBatchEmbeddings(texts) {
  try {
    const response = await Promise.race([
      client.embeddings.create({
        model: MODEL,
        input: texts,
      }),
      timeoutPromise(20000),
    ]);

    return response.data.map((item) => item.embedding);
  } catch (err) {
    console.error("❌ Batch embedding failed:", err.message);
    throw err;
  }
}
export async function searchSimilarDocs(query) {
  try {
    // 1. Convert query to embedding
    const embedding = await generateEmbedding(query);

    // 2. TODO: Replace with real DB (Pinecone / Supabase / etc)
    console.log("🔍 Searching vector DB...");

    // TEMP MOCK DATA
    return [
      "Top universities in UK include Oxford, Cambridge",
      "Canada is good for PR pathways",
    ];

  } catch (err) {
    console.error("❌ Vector search error:", err.message);
    return [];
  }
}