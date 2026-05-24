import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL
})

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