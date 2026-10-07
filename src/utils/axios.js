import axios from "axios";

const rawHost = (import.meta.env.VITE_API_URL !== undefined && import.meta.env.VITE_API_URL !== "")
  ? import.meta.env.VITE_API_URL.trim()
  : (import.meta.env.MODE === 'development' ? "http://localhost:5000" : "");

const API_HOST = rawHost.replace(/\/+$/, '');

const api = axios.create({
  baseURL: API_HOST ? `${API_HOST}/api` : "/api",
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
