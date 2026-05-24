import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5001/api", // ← fixed from 5000 to 5001
});

// Auto-attach JWT token to every request
API.interceptors.request.use((config) => {
  const user = localStorage.getItem("user");
  if (user) {
    const parsed = JSON.parse(user);
    if (parsed.token) {
      config.headers.Authorization = `Bearer ${parsed.token}`;
    }
  }
  return config;
});

export default API;