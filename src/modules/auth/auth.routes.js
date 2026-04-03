/**
 * Auth Routes
 *
 * Public:
 *   POST /api/auth/register  — create new account
 *   POST /api/auth/login     — get JWT token
 *
 * Protected:
 *   GET  /api/auth/me        — get current user's profile
 */

const { Router } = require("express");
const controller = require("./auth.controller");
const { authenticate } = require("../../middleware/auth.middleware");

const router = Router();

router.post("/register", controller.register);
router.post("/login", controller.login);
router.get("/me", authenticate, controller.me);

module.exports = router;
