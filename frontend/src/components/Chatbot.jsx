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

const renderBotText = (text) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;

  return String(text).split(urlRegex).map((part, index) => {
    if (!part.match(urlRegex)) return part;

    return (
      <a
        key={`${part}-${index}`}
        href={part}
        target="_blank"
        rel="noreferrer"
        style={styles.botLink}
      >
        {part}
      </a>
    );
  });
};

const isRecommendationPayload = (value) =>
  value && value.type === "recommendations" && Array.isArray(value.courses);

const getCourseVisual = (courseName = "") => {
  const name = courseName.toLowerCase();

  if (name.includes("artificial intelligence") || name.includes(" ai ") || name.includes("machine learning") || name.includes("data science")) {
    return { icon: "🤖", color: "#7c3aed", bg: "#f6f0ff" };
  }

  if (name.includes("software") || name.includes("computer science") || name.includes("computer engineering") || name.includes("cyber") || name.includes("information technology") || name.includes("programming")) {
    return { icon: "💻", color: "#2563eb", bg: "#eef5ff" };
  }

  if (name.includes("civil") || name.includes("construction") || name.includes("architecture") || name.includes("built environment")) {
    return { icon: "🏗️", color: "#ea580c", bg: "#fff3e8" };
  }

  if (name.includes("mechanical") || name.includes("mechatronic") || name.includes("electrical") || name.includes("electronic") || name.includes("engineering") || name.includes("technology")) {
    return { icon: "⚙️", color: "#f5a400", bg: "#fff8e6" };
  }

  if (name.includes("business") || name.includes("management") || name.includes("mba") || name.includes("marketing") || name.includes("finance") || name.includes("accounting") || name.includes("commerce") || name.includes("entrepreneurship")) {
    return { icon: "📊", color: "#0f766e", bg: "#ecfdf5" };
  }

  if (name.includes("agriculture") || name.includes("horticulture") || name.includes("food") || name.includes("nutrition") || name.includes("environment") || name.includes("sustainability") || name.includes("renewable")) {
    return { icon: "🌱", color: "#16a34a", bg: "#f0fdf4" };
  }

  if (name.includes("health") || name.includes("medicine") || name.includes("medical") || name.includes("nursing") || name.includes("pharmacy") || name.includes("biomedical") || name.includes("dental") || name.includes("veterinary")) {
    return { icon: "⚕️", color: "#dc2626", bg: "#fff1f2" };
  }

  if (name.includes("law") || name.includes("legal") || name.includes("justice") || name.includes("criminology")) {
    return { icon: "⚖️", color: "#7c2d12", bg: "#fff7ed" };
  }

  if (name.includes("arts") || name.includes("fine art") || name.includes("design") || name.includes("music") || name.includes("film") || name.includes("media") || name.includes("fashion") || name.includes("creative")) {
    return { icon: "🎨", color: "#db2777", bg: "#fdf2f8" };
  }

  if (name.includes("education") || name.includes("teaching") || name.includes("pedagogy")) {
    return { icon: "📚", color: "#4f46e5", bg: "#eef2ff" };
  }

  if (name.includes("psychology") || name.includes("counseling") || name.includes("behaviour") || name.includes("behavior") || name.includes("social work")) {
    return { icon: "🧠", color: "#9333ea", bg: "#faf5ff" };
  }

  if (name.includes("science") || name.includes("biology") || name.includes("chemistry") || name.includes("physics") || name.includes("biochemistry") || name.includes("biotechnology")) {
    return { icon: "🔬", color: "#0891b2", bg: "#ecfeff" };
  }

  if (name.includes("hospitality") || name.includes("tourism") || name.includes("cookery") || name.includes("culinary") || name.includes("hotel")) {
    return { icon: "🍽️", color: "#d97706", bg: "#fffbeb" };
  }

  if (name.includes("sports") || name.includes("sport") || name.includes("exercise") || name.includes("fitness")) {
    return { icon: "🏅", color: "#ca8a04", bg: "#fefce8" };
  }

  if (name.includes("language") || name.includes("linguistics") || name.includes("english") || name.includes("spanish") || name.includes("french")) {
    return { icon: "🌐", color: "#0284c7", bg: "#f0f9ff" };
  }

  if (name.includes("public policy") || name.includes("political") || name.includes("international relations") || name.includes("public health")) {
    return { icon: "🏛️", color: "#475569", bg: "#f8fafc" };
  }

  return { icon: "🎓", color: "#0f766e", bg: "#eefcf7" };
};

