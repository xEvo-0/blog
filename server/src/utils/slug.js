import { randomBytes } from "node:crypto";

export function slugify(value) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export function createSlug(value) {
  const base = slugify(value) || "post";
  return `${base}-${randomBytes(3).toString("hex")}`;
}
