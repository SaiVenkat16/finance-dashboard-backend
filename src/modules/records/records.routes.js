/**
 * Financial Records Routes
 *
 * Access control:
 *   GET    /api/records       — VIEWER, ANALYST, ADMIN  (all can view)
 *   GET    /api/records/:id   — VIEWER, ANALYST, ADMIN
 *   POST   /api/records       — ANALYST, ADMIN only
 *   PUT    /api/records/:id   — ANALYST (own), ADMIN (any)
 *   DELETE /api/records/:id   — ADMIN only
 */

const { Router } = require("express");
const controller = require("./records.controller");
const { authenticate } = require("../../middleware/auth.middleware");
const { requireMinRole, requireRole } = require("../../middleware/rbac.middleware");

const router = Router();

// All record routes require authentication
router.use(authenticate);

// Anyone authenticated can view
router.get("/", controller.listRecords);
router.get("/:id", controller.getRecord);

// ANALYST and ADMIN can create and update
router.post("/", requireMinRole("ANALYST"), controller.createRecord);
router.put("/:id", requireMinRole("ANALYST"), controller.updateRecord);

// Only ADMIN can delete
router.delete("/:id", requireRole("ADMIN"), controller.deleteRecord);

module.exports = router;
