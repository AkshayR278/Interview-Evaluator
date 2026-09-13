import axios from "axios";

// Reads from .env (VITE_API_BASE_URL). Falls back to local FastAPI dev server.
const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const apiClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

export default apiClient;
