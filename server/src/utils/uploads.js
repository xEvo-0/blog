import { unlink } from "node:fs/promises";
import path from "node:path";

export async function removeUpload(imageUrl) {
  if (!imageUrl || !imageUrl.startsWith("/uploads/")) return;

  const filename = imageUrl.slice("/uploads/".length);
  if (!filename || path.basename(filename) !== filename) return;

  try {
    await unlink(path.join(process.cwd(), "uploads", filename));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}
