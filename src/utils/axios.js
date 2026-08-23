import axios from "axios";

const API_HOST = import.meta.env.VITE_API_URL || (import.meta.env.MODE === 'development' ? "http://localhost:5000" : "");

const api = axios.create({
  baseURL: `${API_HOST}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

// (keep your existing interceptor code below this line)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers["Authorization"] = `Bearer ${token}`;
  return config;
});

export default api;
