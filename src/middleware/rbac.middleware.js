/**
 * Role-Based Access Control (RBAC) Middleware
 *
 * Role hierarchy:
 *   VIEWER   → read-only access to dashboard data
 *   ANALYST  → read access + insights/summaries
 *   ADMIN    → full access including user management
 */

const { sendError } = require("../utils/response");

// Role priority map — higher number = more permissions
const ROLE_PRIORITY = {
  VIEWER: 1,
  ANALYST: 2,
  ADMIN: 3,
};

/**
 * requireRole(...roles)
 * Returns middleware that allows access only if req.user.role is in the allowed list.
 *
 * Usage:
 *   router.post("/records", authenticate, requireRole("ANALYST", "ADMIN"), controller)
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 401, "Authentication required.");
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(
        res,
        403,
        `Access denied. Required role: ${allowedRoles.join(" or ")}. Your role: ${req.user.role}`
      );
    }

    next();
  };
}

/**
 * requireMinRole(minRole)
 * Returns middleware that allows access if the user's role priority >= minRole priority.
 *
 * Usage:
 *   router.get("/records", authenticate, requireMinRole("ANALYST"), controller)
 * This allows ANALYST and ADMIN, but not VIEWER.
 */
function requireMinRole(minRole) {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 401, "Authentication required.");
    }

    const userPriority = ROLE_PRIORITY[req.user.role] || 0;
    const requiredPriority = ROLE_PRIORITY[minRole] || 0;

    if (userPriority < requiredPriority) {
      return sendError(
        res,
        403,
        `Access denied. Minimum required role: ${minRole}. Your role: ${req.user.role}`
      );
    }

    next();
  };
}

module.exports = { requireRole, requireMinRole };
