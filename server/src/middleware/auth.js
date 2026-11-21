import jwt from "jsonwebtoken";
import { JWT_AUDIENCE, JWT_ISSUER } from "../config/jwt.js";

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
