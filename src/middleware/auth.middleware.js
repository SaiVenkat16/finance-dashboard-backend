/**
 * Authentication Middleware
 * Verifies JWT token and attaches the decoded user to req.user
 */

const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/env");
const prisma = require("../config/prisma");
const { sendError } = require("../utils/response");

/**
 * authenticate — verifies the Bearer token in the Authorization header.
 * Attaches the full user object to req.user on success.
 */
async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return sendError(res, 401, "Authentication required. Provide a Bearer token.");
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Fetch fresh user data to check status
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true, role: true, status: true },
    });

    if (!user) {
      return sendError(res, 401, "User not found. Token may be invalid.");
    }

    if (user.status === "INACTIVE") {
      return sendError(res, 403, "Your account has been deactivated. Contact an administrator.");
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return sendError(res, 401, "Token has expired. Please log in again.");
    }
    if (err.name === "JsonWebTokenError") {
      return sendError(res, 401, "Invalid token.");
    }
    next(err);
  }
}

module.exports = { authenticate };
