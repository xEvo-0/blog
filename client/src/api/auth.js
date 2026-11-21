const TOKEN_KEY = "inkwell_auth_token";
const USER_KEY = "inkwell_auth_user";

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getAuthUser() {
  const user = localStorage.getItem(USER_KEY);
  if (!user) return null;
  try {
    return JSON.parse(user);
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

export function setAuthToken(token, user) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
}

async function authRequest(path, body) {
  const response = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/auth/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || "Unable to sign in.");
  return payload;
}

export function login(identifier, password) {
  return authRequest("login", { identifier, password });
}

export function register(username, email, password) {
  return authRequest("register", { username, email, password });
}
