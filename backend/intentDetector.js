export default detectIntent;
function detectIntent(input) {
  input = input.toLowerCase();

  if (input.includes("pr")) return "pr";
  if (input.includes("study")) return "student_country";
  if (input.includes("work")) return "work";
  if (input.includes("visa")) return "visa_type";

  return null;
}

module.exports = detectIntent;