import axios from "axios";
import { getCsrfToken } from "./csrf";

// Drop-in replacement for the default axios export. Every request in the
// app should go through this instance instead of importing axios
// directly, so state-changing calls automatically carry the
// X-CSRF-TOKEN header (see backend/Middleware/CsrfProtectionMiddleware.cs).
const http = axios.create({
  withCredentials: true,
});

const CSRF_PROTECTED_METHODS = new Set(["post", "put", "patch", "delete"]);

http.interceptors.request.use((config) => {
  const method = config.method?.toLowerCase();

  if (method && CSRF_PROTECTED_METHODS.has(method)) {
    const token = getCsrfToken();
    if (token) {
      config.headers.set("X-CSRF-TOKEN", token);
    }
  }

  return config;
});

export default http;
