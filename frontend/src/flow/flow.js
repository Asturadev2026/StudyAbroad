import {
  getCountries,
  createLead,
} from "../services/api";

const flow = {
  // =========================
  // 🔰 ENTRY POINT
  // =========================
  start: {
    message: "What type of service do you want?",
    options: [
      { label: "Onshore", next: "onshore_start" },
      { label: "Offshore", next: "offshore_start" },
    ],
  },

  // =========================
  // 🟢 ONSHORE FLOW (ISOLATED)
  // =========================

  onshore_start: {
  message: "Let's start your onshore journey",
  next: "onshore_country",
},

  onshore_country: {
    message: "Select country (max 3)",
    type: "dynamic",
    save: "countryIds",
    multi: true,
    max: 3,
    action: async () => {
      const data = await getCountries();
      return data.map((c) => ({
        label: c.name,
        value: c.id,
      }));
    },
    next: "onshore_service",
  },

  onshore_service: {
    message: "What service do you need?",
    save: "service",
    options: [
      { label: "University / College / Course Change", next: "visa_duration" },
      { label: "Visa Extension", next: "visa_duration" },
      { label: "Apply Work Permit", next: "visa_duration" },
      { label: "Apply PR", next: "visa_duration" },
      { label: "Parent / Visitor Visa", next: "visa_duration" },
      { label: "Spouse Visa", next: "visa_duration" },
      { label: "Education Loan", next: "visa_duration" },
    ],
  },

  visa_duration: {
    message: "Enter your current visa duration",
    save: "visaDuration",
    next: "onshore_visa_type",
  },

  onshore_visa_type: {
    message: "Select your current visa type",
    save: "visaType",
    options: [
      { label: "Work Visa", next: "name_input" },
      { label: "Student Visa", next: "name_input" },
      { label: "PR", next: "name_input" },
      { label: "Citizen", next: "name_input" },
    ],
  },

  // =========================
  // 🟡 OFFSHORE FLOW (ISOLATED)
  // =========================

  offshore_start: {
    message: "Select service",
    options: [
      { label: "Visa", next: "offshore_visa_type" },
      { label: "Coaching", next: "coaching_flow" },
      { label: "Ancillary", next: "ancillary_service" },
    ],
  },

  // =========================
  // 🔵 OFFSHORE VISA FLOW (FIXED)
  // =========================

  // =========================
// 🔵 OFFSHORE VISA FLOW
// =========================

offshore_visa_type: {
  message: "Select visa type",
  save: "visaType",
  options: [
    { label: "Student Visa", next: "student_qualification" },
    { label: "PR", next: "pr_country" },
    { label: "Visitor Visa", next: "visitor_country" },
    { label: "Spouse Visa", next: "spouse_country" },
    { label: "Work Visa", next: "work_country" },
  ],
},

// ---- STUDENT VISA ----

student_qualification: {
  message: "What is your highest qualification?",
  save: "qualification",
  options: [
    { label: "12th", next: "student_country" },
    { label: "Graduate/Bachelors", next: "student_country" },
    { label: "Post Graduate/Masters", next: "student_country" },
    { label: "Diploma", next: "student_country" },
  ],
},

student_country: {
  message: "Select country (max 3)",
  type: "dynamic",
  save: "countryIds",
  multi: true,
  max: 3,
  action: async () => {
    const data = await getCountries();
    return data.map((c) => ({
      label: c.name,
      value: c.id,
    }));
  },
  next: "name_input",
},

// ---- PR ----

pr_country: {
  message: "Select country (max 3)",
  type: "dynamic",
  save: "countryIds",
  multi: true,
  max: 3,
  action: async () => {
    const data = await getCountries();
    return data.map((c) => ({
      label: c.name,
      value: c.id,
    }));
  },
  next: "name_input",
},

// ---- VISITOR VISA ----

visitor_country: {
  message: "Select country (max 3)",
  type: "dynamic",
  save: "countryIds",
  multi: true,
  max: 3,
  action: async () => {
    const data = await getCountries();
    return data.map((c) => ({
      label: c.name,
      value: c.id,
    }));
  },
  next: "visit_purpose",
},

visit_purpose: {
  message: "Purpose of visit?",
  save: "purpose",
  options: [
    { label: "Casual", next: "name_input" },
    { label: "Family", next: "name_input" },
  ],
},

// =========================
// 💑 SPOUSE VISA (UPDATED)
// =========================

spouse_country: {
  message: "Select country",
  type: "dynamic",
  save: "countryIds",
  action: async () => {
    const data = await getCountries();
    return data.map((c) => ({
      label: c.name,
      value: c.id,
    }));
  },
  next: "spouse_relation",
},

spouse_relation: {
  message: "Relation?",
  save: "relation",
  options: [
    { label: "Husband", next: "spouse_name" },
    { label: "Wife", next: "spouse_name" },
  ],
},

// 👤 SPOUSE DETAILS

spouse_name: {
  message: "Enter spouse name",
  save: "spouseName",
  next: "spouse_email",
},

spouse_email: {
  message: "Enter spouse email",
  save: "spouseEmail",
  next: "spouse_phone",
},

spouse_phone: {
  message: "Enter spouse phone number",
  save: "spousePhone",
  next: "spouse_visa_type",
},

spouse_visa_type: {
  message: "Select spouse visa type",
  save: "spouseVisaType",
  options: [
    { label: "Work Visa", next: "applicant_name" },
    { label: "Student Visa", next: "applicant_name" },
    { label: "PR", next: "applicant_name" },
    { label: "Citizen", next: "applicant_name" },
  ],
},

// 👤 APPLICANT DETAILS

applicant_name: {
  message: "Enter your name",
  save: "name",
  next: "applicant_email",
},

applicant_email: {
  message: "Enter your email",
  save: "email",
  next: "applicant_phone",
},

applicant_phone: {
  message: "Enter your phone number",
  save: "mobile",
  next: "spouse_address",
},
// 🏠 ADDRESS (ONLY SPOUSE FLOW)
spouse_address: {
  message: "Enter your address",
  save: "address",
  next: "spouse_education",
},

// 🎓 EDUCATION (ONLY SPOUSE FLOW)
spouse_education: {
  message: "Enter your highest qualification",
  save: "education",
  next: "submit_lead",
},

// ---- WORK VISA ----

work_country: {
  message: "Select country (max 3)",
  type: "dynamic",
  save: "countryIds",
  multi: true,
  max: 3,
  action: async () => {
    const data = await getCountries();
    return data.map((c) => ({
      label: c.name,
      value: c.id,
    }));
  },
  next: "name_input",
},
  // =========================
  // 🟣 ANCILLARY FLOW
  // =========================

  ancillary_service: {
    message: "Select ancillary service",
    options: [
      { label: "Education Loan", next: "ancillary_country" },
      { label: "Forex", next: "ancillary_country" },
      { label: "Airport Pickup", next: "ancillary_country" },
      { label: "Accommodation", next: "ancillary_country" },
      { label: "Travel Insurance", next: "ancillary_country" },
      { label: "Health Insurance", next: "ancillary_country" },
      { label: "SIM Card", next: "ancillary_country" },
      { label: "Bank Account", next: "ancillary_country" },
      { label: "Mentor", next: "ancillary_country" },
      { label: "Air Ticket", next: "ancillary_country" },
    ],
  },

  ancillary_country: {
    message: "Select country (max 3)",
    type: "dynamic",
    save: "countryIds",
    multi: true,
    max: 3,
    action: async () => {
      const data = await getCountries();
      return data.map((c) => ({
        label: c.name,
        value: c.id,
      }));
    },
    next: "name_input",
  },

  // =========================
// 🟠 COACHING FLOW (UPDATED)
// =========================

// 🔰 NEW ENTRY STEP
coaching_flow: {
  message: "Do you know about the exam?",
  save: "knowsExam",
  options: [
    { label: "Yes", next: "coaching_exam" },
    { label: "No", next: "coaching_recommendation" },
  ],
},

// =========================
// ✅ PATH 1: USER KNOWS EXAM
// =========================

coaching_exam: {
  message: "Select exam",
  save: "exam",
  options: [
    { label: "IELTS", next: "coaching_mode" },
    { label: "PTE", next: "coaching_mode" },
    { label: "TOEFL", next: "coaching_mode" },
    { label: "Duolingo", next: "coaching_mode" },
    { label: "French", next: "coaching_mode" },
  ],
},

// =========================
// ❌ PATH 2: USER DOESN’T KNOW
// =========================

coaching_recommendation: {
  message: "We recommend the following exams:",
  next: "coaching_recommendation_options",
},

coaching_recommendation_options: {
  message: "Choose one to continue",
  save: "exam",
  options: [
    {
      label: "IELTS - International English Language Testing System",
      next: "coaching_mode",
    },
    {
      label: "PTE - Pearson Test of English Academic",
      next: "coaching_mode",
    },
    {
      label: "TOEFL - Test of English as a Foreign Language",
      next: "coaching_mode",
    },
  ],
},

// =========================
// 🎯 COMMON FLOW CONTINUES
// =========================

coaching_mode: {
  message: "Preferred mode of coaching?",
  save: "mode",
  options: [
    { label: "Online", next: "coaching_timing" },
    { label: "Offline", next: "coaching_timing" },
    { label: "Hybrid", next: "coaching_timing" },
  ],
},

// 🔥 (THIS WAS YOUR MISSING STEP IS ALREADY CORRECT AFTER THIS)

coaching_timing: {
  message: "Preferred batch timing?",
  save: "timing",
  options: [
    { label: "Morning (7–10 AM)", next: "coaching_batches" },
    { label: "Afternoon (2–5 PM)", next: "coaching_batches" },
    { label: "Evening (6–9 PM)", next: "coaching_batches" },
  ],
},

coaching_batches: {
  message: "Here are available batches based on your preference",
  next: "coaching_readiness",
},

coaching_readiness: {
  message: "Are you ready to start preparation?",
  save: "readiness",
  options: [
    { label: "Yes, ready to start", next: "coaching_name" },
    { label: "Need more guidance", next: "coaching_name" },
  ],
},

// =========================
// 👤 USER DETAILS
// =========================

coaching_name: {
  message: "Enter your name",
  save: "name",
  next: "coaching_email",
},

coaching_email: {
  message: "Enter your email",
  save: "email",
  next: "coaching_phone",
},

coaching_phone: {
  message: "Enter your phone number",
  save: "mobile",
  next: "coaching_goal",
},

coaching_goal: {
  message: "What is your target score or goal?",
  save: "goal",
  next: "submit_lead",
},

  // =========================
  // 🟢 COMMON LEAD FLOW
  // =========================

  name_input: {
    message: "Enter your name",
    save: "name",
    next: "email_input",
  },

  email_input: {
    message: "Enter your email",
    save: "email",
    next: "phone_input",
  },

  phone_input: {
    message: "Enter your phone number (with country code)",
    save: "mobile",
    next: "detail_description",
  },

  detail_description: {
    message: "Tell us more about your requirement",
    save: "description",
    next: "submit_lead",
  },

  // =========================
  // 🔴 FINAL
  // =========================

  submit_lead: {
    message: "Submitting your details...",
    type: "api",
    action: async (context) => {
      return await createLead(context);
    },
    next: "success",
  },

  success: {
    message:
      "✅ Form submitted successfully. Counsellor will contact you shortly.",
    end: true,
  },
};

export default flow;