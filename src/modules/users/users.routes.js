/**
 * Users Routes — All ADMIN only
 *
 *   GET    /api/users             — list all users (paginated)
 *   GET    /api/users/:id         — get user by ID
 *   POST   /api/users             — create a new user
 *   PUT    /api/users/:id         — update user details
 *   PATCH  /api/users/:id/status  — activate/deactivate user
 *   DELETE /api/users/:id         — permanently delete user
 */

const { Router } = require("express");
const controller = require("./users.controller");
const { authenticate } = require("../../middleware/auth.middleware");
const { requireRole } = require("../../middleware/rbac.middleware");

const router = Router();

// All user management routes require authentication + ADMIN role
router.use(authenticate, requireRole("ADMIN"));

router.get("/", controller.listUsers);
router.get("/:id", controller.getUser);
router.post("/", controller.createUser);
router.put("/:id", controller.updateUser);
router.patch("/:id/status", controller.updateStatus);
router.delete("/:id", controller.deleteUser);

module.exports = router;
