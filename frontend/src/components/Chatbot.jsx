import { useState, useEffect, useRef } from "react";
import Message from "./Message";
import axios from "axios";
import flow from "../data/flow"; // 🔥 IMPORT FLOW
import "./Chatbot.css";

console.log("Chatbot loaded");

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [sessionId] = useState("user_" + Date.now());
  const [input, setInput] = useState("");

  // 🔥 FLOW STATE
  const [currentStep, setCurrentStep] = useState("start");

  const bottomRef = useRef();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ================================
  // 🔥 FLOW HANDLER
  // ================================
  const handleFlow = (userInput) => {
  const step = flow[currentStep];

  if (!step) return null;

  // 🔥 FIX: iterate object instead of find()
  const matchedKey = Object.keys(step.options || {}).find((key) =>
    key.toLowerCase().includes(userInput.toLowerCase())
  );

  if (matchedKey) {
    const nextStepKey = step.options[matchedKey];
    const nextStep = flow[nextStepKey];

    if (!nextStep) return null;

    setCurrentStep(nextStepKey);

    // 🔥 Handle normal question
    if (nextStep.question) {
      return {
        question: nextStep.question,
        options: nextStep.options,
        form: nextStep.form,
        type: "bot"
      };
    }

    // 🔥 Handle message-only step
    if (nextStep.message) {
      return {
        text: nextStep.message,
        type: "bot"
      };
    }
  }

  return null; // fallback to AI
};

  // ================================
  // 🔥 SEND MESSAGE (FLOW + AI)
  // ================================
  const sendMessage = async (text) => {
    if (!text) return;

    // Add user message
    setMessages((prev) => [...prev, { text, type: "user" }]);

    // 🔥 STEP 1: TRY FLOW
    const flowResponse = handleFlow(text);

    if (flowResponse) {
      setMessages((prev) => [...prev, flowResponse]);
      return;
    }

    // 🔥 STEP 2: FALLBACK TO AI (BACKEND)
    try {
      const res = await axios.post("/api/chat", {
        sessionId,
        message: text
      });

      const data = res.data;

      if (data.type === "ai") {
        setMessages((prev) => [
          ...prev,
          { text: data.message, type: "bot" }
        ]);
      } else if (data.type === "preSubmit") {
        setMessages((prev) => [
          ...prev,
          { question: data.question, type: "bot" }
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { ...data, type: "bot" }
        ]);
      }
    } catch (err) {
      console.error("API Error:", err);
      setMessages((prev) => [
        ...prev,
        { text: "Something went wrong. Please try again.", type: "bot" }
      ]);
    }
  };

  // ================================
  // 🔥 START CHAT (FLOW BASED)
  // ================================
  const startChat = () => {
    console.log("START CHAT TRIGGERED");

    const firstStep = flow["start"];

    if (!firstStep) {
      console.error("Flow start step missing");
      return;
    }

    setCurrentStep("start");

    setMessages([
      {
        question: firstStep.question,
        options: firstStep.options,
        type: "bot"
      }
    ]);
  };

  return (
    <>
      {/* Chat Icon */}
      <div
        className="chat-icon"
        onClick={() => {
          console.log("CHAT ICON CLICKED");
          startChat();
          setIsOpen(true);
        }}
      >
        💬
      </div>

      {/* Chat Window */}
      <div className={`chat-container ${isOpen ? "open" : ""}`}>
        <div className="chat-header">
          🎓 Study Abroad Assistant
        </div>

        <div className="chat-body">
          {messages.map((msg, i) => (
            <Message key={i} msg={msg} onClick={sendMessage} />
          ))}
          <div ref={bottomRef}></div>
        </div>

        {/* INPUT */}
        <div className="chat-input">
          <input
            type="text"
            placeholder="Ask anything..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                sendMessage(input);
                setInput("");
              }
            }}
          />

          <button
            onClick={() => {
              sendMessage(input);
              setInput("");
            }}
          >
            Send
          </button>
        </div>
      </div>
    </>
  );
}