import React, { useState, useEffect, useRef } from "react";
import flow from "../flow/flow";

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(null);
  const [messages, setMessages] = useState([]);
  const [context, setContext] = useState({});
  const [options, setOptions] = useState([]);

  const [allOptions, setAllOptions] = useState([]);
  const [visibleOptions, setVisibleOptions] = useState([]);
  const [page, setPage] = useState(0);

  const [selectedItems, setSelectedItems] = useState([]);

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

    if (node.message) {
      const msg =
        typeof node.message === "function"
          ? node.message(context)
          : node.message;

      setMessages((prev) => [...prev, { bot: msg }]);
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
        const next =
          typeof node.next === "function"
            ? node.next(data)
            : node.next;
        setStep(next);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
  };

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
        { user: option.label },
      ]);

      return;
    }

    setMessages((prev) => [
      ...prev,
      { user: option.label },
    ]);

    if (node.save) {
      setContext((prev) => ({
        ...prev,
        [node.save]: option.value || option.label,
      }));
    }

    setOptions([]);
    setStep(option.next);
  };

  const matchUserInput = (input) => {
    const lower = input.toLowerCase();
    return allOptions.find((opt) =>
      opt.label.toLowerCase().includes(lower)
    );
  };

  const handleInput = () => {
    if (!input.trim()) return;

    const node = flow[step];

    if (allOptions.length > 0) {
      const match = matchUserInput(input);

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
            [node.save]: match.value || match.label,
          }));
        }

        setInput("");
        setOptions([]);
        setStep(match.next);
        return;
      } else {
        setMessages((prev) => [
          ...prev,
          { user: input },
          { bot: "❌ Please select a valid option" },
        ]);
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
            🎓 Study Abroad Assistant
          </div>

          <div style={styles.chatBody}>
            {messages.map((m, i) => (
              <div key={i}>
                {m.bot && (
                  <div style={styles.botCard}>
                    <p>{m.bot}</p>

                    {i === lastBotIndex &&
                      visibleOptions.length > 0 && (
                        <div style={styles.options}>
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

                          {visibleOptions.length < allOptions.length && (
                            <button
                              style={styles.moreBtn}
                              onClick={loadMore}
                            >
                              Show More
                            </button>
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
                  <div style={styles.userBubble}>{m.user}</div>
                )}
              </div>
            ))}

            {loading && <p style={{ padding: 10 }}>Loading...</p>}
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
    width: 350,
    height: 550,
    background: "#f4f4f4",
    borderRadius: 20,
    display: "flex",
    flexDirection: "column",
  },
  header: {
    background: "#000",
    color: "#fff",
    padding: 15,
  },
  chatBody: {
    flex: 1,
    padding: 10,
    overflowY: "auto",
  },
  botCard: {
    background: "#fff",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    maxWidth: "80%",
  },
  userBubble: {
    background: "#FFD700",
    padding: "10px 14px",
    borderRadius: 12,
    marginBottom: 10,
    marginLeft: "auto",
    maxWidth: "fit-content",
    display: "inline-block",
  },
  options: {
    marginTop: 10,
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  },
  optionBtn: {
    padding: "6px 10px",
    borderRadius: 10,
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
  },
  input: {
    flex: 1,
    padding: 10,
  },
  sendBtn: {
    marginLeft: 8,
    background: "#000",
    color: "#FFD700",
    padding: "10px 15px",
  },
};