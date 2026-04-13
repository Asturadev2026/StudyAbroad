import { useState } from "react";

export default function Message({ msg, onClick }) {
  // 🔥 NEW: local state for form inputs (instead of document.getElementById ❌)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: ""
  });

  return (
    <div className={`msg ${msg.type}`}>
      {/* 🧠 Message Text */}
      <p>{msg.question || msg.text}</p>

      {/* 🔘 Options (wrapped properly) */}
      {msg.options && (
        <div className="options-container">
          {Object.keys(msg.options).map((label) => (
            <button
              key={label}
              className="option-btn"
              onClick={() => onClick(label)}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* 📝 Form */}
      {msg.type === "form" || msg.form ? (
        <div className="form">
          <input
            placeholder="Full Name"
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
          />

          <input
            placeholder="Email Address"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
          />

          <input
            placeholder="Phone Number"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
          />

          <button
            onClick={() => {
              // 🔥 validation
              if (!formData.name || !formData.email || !formData.phone) {
                alert("Please fill all fields");
                return;
              }

              onClick(JSON.stringify(formData));

              // 🔥 clear form after submit
              setFormData({
                name: "",
                email: "",
                phone: ""
              });
            }}
          >
            Submit
          </button>
        </div>
      ) : null}
    </div>
  );
}