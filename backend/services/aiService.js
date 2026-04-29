import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY
});

export const getRecommendations = async (context) => {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: `Suggest best universities for: ${JSON.stringify(context)}`
      }
    ]
  });

  return response.choices[0].message.content;
};
