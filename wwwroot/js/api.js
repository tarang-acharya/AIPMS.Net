// api.js — thin fetch wrapper around the AIPMS REST API.

const API_BASE = "/api";

const Auth = {
  getToken() { return localStorage.getItem("aipms_token"); },
  getUser() {
    const raw = localStorage.getItem("aipms_user");
    return raw ? JSON.parse(raw) : null;
  },
  setSession(token, user) {
    localStorage.setItem("aipms_token", token);
    localStorage.setItem("aipms_user", JSON.stringify(user));
  },
  clear() {
    localStorage.removeItem("aipms_token");
    localStorage.removeItem("aipms_user");
  },
  isLoggedIn() { return !!Auth.getToken(); },
};

async function apiRequest(method, path, body, isForm = false) {
  const headers = {};
  const token = Auth.getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  let payload;
  if (isForm) {
    payload = body;
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  const res = await fetch(`${API_BASE}${path}`, { method, headers, body: payload });

  let data = null;
  const text = await res.text();
  try { data = text ? JSON.parse(text) : null; } catch { data = null; }

  if (!res.ok) {
    const message = (data && data.error) || `Request failed (${res.status})`;
    if (res.status === 401 && token) {
      Auth.clear();
      window.location.hash = "#/login";
    }
    throw new Error(message);
  }
  return data;
}

const api = {
  get: (path) => apiRequest("GET", path),
  post: (path, body) => apiRequest("POST", path, body),
  put: (path, body) => apiRequest("PUT", path, body),
  postForm: (path, formData) => apiRequest("POST", path, formData, true),
};
