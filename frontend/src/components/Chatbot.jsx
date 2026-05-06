import React, { useState, useEffect, useRef } from "react";
import flow from "../flow/flow";

const cleanText = (text) => {
  if (!text) return "";

  return String(text)
    .replace(/\*\*/g, "")
    .replace(/- /g, "• ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};
const streamText = (text, callback) => {
  let i = 0;

  const interval = setInterval(() => {
    i += 1; // 🔥 slower typing

    const isDone = i >= text.length;

    callback(text.slice(0, i), isDone);

    if (isDone) {
      clearInterval(interval);
    }
  }, 25); // 🔥 human-visible speed
};
export default function Chatbot() {
  const [isTyping, setIsTyping] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(null);
  const [messages, setMessages] = useState([]);
  const [context, setContext] = useState({});
  const [options, setOptions] = useState([]);

  const [allOptions, setAllOptions] = useState([]);
  const [visibleOptions, setVisibleOptions] = useState([]);
  const [page, setPage] = useState(0);

  const [selectedItems, setSelectedItems] = useState([]);
  const [optionSearch, setOptionSearch] = useState("");

  const PAGE_SIZE = 5;

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const chatRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (isOpen && step === null) {
      setStep("start");
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isOpen &&
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (!step) return;
    runStep();
  }, [step]);

  const runStep = async () => {
    const node = flow[step];
    if (!node) return;

    setOptions([]);
    setAllOptions([]);
    setVisibleOptions([]);
    setPage(0);
    setSelectedItems([]);
    setOptionSearch("");

    if (node.message) {
      const msg =
        typeof node.message === "function"
          ? node.message(context)
          : node.message;

      setMessages((prev) => [...prev, {
  bot: msg,
  time: new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  }),
}]);
    }
    // ✅ HANDLE CUSTOM RENDER STEP (NEW)
if (node.type === "custom") {
  try {
    const output = node.render(null, context);

    console.log("🎯 CUSTOM RENDER OUTPUT:", output);

    // 🔥 show typing dots first
    setIsTyping(true);

// 🔥 FORCE UI TO RENDER FIRST
await new Promise((resolve) => setTimeout(resolve, 50));

setTimeout(() => {
  setIsTyping(false);

  const tempMessage = {
    bot: "",
    time: new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };

  setMessages((prev) => [...prev, tempMessage]);

  setTimeout(() => {
    streamText(output, (partial, done) => {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1].bot = partial;
        return updated;
      });

      if (done && node.next) {
        setStep(node.next);
      }
    });
  }, 200);

}, 800); // 👈 increase dots visibility (was 500) // delay so dots are visible

  } catch (err) {
    console.error("❌ Custom render error:", err);
    setMessages((prev) => [
      ...prev,
      {
        bot: "❌ Failed to display results",
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
  }

  // move to next step automatically
  

  return;
}

// ✅ AUTO MOVE TO NEXT IF NO OPTIONS / NO TYPE
// ✅ Only auto-skip if it's a pure routing node
if (!node.options && !node.type && !node.save && node.next) {
  setTimeout(() => {
    setStep(node.next);
  }, 500);
  return;
}

if (node.options) {
  setOptions(node.options);
  setAllOptions(node.options);
  setVisibleOptions(node.options.slice(0, PAGE_SIZE));
}
    if (node.type === "dynamic") {
      setLoading(true);
      try {
        const data = await node.action(context);

        const formatted = data.map((o) => ({
          label: o.label || o.name,
          value: o.value || o.id,
          next: node.next,
        }));

        setOptions(formatted);
        setAllOptions(formatted);
        setVisibleOptions(formatted.slice(0, PAGE_SIZE));
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          { bot: "❌ Failed to load options" },
        ]);
      }
      setLoading(false);
    }

    if (node.type === "api") {
  setLoading(true);

  try {
    const data = await node.action(context);

    console.log("🔥 API RESULT:", data);

    // ✅ store API result safely in context
    setContext((prev) => ({
      ...prev,
      __apiResult: data,
    }));

    const next =
      typeof node.next === "function"
        ? node.next(data)
        : node.next;

    setStep(next);
  } catch (err) {
    console.error("❌ API ERROR:", err);
  }

  setLoading(false);
}
  }
  useEffect(() => {
    chatRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, visibleOptions]);

  const loadMore = () => {
    const nextPage = page + 1;
    const nextItems = allOptions.slice(
      0,
      (nextPage + 1) * PAGE_SIZE
    );
    setVisibleOptions(nextItems);
    setPage(nextPage);
  };

  const updateOptionSearch = (value) => {
    setOptionSearch(value);
    setPage(0);

    const query = value.trim().toLowerCase();
    const filtered = query
      ? allOptions.filter((option) => option.label.toLowerCase().includes(query))
      : allOptions;

    setVisibleOptions(filtered.slice(0, query ? 12 : PAGE_SIZE));
  };

  const currentOptionList = optionSearch.trim()
    ? allOptions.filter((option) =>
        option.label.toLowerCase().includes(optionSearch.trim().toLowerCase())
      )
    : allOptions;

  const isSearchableOptions = Boolean(flow[step]?.searchable || flow[step]?.multi);

  const handleOptionClick = (option) => {
    const node = flow[step];

    if (node.multi) {
      if (selectedItems.find((i) => i.value === option.value)) return;

      if (selectedItems.length >= (node.max || 3)) {
        setMessages((prev) => [
          ...prev,
          { bot: `⚠️ Max ${node.max || 3} selections allowed` },
        ]);
        return;
      }

      const updated = [...selectedItems, option];
      setSelectedItems(updated);

      setMessages((prev) => [
        ...prev,
        {
  user: option.label,
  time: new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  }),
},
      ]);

      return;
    }

    setMessages((prev) => [
      ...prev,
      {
  user: option.label,
  time: new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  }),
},
    ]);

    if (node.save) {
      setContext((prev) => ({
        ...prev,
        [node.save]: option.value ?? option.label,
      }));
    }

    setOptions([]);
    setOptionSearch("");
    setStep(option.next);
  };

  const matchUserInput = (input) => {
  const lower = input.toLowerCase();

  return allOptions.find(
    (opt) =>
      opt.label.toLowerCase().includes(lower) ||
      lower.includes(opt.label.toLowerCase())
  );
};
const isUserQuery = (text) => {
  const keywords = [
    "what", "which", "best", "how", "universit", "course",
    "country", "visa", "study", "college", "mba", "engineering"
  ];

  return keywords.some(k => text.toLowerCase().includes(k));
};
const handleAIFallback = async (inputText) => {
  setMessages((prev) => [
    ...prev,
    {
      user: inputText,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
  ]);

  setOptions([]);
  setAllOptions([]);
  setVisibleOptions([]);
  setPage(0);
  setSelectedItems([]);
  setOptionSearch("");

  // 🔥 START typing indicator
  setIsTyping(true);

  try {
    const API_URL =
      import.meta.env.VITE_API_URL || "http://localhost:5000/api";

    const response = await fetch(`${API_URL}/ai/counsellor`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: inputText,
        context,
      }),
    });

    const data = await response.json();

    // 🔥 LET DOTS BE VISIBLE (IMPORTANT FIX)
    await new Promise((resolve) => setTimeout(resolve, 700));

    // 🔥 STOP dots
    setIsTyping(false);

    // 🔥 ADD EMPTY BOT MESSAGE
    let tempMessage = {
      bot: "",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, tempMessage]);

    // 🔥 SMALL DELAY BEFORE STREAMING (smooth UX)
    setTimeout(() => {
      streamText(data.answer, (partial, done) => {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1].bot = partial;
          return updated;
        });

        // 🔥 RESTART FLOW AFTER STREAMING FINISHES
        if (done) {
  setTimeout(() => {
    setStep(null);     // 🔥 RESET FIRST
    setTimeout(() => {
      setStep("start"); // 🔥 THEN START FLOW
    }, 0);
  }, 800);
}
      });
    }, 200);

  } catch (err) {
    setIsTyping(false);

    setMessages((prev) => [
      ...prev,
      {
        bot: "⚠️ Something went wrong",
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
  }

  setInput(""); // ✅ keep this
};

  const handleInput = async () => {
    if (!input.trim()) return;
     const inputText = input;  
  setInput("");
     const node = step ? flow[step] : null;
    if (!node) {
  await handleAIFallback(inputText);



  return;
}
    if (allOptions.length > 0) {
      const match = matchUserInput(inputText);

  // 🔥 IMPORTANT: If it's a real question → bypass flow
  // 🔥 If input doesn't match options → ALWAYS use AI
if (!match || isUserQuery(inputText)) {
  await handleAIFallback(inputText);

  setOptions([]);
  setAllOptions([]);
  setVisibleOptions([]);
  setOptionSearch("");

  

  return;
}
      if (match) {
        if (node.multi) {
          handleOptionClick(match);
          setInput("");
          return;
        }

        setMessages((prev) => [
          ...prev,
          { user: match.label },
        ]);

        if (node.save) {
          setContext((prev) => ({
            ...prev,
            [node.save]: match.value ?? match.label,
          }));
        }

        setInput("");
        setOptions([]);
        setOptionSearch("");
        setStep(match.next);
        return;
      } 
    }

    setMessages((prev) => [...prev, { user: input }]);

    if (node.save) {
      setContext((prev) => ({
        ...prev,
        [node.save]: input,
      }));
    }

    setInput("");
    setOptions([]);

    const next =
      typeof node.next === "function"
        ? node.next(input)
        : node.next;

    setStep(next);
  };

  // ✅ FIXED: define lastBotIndex
  const lastBotIndex = [...messages]
    .map((m, i) => (m.bot ? i : -1))
    .filter((i) => i !== -1)
    .pop();

  return (
  <>
    <div
      style={styles.floatingBtn}
      onClick={(e) => {
        e.stopPropagation();
        setIsOpen(true);
      }}
    >
      💬
    </div>

    {isOpen && (
      <div ref={containerRef} style={styles.container}>
        <div style={styles.header}>
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
    <span>Global Stunel</span>

    <span
      style={{ cursor: "pointer", fontSize: 18 }}
      onClick={() => {
  setMessages([]);
  setContext({});
  setOptions([]);
  setOptionSearch("");
  setAllOptions([]);
  setVisibleOptions([]);
  setSelectedItems([]);
  setPage(0);
  setOptionSearch("");

  // 🔥 IMPORTANT: force re-init like first load
  setStep(null);

  setTimeout(() => {
    setStep("start");
  }, 0);
}}
    >
      🔄
    </span>
  </div>
</div>

        <div style={styles.chatBody}>
          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: m.user ? "flex-end" : "flex-start",
              }}
            >
              {m.bot && (
                <div style={styles.botCard}>
                  <div style={styles.botText}>{cleanText(m.bot)}</div>
                  <div style={styles.time}>{m.time}</div>

                  {i === lastBotIndex &&
                    allOptions.length > 0 && (
                      <div style={styles.options}>
                        {isSearchableOptions && allOptions.length > PAGE_SIZE && (
                          <input
                            style={styles.optionSearch}
                            value={optionSearch}
                            placeholder="Search country..."
                            onChange={(e) => updateOptionSearch(e.target.value)}
                          />
                        )}

                        {visibleOptions.map((o, idx) => (
                          <button
                            key={idx}
                            style={{
                              ...styles.optionBtn,
                              background: selectedItems.find(
                                (s) => s.value === o.value
                              )
                                ? "#FFD700"
                                : "#f9f9f9",
                            }}
                            onClick={() => handleOptionClick(o)}
                          >
                            {o.label}
                          </button>
                        ))}

                        {!optionSearch.trim() && visibleOptions.length < allOptions.length && (
                          <button
                            style={styles.moreBtn}
                            onClick={loadMore}
                          >
                            Show More
                          </button>
                        )}

                        {optionSearch.trim() && currentOptionList.length === 0 && (
                          <div style={styles.emptyOptions}>No matches found</div>
                        )}

                        {flow[step]?.multi &&
                          selectedItems.length > 0 && (
                            <button
                              style={styles.continueBtn}
                              onClick={() => {
                                const node = flow[step];

                                setContext((prev) => ({
                                  ...prev,
                                  [node.save]: selectedItems.map(
                                    (i) => i.value
                                  ),
                                }));

                                setSelectedItems([]);
                                setOptions([]);
                                setOptionSearch("");
                                setStep(node.next);
                              }}
                            >
                              Continue ({selectedItems.length})
                            </button>
                          )}
                      </div>
                    )}
                </div>
              )}

              {m.user && (
  <div style={styles.userBubble}>
    <div>{m.user}</div>
    <div style={styles.timeUser}>{m.time}</div>
  </div>
)}
            </div>
          ))}

          {isTyping && (
  <div style={{ display: "flex", justifyContent: "flex-start" }}>
    <div style={styles.botCard}>
      <div style={{ display: "flex", gap: 6 }}>
        <div style={styles.dot}></div>
        <div style={styles.dot}></div>
        <div style={styles.dot}></div>
      </div>
    </div>
  </div>
)}
          <div ref={chatRef}></div>
        </div>

        <div style={styles.inputBar}>
          <input
            style={styles.input}
            value={input}
            placeholder="Type or select option..."
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleInput();
            }}
          />
          <button style={styles.sendBtn} onClick={handleInput}>
            Send
          </button>
        </div>
      </div>
    )}
  </>
);
}

