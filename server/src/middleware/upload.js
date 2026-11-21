import multer from "multer";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";

const uploadsDirectory = path.join(process.cwd(), "uploads");

const storage = multer.diskStorage({
  destination: async (_request, _file, callback) => {
    try {
      await mkdir(uploadsDirectory, { recursive: true });
      callback(null, uploadsDirectory);
    } catch (error) {
      callback(error);
    }
  },
  filename: (_request, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    callback(null, `${randomUUID()}${extension}`);
  }
});

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function fileFilter(_request, file, callback) {
  if (!allowedTypes.has(file.mimetype)) {
    callback(new Error("Upload a JPG, PNG, WEBP, or GIF image."));
    return;
  }

  callback(null, true);
}

export const uploadCover = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 }
}).single("coverImage");
