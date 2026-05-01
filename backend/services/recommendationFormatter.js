import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function formatRecommendations(user, courses) {
  const prompt = `
User Profile:
- Qualification: ${user.qualification}
- Field: ${user.field}
- Budget: ${user.budget}
- Goal: ${user.goal}
- Intake: ${user.intake}

Courses:
${courses.map((c, i) => `
${i + 1}. ${c.title}
Description: ${c.description}
Country ID: ${c.country_id}
Similarity: ${c.similarity}
`).join("\n")}

---

Now write a clean, user-friendly recommendation like a study abroad advisor.

Rules:
- DO NOT return JSON
- DO NOT return arrays
- Write in clean paragraphs
- Make it personalized
- Explain WHY each course fits the student
- Replace country IDs with real country names (if possible)
- Keep it structured and readable

Format like:

🎓 Course Name  
📍 Country  
💡 Why this fits you  
⭐ Match %

Make it natural and helpful like ChatGPT.
`;

  const res = await client.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
  });

  return res.choices[0].message.content;
}