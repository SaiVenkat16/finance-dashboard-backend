/**
 * Users Controller
 * Handles HTTP request/response for user management endpoints
 */

const usersService = require("./users.service");
const { sendSuccess, sendError, buildPaginationMeta } = require("../../utils/response");
const { registerSchema, updateUserSchema, updateUserStatusSchema, validate } = require("../../utils/validation");
const { z } = require("zod");

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  role: z.enum(["VIEWER", "ANALYST", "ADMIN"]).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

/**
 * GET /api/users
 */
async function listUsers(req, res, next) {
  try {
    const query = validate(listQuerySchema, req.query);
    const { users, total } = await usersService.getAllUsers(query);
    const meta = buildPaginationMeta(total, query.page, query.limit);
    return sendSuccess(res, 200, "Users retrieved.", users, meta);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/users/:id
 */
async function getUser(req, res, next) {
  try {
    const user = await usersService.getUserById(req.params.id);
    return sendSuccess(res, 200, "User retrieved.", user);
  } catch (err) {
    if (err.statusCode) return sendError(res, err.statusCode, err.message);
    next(err);
  }
}

/**
 * POST /api/users
 */
async function createUser(req, res, next) {
  try {
    const data = validate(registerSchema, req.body);
    const user = await usersService.createUser(data);
    return sendSuccess(res, 201, "User created successfully.", user);
  } catch (err) {
    if (err.statusCode) return sendError(res, err.statusCode, err.message);
    next(err);
  }
}

/**
 * PUT /api/users/:id
 */
async function updateUser(req, res, next) {
  try {
    const data = validate(updateUserSchema, req.body);
    const user = await usersService.updateUser(req.params.id, data);
    return sendSuccess(res, 200, "User updated successfully.", user);
  } catch (err) {
    if (err.statusCode) return sendError(res, err.statusCode, err.message);
    next(err);
  }
}

/**
 * PATCH /api/users/:id/status
 */
async function updateStatus(req, res, next) {
  try {
    const { status } = validate(updateUserStatusSchema, req.body);
    const user = await usersService.updateUserStatus(req.params.id, status, req.user.id);
    return sendSuccess(res, 200, `User ${status === "ACTIVE" ? "activated" : "deactivated"} successfully.`, user);
  } catch (err) {
    if (err.statusCode) return sendError(res, err.statusCode, err.message);
    next(err);
  }
}

/**
 * DELETE /api/users/:id
 */
async function deleteUser(req, res, next) {
  try {
    await usersService.deleteUser(req.params.id, req.user.id);
    return sendSuccess(res, 200, "User deleted successfully.");
  } catch (err) {
    if (err.statusCode) return sendError(res, err.statusCode, err.message);
    next(err);
  }
}

module.exports = { listUsers, getUser, createUser, updateUser, updateStatus, deleteUser };
