const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const ChatEngine = require("./chatEngine");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const sessions = {}; // simple session store

// ✅ SINGLE CLEAN ROUTE
app.post("/chat", async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!sessions[sessionId]) {
      sessions[sessionId] = new ChatEngine();
    }

    const engine = sessions[sessionId];

    // 🔥 HANDLE START (FORCE FLOW FIRST)
    if (message === "start") {
      const node = engine.getNode();

      return res.json({
        type: "selection", // ✅ IMPORTANT
        question: node.question,
        options: node.options || {}
      });
    }

    // 🔥 NORMAL FLOW / AI HANDLING
    const response = await engine.process(message);

    // ✅ Ensure consistent structure
    if (response.question || response.options) {
      return res.json({
        type: response.type || "selection",
        question: response.question,
        options: response.options || {},
        message: response.message
      });
    }

    return res.json(response);

  } catch (error) {
    console.error("Server Error:", error);

    res.status(500).json({
      type: "error",
      message: "Something went wrong. Please try again."
    });
  }
});

// Health check
app.get("/", (req, res) => {
  res.send("Chatbot running 🚀");
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});