import { neon } from "../db/neon.js";
import { generateEmbedding } from "./embeddingService.js";
import { buildUserQuery } from "./buildQuery.js";

export async function getRecommendations(userData) {
  // 🔹 Step 1: build query
  const queryText = buildUserQuery(userData);

  // 🔹 Step 2: generate embedding
  const embedding = await generateEmbedding(queryText);

  // 🔹 Step 3: convert to vector
  const vector = `[${embedding.join(",")}]`;

  // 🔹 Step 4: query DB
  const result = await neon.query(
    `
    SELECT id, title, description, country_id,
           1 - (embedding <=> $1::vector) AS similarity
    FROM university_programs
    WHERE country_id = ANY($2)
    ORDER BY embedding <=> $1::vector
    LIMIT 5
    `,
    [vector, userData.countryIds]
  );

  return result.rows;
}