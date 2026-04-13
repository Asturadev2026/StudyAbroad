import ChatEngine from "../backend/chatEngine.js";

const sessions = {};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { message, sessionId } = req.body;

    if (!sessions[sessionId]) {
      sessions[sessionId] = new ChatEngine();
    }

    const engine = sessions[sessionId];

    // 🔥 FORCE FLOW FIRST
    if (message === "start") {
      const node = engine.getNode();

      return res.status(200).json({
        type: "selection",
        question: node.question,
        options: node.options || {}
      });
    }

    const response = await engine.process(message);

    return res.status(200).json(response);

  } catch (err) {
    console.error("API ERROR:", err);
    return res.status(500).json({
      type: "error",
      message: "Something went wrong"
    });
  }
}