import jwt from "jsonwebtoken";
import { JWT_AUDIENCE, JWT_ISSUER } from "../config/jwt.js";
import Post from "../models/Post.js";

export function authenticateToken(request, response, next) {
  const authorization = request.get("authorization") || "";
  const [scheme, token] = authorization.split(" ");
  if (scheme !== "Bearer" || !token) {
    return response.status(401).json({ message: "Authentication required." });
  }

  try {
    request.user = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE
    });
    return next();
  } catch {
    return response.status(401).json({ message: "Invalid or expired authentication token." });
  }
}

export function authorizeRoles(...roles) {
  return (request, response, next) => {
    if (!roles.includes(request.user?.role)) {
      return response.status(403).json({ message: "You are not authorized to perform this action." });
    }
    return next();
  };
}

export async function authorizePostOwner(request, response, next) {
  if (request.user.role === "admin") return next();

  const post = await Post.findOne({ slug: request.params.slug });
  if (!post) return response.status(404).json({ message: "Post not found." });
  if (!post.author || post.author.toString() !== request.user.sub) {
    return response.status(403).json({ message: "You can only manage your own posts." });
  }

  request.post = post;
  return next();
}
