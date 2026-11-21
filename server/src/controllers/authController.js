import { createHash, timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { JWT_AUDIENCE, JWT_ISSUER } from "../config/jwt.js";
import User from "../models/User.js";

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || Buffer.byteLength(secret) < 32) {
    const error = new Error("Authentication is not configured. Set a JWT_SECRET of at least 32 characters.");
    error.statusCode = 503;
    throw error;
  }
  return secret;
}

function sameSecret(left, right) {
  const leftHash = createHash("sha256").update(left).digest();
  const rightHash = createHash("sha256").update(right).digest();
  return timingSafeEqual(leftHash, rightHash);
}

function createToken(subject, role, secret) {
  return jwt.sign(
    { role },
    secret,
    {
      algorithm: "HS256",
      subject,
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      expiresIn: "1h"
    }
  );
}

function publicUser(user) {
  return {
    id: user._id ? user._id.toString() : user.id,
    username: user.username,
    ...(user.email ? { email: user.email } : {}),
    role: user.role
  };
}

export async function register(request, response) {
  const { username, email, password } = request.body || {};
  if (typeof username !== "string" || typeof email !== "string" || typeof password !== "string") {
    return response.status(400).json({ message: "Username, email, and password are required." });
  }

  const normalizedUsername = username.trim().toLowerCase();
  const normalizedEmail = email.trim().toLowerCase();
  if (!/^[a-z0-9._-]{3,30}$/.test(normalizedUsername)) {
    return response.status(400).json({ message: "Username must be 3–30 characters and use only letters, numbers, dots, underscores, or hyphens." });
  }
  if (process.env.ADMIN_USERNAME?.trim().toLowerCase() === normalizedUsername) {
    return response.status(409).json({ message: "That username is unavailable." });
  }
  if (normalizedEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return response.status(400).json({ message: "Enter a valid email address." });
  }
  if (Buffer.byteLength(password) < 8 || Buffer.byteLength(password) > 72) {
    return response.status(400).json({ message: "Password must be between 8 and 72 bytes." });
  }

  const secret = getJwtSecret();
  const user = await User.create({
    username: normalizedUsername,
    email: normalizedEmail,
    password: await bcrypt.hash(password, 12)
  });
  const token = createToken(user._id.toString(), user.role, secret);
  return response.status(201).json({ token, user: publicUser(user) });
}

export async function login(request, response) {
  const { identifier, username, password } = request.body || {};
  const loginIdentifier = typeof identifier === "string" ? identifier.trim() : username;
  if (typeof loginIdentifier !== "string" || typeof password !== "string") {
    return response.status(400).json({ message: "Username or email and password are required." });
  }
  if (Buffer.byteLength(password) > 72) {
    return response.status(401).json({ message: "Invalid username or password." });
  }

  const secret = getJwtSecret();
  const { ADMIN_USERNAME, ADMIN_PASSWORD } = process.env;
  if (
    ADMIN_USERNAME &&
    ADMIN_PASSWORD &&
    sameSecret(loginIdentifier, ADMIN_USERNAME) &&
    sameSecret(password, ADMIN_PASSWORD)
  ) {
    const user = { id: ADMIN_USERNAME, username: ADMIN_USERNAME, role: "admin" };
    return response.json({ token: createToken(ADMIN_USERNAME, "admin", secret), user });
  }

  const normalizedIdentifier = loginIdentifier.toLowerCase();
  const user = await User.findOne({
    $or: [{ username: normalizedIdentifier }, { email: normalizedIdentifier }]
  }).select("+password");
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return response.status(401).json({ message: "Invalid username or password." });
  }

  return response.json({
    token: createToken(user._id.toString(), user.role, secret),
    user: publicUser(user)
  });
}
