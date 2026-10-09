import axios from "axios";

// When running locally with Vite dev proxy, use relative path "/api" so Vite
// forwards requests to http://localhost:5000/api automatically (no CORS issues).
// In production (Render/Vercel), VITE_API_URL must be set to the backend URL.
const rawHost = import.meta.env.VITE_API_URL || "";
const cleanHost = rawHost.toString().trim().replace(/\/+$/, "");

// Decide baseURL:
// - If VITE_API_URL is empty or points to localhost → use relative "/api" (Vite proxy handles it)
// - If VITE_API_URL is a full production URL → append /api if not already there
let baseURL;
if (!cleanHost || cleanHost.includes("localhost")) {
  baseURL = "/api";
} else {
  baseURL = cleanHost.endsWith("/api") ? cleanHost : `${cleanHost}/api`;
}

const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false,
});

// Attach JWT token from localStorage to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers["Authorization"] = `Bearer ${token}`;
  return config;
});

// Response interceptor: log errors to console for debugging
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error(
        `API Error [${error.response.status}] ${error.config?.method?.toUpperCase()} ${error.config?.url}:`,
        error.response.data
      );
    } else if (error.request) {
      console.error("API No Response (network error or CORS):", error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
