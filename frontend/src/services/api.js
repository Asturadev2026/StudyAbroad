const BASE_URL =
  import.meta.env.VITE_API_URL ||
  (window.location.hostname === "localhost"
    ? "http://localhost:5000/api"
    : "https://studyabroad-5j4o.onrender.com/api");

export const getCountries = async () => {
  const res = await fetch(`${BASE_URL}/countries`);
  return res.json();
};

export const getStates = async (countryId) => {
  const res = await fetch(`${BASE_URL}/states/${countryId}`);
  return res.json();
};

export const createLead = async (data) => {
  const res = await fetch(`${BASE_URL}/lead`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  return res.json();
};