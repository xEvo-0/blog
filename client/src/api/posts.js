import { getAuthToken } from "./auth.js";

const API_URL = import.meta.env.VITE_API_URL || "";

async function request(path, options = {}) {
  const token = getAuthToken();
  const headers = {
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
  const response = await fetch(`${API_URL}/api${path}`, { ...options, headers });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message || "Something went wrong. Please try again.");
  }

  return payload;
}

export function getPosts({ page = 1, limit = 9, q = "", category = "" } = {}) {
  const params = new URLSearchParams({ page, limit });
  if (q) params.set("q", q);
  if (category && category !== "All") params.set("category", category);
  return request(`/posts?${params}`);
}

export function getPost(slug) {
  return request(`/posts/${encodeURIComponent(slug)}`);
}

export function getCategories() {
  return request("/posts/categories");
}

export function savePost(formData, slug) {
  return request(slug ? `/posts/${encodeURIComponent(slug)}` : "/posts", {
    method: slug ? "PUT" : "POST",
    body: formData
  });
}

export function deletePost(slug) {
  return request(`/posts/${encodeURIComponent(slug)}`, { method: "DELETE" });
}

export function getImageUrl(image) {
  if (!image) return "";
  if (/^https?:\/\//i.test(image)) return image;
  return `${API_URL}${image}`;
}
