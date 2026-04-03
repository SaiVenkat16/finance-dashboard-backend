/**
 * Auth Controller
 * Handles HTTP request/response for authentication endpoints
 */

const authService = require("./auth.service");
const { sendSuccess, sendError } = require("../../utils/response");
const { registerSchema, loginSchema, validate } = require("../../utils/validation");

/**
 * POST /api/auth/register
 * Creates a new VIEWER account (public endpoint)
 */
async function register(req, res, next) {
  try {
    const data = validate(registerSchema, req.body);
    // Self-registration always creates VIEWER — role assignment is admin-only
    data.role = "VIEWER";

    const result = await authService.register(data);
    return sendSuccess(res, 201, "Account created successfully.", result);
  } catch (err) {
    if (err.statusCode) return sendError(res, err.statusCode, err.message);
    next(err);
  }
}

/**
 * POST /api/auth/login
 * Authenticates a user and returns a JWT token
 */
async function login(req, res, next) {
  try {
    const data = validate(loginSchema, req.body);
    const result = await authService.login(data);
    return sendSuccess(res, 200, "Login successful.", result);
  } catch (err) {
    if (err.statusCode) return sendError(res, err.statusCode, err.message);
    next(err);
  }
}

/**
 * GET /api/auth/me
 * Returns current authenticated user's profile
 */
async function me(req, res) {
  return sendSuccess(res, 200, "Current user profile.", req.user);
}

module.exports = { register, login, me };
