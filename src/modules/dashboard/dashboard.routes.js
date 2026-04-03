/**
 * Dashboard Routes
 *
 * Access control:
 *   GET /api/dashboard/summary          — VIEWER, ANALYST, ADMIN
 *   GET /api/dashboard/categories       — VIEWER, ANALYST, ADMIN
 *   GET /api/dashboard/recent           — VIEWER, ANALYST, ADMIN
 *   GET /api/dashboard/trends/monthly   — ANALYST, ADMIN only
 *   GET /api/dashboard/trends/weekly    — ANALYST, ADMIN only
 */

const { Router } = require("express");
const controller = require("./dashboard.controller");
const { authenticate } = require("../../middleware/auth.middleware");
const { requireMinRole } = require("../../middleware/rbac.middleware");

const router = Router();

// All dashboard routes require authentication
router.use(authenticate);

// All roles can access basic summary data
router.get("/summary", controller.getSummary);
router.get("/categories", controller.getCategoryBreakdown);
router.get("/recent", controller.getRecentActivity);

// Trend/insight endpoints require ANALYST or higher
router.get("/trends/monthly", requireMinRole("ANALYST"), controller.getMonthlyTrends);
router.get("/trends/weekly", requireMinRole("ANALYST"), controller.getWeeklyTrends);

module.exports = router;
