import API from "../services/api";

export const registerUser = (data) => {
  return API.post("/api/auth/register", data);
};

export const loginUser = (data) => {
  return API.post("/api/auth/login", data);
};