const getDegreeLabel = (course = {}) => {
  const level = Number(course.study_level || course.study_levels);
  const title = String(course.course_name || course.title || "").toLowerCase();

  if (level === 22 || title.includes("bachelor") || title.includes("beng") || title.includes("bsc") || title.includes("ba ")) {
    return "Bachelor's Degree";
  }

  if (level === 24 || title.includes("master") || title.includes("msc") || title.includes("meng") || title.includes("mba")) {
    return "Master's Degree";
  }

  if (level === 25 || title.includes("phd") || title.includes("doctor")) {
    return "PhD";
  }

  if (level === 2 || title.includes("diploma")) {
    return "Diploma";
  }

  if (level === 26 || title.includes("certificate")) {
    return "Certificate";
  }

  return "Program";
};

const renderRecommendationCards = (payload) => (
  <div style={styles.recommendationWrap}>

    <div style={styles.recommendationHeader}>
      <div style={styles.recommendationTitle}>
        {payload.title}
      </div>

      <div style={styles.recommendationSubtitle}>
        {payload.message}
      </div>
    </div>

    <div style={styles.courseList}>

      {payload.courses.map((course, index) => {

        const courseName =
          course.course_name
          || course.title
          || "Recommended course";

        // ✅ UNIVERSITY
        const university =
          course.university_name
          || course.university
          || "University details available on request";

        // ✅ COUNTRY / LOCATION
        const country =
          course.location
          || course.country
          || "Country details available on request";

        // ✅ LINK
        const link =
          course.course_link;

        // ✅ IMAGE
        const iconLink =
          course.icon_link
          || course.icon_url;

        // ✅ VISUAL
        const visual =
          getCourseVisual(courseName);

        // ✅ DEGREE
        const degreeLabel =
          getDegreeLabel(course);

        const content = (
          <>

            {/* LEFT VISUAL */}
            <div
              style={{
                ...styles.courseVisual,
                background: visual.bg
              }}
            >

              {iconLink ? (

                <img
                  src={iconLink}
                  alt=""
                  style={styles.courseIconImage}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />

              ) : (

                <span
                  style={{
                    ...styles.courseVisualIcon,
                    color: visual.color
                  }}
                >
                  {visual.icon}
                </span>

              )}

            </div>

            {/* COURSE CONTENT */}
            <div style={styles.courseContent}>

              {/* COURSE NAME */}
              <div style={styles.courseName}>
                {courseName}
              </div>

              {/* UNIVERSITY */}
              <div style={styles.courseLocation}>
                🏫 {university}
              </div>

              {/* LOCATION */}
              <div style={styles.courseLocation}>
                📍 {country}
              </div>

              {/* STUDY LEVEL */}
              <div style={styles.degreeBadge}>
                {
                  typeof course.study_level === "string"
                    ? course.study_level
                    : degreeLabel
                }
              </div>

              {/* STREAM */}
              <div style={styles.courseReason}>
                📚 Stream: {

                  Array.isArray(course.study_stream)
                    ? course.study_stream.join(", ")

                    : Array.isArray(course.study_streams)
                    ? course.study_streams.join(", ")

                    : course.study_stream
                    || "N/A"

                }
              </div>

              {/* INTAKES */}
              <div style={styles.courseReason}>
                🗓️ Intakes: {

                  Array.isArray(course.intakes)
                    ? course.intakes.join(", ")

                    : course.intakes
                    || "N/A"

                }
              </div>

              {/* DURATION */}
              <div style={styles.courseReason}>
                ⏳ Duration: {

                  typeof course.duration === "object"
                    ? "N/A"
                    : course.duration || "N/A"

                }
              </div>

              {/* FEES */}
              <div style={styles.courseReason}>
                💰 Fees: {

                  typeof course.fees === "object"
                    ? "N/A"
                    : course.fees || "N/A"

                }
              </div>

            </div>

            {/* RIGHT SIDE BUTTONS */}
            <div style={styles.cardTools}>

              <div style={styles.bookmarkIcon}>
                □
              </div>

              <div style={styles.courseAction}>
                {">"}
              </div>

            </div>

          </>
        );

        return link ? (

          <a
            key={`${courseName}-${index}`}
            href={link}
            target="_blank"
            rel="noreferrer"
            style={styles.courseCard}
          >
            {content}
          </a>

        ) : (

          <div
            key={`${courseName}-${index}`}
            style={styles.courseCard}
          >
            {content}
          </div>

        );

      })}

    </div>

  </div>
);
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
  const [loadingOptions, setLoadingOptions] = useState(false);

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
  useEffect(() => {
  if (flow[step]?.save === "mobile") {
    setInput("+91 ");
  }
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

    if (isRecommendationPayload(output)) {
      setIsTyping(true);
      await new Promise((resolve) => setTimeout(resolve, 500));
      setIsTyping(false);

      setMessages((prev) => [...prev, {
        recommendations: output,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      }]);

      if (node.next) {
        setTimeout(() => setStep(node.next), 400);
      }

      return;
    }

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
      setLoadingOptions(true);
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
      setLoadingOptions(false);
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
              {m.recommendations && (
                <div style={styles.recommendationMessage}>
                  {renderRecommendationCards(m.recommendations)}
                  <div style={styles.time}>{m.time}</div>
                </div>
              )}

              {m.bot && (
                <div style={styles.botCard}>
                  <div style={styles.botText}>{renderBotText(cleanText(m.bot))}</div>
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

        {(!loadingOptions &&
  ((!allOptions.length && flow[step]?.save) ||
    flow[step]?.end)) && (
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

    <button
      style={styles.sendBtn}
      onClick={handleInput}
    >
      Send
    </button>
  </div>
)}

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
    boxShadow: "0 22px 70px rgba(15, 23, 42, 0.18)",
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    width: 470,
    height: 620,
    background: "#f6f8fb",
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
    padding: 14,
    overflowY: "auto",
    background: "linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)",
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

  botLink: {
    color: "#0645AD",
    textDecoration: "underline",
    wordBreak: "break-all",
  },

  recommendationMessage: {
    width: "100%",
    maxWidth: "100%",
    marginBottom: 10,
  },

  recommendationWrap: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },

  recommendationHeader: {
    background: "#fff",
    border: "1px solid #e7ebf2",
    borderRadius: 16,
    padding: "13px 15px",
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.07)",
  },

  recommendationTitle: {
    color: "#0B1F3A",
    fontSize: 14,
    fontWeight: 800,
    marginBottom: 4,
  },

  recommendationSubtitle: {
    color: "#667085",
    fontSize: 12,
    lineHeight: 1.4,
  },

  courseList: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },

  courseCard: {
    display: "grid",
    gridTemplateColumns: "88px 1fr 34px",
    alignItems: "stretch",
    gap: 14,
    background: "#fff",
    border: "1px solid #e5eaf2",
    borderRadius: 12,
    padding: 8,
    color: "inherit",
    textDecoration: "none",
    boxShadow: "0 8px 22px rgba(15, 23, 42, 0.06)",
    minHeight: 104,
  },

  courseVisual: {
    width: 88,
    minHeight: 88,
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid rgba(226, 232, 240, 0.7)",
  },

  courseVisualIcon: {
    letterSpacing: 0,
    fontSize: 31,
    fontWeight: 700,
    lineHeight: 1,
  },

  courseIconImage: {
    width: 42,
    height: 42,
    objectFit: "contain",
    display: "block",
  },

  cardTools: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "space-between",
  },

  bookmarkIcon: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    border: "1px solid #e6eaf0",
    color: "#64748b",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    background: "#fff",
  },

  courseContent: {
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },

  courseName: {
    color: "#111827",
    fontSize: 12.5,
    fontWeight: 800,
    lineHeight: 1.3,
    marginBottom: 4,
  },

  courseLocation: {
    color: "#344054",
    fontSize: 10.5,
    fontWeight: 600,
    lineHeight: 1.35,
    marginBottom: 5,
  },

  degreeBadge: {
    alignSelf: "flex-start",
    background: "#eef4ff",
    color: "#2563eb",
    borderRadius: 4,
    padding: "2px 6px",
    fontSize: 9,
    fontWeight: 800,
    marginBottom: 5,
  },

  courseReason: {
    color: "#475467",
    fontSize: 10.5,
    lineHeight: 1.35,
  },

  courseAction: {
    width: 30,
    height: 30,
    borderRadius: "50%",
    border: "1px solid #e8edf4",
    color: "#f5b400",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 17,
    lineHeight: 1,
    background: "#fffdfa",
    boxShadow: "0 4px 12px rgba(15, 23, 42, 0.06)",
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