const styles = {
  floatingBtn: {
    position: "fixed",
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: "50%",
    background: "#FFD700",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 24,
    cursor: "pointer",
  },

  container: {
    position: "fixed",
    bottom: 90,
    right: 20,
    width: 460,
    height: 600,
    background: "#f4f4f4",
    borderRadius: 25, // ✅ more rounded
    display: "flex",
    flexDirection: "column",
    overflow: "hidden", // ✅ clean rounded edges
  },

  header: {
  background: "#0B1F3A", // ✅ deep navy instead of pure black
  color: "#fff",
  padding: 15,
  fontWeight: "600",
  borderTopLeftRadius: 25,
  borderTopRightRadius: 25,
},

  chatBody: {
    flex: 1,
    padding: 10,
    overflowY: "auto",
  },

  botCard: {
    background: "#fff",
    padding: 14,
    borderRadius: "12px",
    marginBottom: 10,
    maxWidth: "92%",
    lineHeight: 1.5,
  },

  botText: {
    margin: 0,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    overflowWrap: "anywhere",
    lineHeight: 1.5,
    fontSize: 14,
  },

  userBubble: {
    background: "#FFD700",
    padding: "10px 14px",
    borderRadius: "16px 16px 4px 16px", // ✅ chat style
    marginBottom: 10,
    maxWidth: "75%",
  },

  options: {
    marginTop: 10,
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  },

  optionSearch: {
    width: "100%",
    padding: "9px 10px",
    borderRadius: 10,
    border: "1px solid #ccc",
    outline: "none",
    marginBottom: 4,
  },

  emptyOptions: {
    width: "100%",
    fontSize: 13,
    color: "#666",
    padding: "4px 0",
  },

  optionBtn: {
    padding: "6px 10px",
    borderRadius: 12,
    border: "1px solid #ccc",
    cursor: "pointer",
  },

  moreBtn: {
    padding: "6px 10px",
    background: "#000",
    color: "#FFD700",
    borderRadius: 10,
    cursor: "pointer",
  },

  continueBtn: {
    padding: "8px 12px",
    background: "#28a745",
    color: "#fff",
    borderRadius: 10,
    cursor: "pointer",
  },

  inputBar: {
    display: "flex",
    padding: 10,
    borderTop: "1px solid #ddd",
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    background: "#fff",
  },

  input: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    border: "1px solid #ccc",
  },

  sendBtn: {
    marginLeft: 8,
    background: "#000",
    color: "#FFD700",
    padding: "10px 15px",
    borderRadius: 10,
    cursor: "pointer",
  },
  time: {
  fontSize: 10,
  color: "#888",
  marginTop: 4,
},

timeUser: {
  fontSize: 10,
  color: "#333",
  marginTop: 4,
  textAlign: "right",
},
typing: {
  display: "flex",
  gap: 4,
  padding: 10,
},

typingDot: {
  width: 6,
  height: 6,
  background: "#999",
  borderRadius: "50%",
},
dot: {
  width: 8,
  height: 8,
  borderRadius: "50%",
  background: "#555",
  animation: "bounce 1.2s infinite",
},
};
