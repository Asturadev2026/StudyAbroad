const tree = require("./decisionTree");
const aiHandler = require("./aiHandler");
const detectIntent = require("./intentDetector");
const { sendLeadToCRM } = require("./crmService");
export default ChatEngine;

class ChatEngine {
  constructor() {
    this.currentStep = "start"; // ✅ MUST start here
    this.context = {};
    this.awaitingPreSubmit = false;
  }

  getNode() {
    const node = tree[this.currentStep];

    return {
      type: "selection", // ✅ FORCE TYPE
      question: node.question,
      options: node.options || {}
    };
  }

  async process(userInput) {
    const node = tree[this.currentStep];

    // 🔥 Intent Detection (optional jump)
    const intent = detectIntent(userInput);
    if (intent && tree[intent]) {
      this.currentStep = intent;

      const nextNode = tree[this.currentStep];

      return {
        type: "selection",
        question: nextNode.question,
        options: nextNode.options || {}
      };
    }

    // 🔁 Pre-submit handling
    if (this.awaitingPreSubmit) {
      this.awaitingPreSubmit = false;

      if (userInput.toLowerCase() === "yes") {
        const aiResponse = await aiHandler(userInput, this.context);
        return { type: "ai", message: aiResponse };
      } else {
        return this.completeStep();
      }
    }

    // 🟢 SELECTION STEP (FLOW-FIRST LOGIC)
    if (node.options) {
      const matchedKey = Object.keys(node.options).find(
        (opt) => opt.toLowerCase() === userInput.toLowerCase()
      );

      // ✅ USER SELECTED → MOVE FLOW
      if (matchedKey) {
        this.currentStep = node.options[matchedKey];

        const nextNode = tree[this.currentStep];

        return {
          type: "selection",
          question: nextNode.question,
          options: nextNode.options || {}
        };
      }

      // ❌ USER TYPED RANDOM → AI BUT KEEP FLOW
      const aiResponse = await aiHandler(userInput, this.context);

      return {
        type: "ai",
        message: aiResponse,
        question: node.question,   // 👈 KEEP SAME QUESTION
        options: node.options
      };
    }

    // 🟡 FORM STEP
    if (!node.options) {
      this.context[this.currentStep] = userInput;

      if (node.preSubmit) {
        this.awaitingPreSubmit = true;
        return {
          type: "preSubmit",
          question: "Do you have any questions? (Yes/No)"
        };
      }

      return this.completeStep();
    }

    return { error: "Unknown step" };
  }

  async completeStep() {
    const node = tree[this.currentStep];

    // 📞 Counsellor Trigger
    if (node.counsellorTrigger) {
      await sendLeadToCRM(this.context);
    }

    return {
      type: "complete",
      message: "Thank you! Our counsellor will contact you shortly."
    };
  }
}

module.exports = ChatEngine;