import { createHash, timingSafeEqual } from "node:crypto";
import jwt from "jsonwebtoken";
import { JWT_AUDIENCE, JWT_ISSUER } from "../config/jwt.js";

function authConfig() {
  const { ADMIN_USERNAME, ADMIN_PASSWORD, JWT_SECRET } = process.env;
  if (!ADMIN_USERNAME || !ADMIN_PASSWORD || !JWT_SECRET || Buffer.byteLength(JWT_SECRET) < 32) {
    const error = new Error("Authentication is not configured. Set ADMIN_USERNAME, ADMIN_PASSWORD, and a JWT_SECRET of at least 32 characters.");
    error.statusCode = 503;
    throw error;
  }
  return { username: ADMIN_USERNAME, password: ADMIN_PASSWORD, secret: JWT_SECRET };
}
function sameSecret(left, right) {
  const leftHash = createHash("sha256").update(left).digest();
  const rightHash = createHash("sha256").update(right).digest();
  return timingSafeEqual(leftHash, rightHash);
}

export function login(request, response) {
  const { username, password } = request.body || {};
  if (typeof username !== "string" || typeof password !== "string") {
    return response.status(400).json({ message: "Username and password are required." });
  }

  const config = authConfig();
  if (!sameSecret(username, config.username) || !sameSecret(password, config.password)) {
    return response.status(401).json({ message: "Invalid username or password." });
  }

  const token = jwt.sign(
    { role: "admin" },
    config.secret,
    {
      algorithm: "HS256",
      subject: config.username,
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      expiresIn: "1h"
    }
  );
  return response.json({ token, user: { username: config.username, role: "admin" } });
}
