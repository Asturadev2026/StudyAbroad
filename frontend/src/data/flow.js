const flow = {
  // 🌍 START
  start: {
    question: "Where are you currently located?",
    options: {
      "Off-Shore (India)": "offshore",
      "On-Shore (Abroad)": "onshore"
    }
  },

  // =========================
  // 🇮🇳 OFFSHORE FLOW
  // =========================
  offshore: {
    question: "What are you looking for?",
    options: {
      "Coaching": "coaching_qualification",
      "Visa Services": "visa_type",
      "Ancillary Services": "ancillary_services"
    }
  },

  // 🎓 COACHING FLOW
  coaching_qualification: {
    question: "What’s your qualification?",
    options: {
      "10th": "exam_known",
      "12th": "exam_known",
      "Graduate": "exam_known",
      "Postgraduate": "exam_known"
    }
  },

  exam_known: {
    question: "Do you know the exam?",
    options: {
      "Yes (Select Exam)": "select_exam",
      "No (Suggest Exams)": "suggest_exam"
    }
  },

  select_exam: {
    question: "Select your exam",
    options: {
      "IELTS": "batch_type",
      "TOEFL": "batch_type",
      "GRE": "batch_type",
      "GMAT": "batch_type"
    }
  },

  suggest_exam: {
    question: "We will suggest exams based on your profile",
    next: "batch_type"
  },

  batch_type: {
    question: "Select Batch Type",
    options: {
      "Online": "batch_timing",
      "Offline": "batch_timing",
      "Hybrid": "batch_timing"
    }
  },

  batch_timing: {
    question: "Select Batch Timing",
    options: {
      "Weekday": "demo_booking",
      "Weekend": "demo_booking",
      "Fast-track": "demo_booking"
    }
  },

  demo_booking: {
    question: "Would you like to book a demo?",
    options: {
      "Yes (Video Demo)": "lms_access",
      "No": "lms_access"
    }
  },

  lms_access: {
    question: "Would you like to explore LMS?",
    options: {
      "Yes (Preview)": "collect_details",
      "No": "collect_details"
    }
  },

  collect_details: {
    question: "Enter your details",
    form: true,
    fields: ["Name", "Email", "Phone"],
    next: "counsellor_contact"
  },

  counsellor_contact: {
    message: "Counsellor will contact you shortly."
  },

  // =========================
  // ✈️ VISA FLOW
  // =========================
  visa_type: {
    question: "Select Visa Type",
    options: {
      "Student Visa": "student_country",
      "PR Visa": "pr_country",
      "Work Visa": "work_country",
      "Spouse Visa": "spouse_country",
      "Visitor Visa": "visitor_country"
    }
  },

  // 🎓 STUDENT VISA
  student_country: {
    question: "Select Country",
    options: {
      "USA": "student_level",
      "Canada": "student_level",
      "UK": "student_level",
      "Australia": "student_level"
    }
  },

  student_level: {
    question: "Select Study Level",
    options: {
      "UG": "student_form",
      "PG": "student_form",
      "Diploma": "student_form"
    }
  },

  student_form: {
    question: "Fill Qualification & Basic Details",
    form: true,
    next: "course_suggestion"
  },

  course_suggestion: {
    question: "Trending courses based on your profile",
    dynamic: true,
    next: "counsellor_contact"
  },

  // 🟢 PR FLOW
  pr_country: {
    question: "Select Preferred Countries",
    multiSelect: true,
    options: {
      "Canada": "pr_form",
      "Australia": "pr_form",
      "UK": "pr_form"
    }
  },

  pr_form: {
    question: "Upload CV / Fill Form",
    form: true,
    next: "counsellor_contact"
  },

  // 🟠 WORK VISA
  work_country: {
    question: "Select Country",
    options: {
      "USA": "work_type",
      "Canada": "work_type",
      "Germany": "work_type"
    }
  },

  work_type: {
    question: "Select Work Type",
    options: {
      "Skilled": "work_form",
      "Non-Skilled": "work_form"
    }
  },

  work_form: {
    question: "Upload CV / Fill Form",
    form: true,
    next: "counsellor_contact"
  },

  // 💍 SPOUSE VISA
  spouse_country: {
    question: "Select Country",
    options: {
      "Canada": "spouse_details",
      "UK": "spouse_details"
    }
  },

  spouse_details: {
    question: "Enter Relation Details (Husband/Wife)",
    form: true,
    next: "counsellor_contact"
  },

  // 🧳 VISITOR VISA
  visitor_country: {
    question: "Select Country",
    options: {
      "USA": "visitor_purpose",
      "Canada": "visitor_purpose"
    }
  },

  visitor_purpose: {
    question: "Purpose of Visit",
    options: {
      "Family": "visitor_details",
      "Casual Visiting": "visitor_details"
    }
  },

  visitor_details: {
    question: "Enter Relation & Sponsor Details",
    form: true,
    next: "counsellor_contact"
  },

  // =========================
  // 🧾 ANCILLARY SERVICES
  // =========================
  ancillary_services: {
    question: "Select Service",
    options: {
      "Education Loan": "ancillary_country",
      "Forex": "ancillary_country",
      "Airport Pickup": "ancillary_country",
      "Accommodation": "ancillary_country",
      "Travel Insurance": "ancillary_country",
      "Health Insurance": "ancillary_country",
      "SIM Card": "ancillary_country",
      "Bank Account": "ancillary_country",
      "Mentor": "ancillary_country"
    }
  },

  ancillary_country: {
    question: "Select Country",
    options: {
      "USA": "ancillary_form",
      "Canada": "ancillary_form",
      "UK": "ancillary_form"
    }
  },

  ancillary_form: {
    question: "Fill Details",
    form: true,
    next: "counsellor_contact"
  },

  // =========================
  // 🌍 ONSHORE FLOW
  // =========================
  onshore: {
    question: "Select Country",
    options: {
      "USA": "onshore_services",
      "Canada": "onshore_services",
      "UK": "onshore_services"
    }
  },

  onshore_services: {
    question: "What service do you need?",
    options: {
      "University Change": "onshore_form",
      "Visa Extension": "onshore_form",
      "Work Permit": "onshore_form",
      "PR Application": "onshore_form",
      "Spouse Visa": "onshore_form",
      "Parent / Visitor Visa": "onshore_form",
      "Education Loan": "onshore_form"
    }
  },

  onshore_form: {
    question: "Fill Form",
    form: true,
    next: "counsellor_contact"
  },

  // =========================
  // 📊 STATUS & VALIDATION
  // =========================
  status_validation: {
    question: "Enter Visa Details",
    form: true,
    fields: [
      "Visa Type",
      "Validity Duration",
      "Current Status (Legal / Illegal)"
    ],
    next: "status_result"
  },

  status_result: {
    question: "Checking eligibility & next steps...",
    dynamic: true,
    next: "counsellor_followup"
  },

  counsellor_followup: {
    message: "Counsellor will follow up with next steps."
  }
};

export default flow;