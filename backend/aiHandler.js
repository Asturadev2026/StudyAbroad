const dotenv = require("dotenv");
dotenv.config();
const OpenAI = require("openai");
export default aiHandler;

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function aiHandler(userInput, context) {
  const prompt = `
You are a Study Abroad Assistant.

User Context:
${JSON.stringify(context)}

User Query:
${userInput}

Instructions:
- Answer clearly
- Help user
- Guide them back to the flow
`;

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }]
  });

  return response.choices[0].message.content;
}

module.exports = aiHandler;