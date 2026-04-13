export { sendLeadToCRM };
async function sendLeadToCRM(data) {
  console.log("📤 Sending data to CRM:", data);

  // TODO: Replace with real API
  // Example:
  /*
  await fetch("https://admin.stunel.com/api/leads", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });
  */

  return true;
}

module.exports = { sendLeadToCRM };