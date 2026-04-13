export default tree;
const tree = {
  start: {
    question: "Where are you currently located?",
    type: "selection",
    options: {
      "Off-Shore (India)": "offshore",
      "On-Shore (Abroad)": "onshore"
    },
    fallback: "ai_handler"
  },

  offshore: {
    question: "What are you looking for?",
    type: "selection",
    options: {
      "Coaching": "coaching_q1",
      "Visa Services": "visa_type",
      "Ancillary Services": "ancillary"
    },
    fallback: "ai_handler"
  },

  coaching_q1: {
    question: "What is your qualification?",
    type: "selection",
    options: {
      "10th": "exam",
      "12th": "exam",
      "Graduate": "exam",
      "Postgraduate": "exam"
    },
    fallback: "ai_handler"
  },

  exam: {
    question: "Do you know the exam?",
    type: "selection",
    options: {
      "Yes": "batch_type",
      "No": "batch_type"
    },
    fallback: "ai_handler"
  },

  batch_type: {
    question: "Select batch type",
    type: "selection",
    options: {
      "Online": "batch_time",
      "Offline": "batch_time",
      "Hybrid": "batch_time"
    },
    fallback: "ai_handler"
  },

  batch_time: {
    question: "Select batch timing",
    type: "selection",
    options: {
      "Weekday": "demo",
      "Weekend": "demo",
      "Fast-track": "demo"
    },
    fallback: "ai_handler"
  },

  demo: {
    question: "Book demo?",
    type: "selection",
    options: {
      "Yes": "lms",
      "No": "lms"
    },
    fallback: "ai_handler"
  },

  lms: {
    question: "Explore LMS?",
    type: "selection",
    options: {
      "Yes": "details",
      "No": "details"
    },
    fallback: "ai_handler"
  },

  details: {
    question: "Enter your details (Name, Email, Phone)",
    type: "form",
    fields: ["name", "email", "phone"],
    validation: {
      name: "required",
      email: "email",
      phone: "phone"
    },
    preSubmit: true,
    counsellorTrigger: true,
    fallback: "ai_handler"
  },

  visa_type: {
    question: "Select Visa Type",
    type: "selection",
    options: {
      "Student Visa": "student_country",
      "PR": "pr",
      "Work Visa": "work",
      "Spouse Visa": "spouse",
      "Visitor Visa": "visitor"
    },
    fallback: "ai_handler"
  },

  student_country: {
    question: "Select Country",
    type: "selection",
    options: {
      "Canada": "student_level",
      "USA": "student_level"
    },
    fallback: "ai_handler"
  },

  student_level: {
    question: "Select Study Level",
    type: "selection",
    options: {
      "UG": "student_form",
      "PG": "student_form"
    },
    fallback: "ai_handler"
  },

  student_form: {
    question: "Fill qualification form",
    type: "form",
    fields: ["qualification", "percentage", "budget"],
    preSubmit: true,
    counsellorTrigger: true,
    fallback: "ai_handler"
  },

  onshore: {
    question: "Select Country",
    type: "selection",
    options: {
      "USA": "onshore_services",
      "Canada": "onshore_services"
    },
    fallback: "ai_handler"
  },

  onshore_services: {
    question: "What service do you need?",
    type: "selection",
    options: {
      "Visa Extension": "form",
      "PR": "form",
      "Work Permit": "form"
    },
    fallback: "ai_handler"
  },

  form: {
    question: "Fill form",
    type: "form",
    fields: ["details"],
    preSubmit: true,
    counsellorTrigger: true,
    fallback: "ai_handler"
  }
};

module.exports = tree;