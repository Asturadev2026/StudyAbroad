const BASE_URL = "http://localhost:5000/api";

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