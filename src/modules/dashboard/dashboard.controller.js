/**
 * Dashboard Controller
 * Handles HTTP request/response for analytics/summary endpoints
 */

const dashboardService = require("./dashboard.service");
const { sendSuccess } = require("../../utils/response");
const { z } = require("zod");
const { validate } = require("../../utils/validation");

const trendsQuerySchema = z.object({
  months: z.coerce.number().int().min(1).max(24).default(6),
});

const weeklyQuerySchema = z.object({
  weeks: z.coerce.number().int().min(1).max(52).default(4),
});

const recentQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

/**
 * GET /api/dashboard/summary
 * Total income, expenses, net balance
 * Accessible by: VIEWER, ANALYST, ADMIN
 */
async function getSummary(req, res, next) {
  try {
    const data = await dashboardService.getSummary();
    return sendSuccess(res, 200, "Dashboard summary retrieved.", data);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/dashboard/categories
 * Income and expense totals broken down by category
 * Accessible by: VIEWER, ANALYST, ADMIN
 */
async function getCategoryBreakdown(req, res, next) {
  try {
    const data = await dashboardService.getCategoryBreakdown();
    return sendSuccess(res, 200, "Category breakdown retrieved.", data);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/dashboard/trends/monthly?months=6
 * Monthly income vs expense trends
 * Accessible by: ANALYST, ADMIN
 */
async function getMonthlyTrends(req, res, next) {
  try {
    const { months } = validate(trendsQuerySchema, req.query);
    const data = await dashboardService.getMonthlyTrends(months);
    return sendSuccess(res, 200, `Monthly trends for last ${months} months.`, data);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/dashboard/trends/weekly?weeks=4
 * Weekly income vs expense trends
 * Accessible by: ANALYST, ADMIN
 */
async function getWeeklyTrends(req, res, next) {
  try {
    const { weeks } = validate(weeklyQuerySchema, req.query);
    const data = await dashboardService.getWeeklyTrends(weeks);
    return sendSuccess(res, 200, `Weekly trends for last ${weeks} weeks.`, data);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/dashboard/recent?limit=10
 * Most recent financial activity
 * Accessible by: VIEWER, ANALYST, ADMIN
 */
async function getRecentActivity(req, res, next) {
  try {
    const { limit } = validate(recentQuerySchema, req.query);
    const data = await dashboardService.getRecentActivity(limit);
    return sendSuccess(res, 200, "Recent activity retrieved.", data);
  } catch (err) {
    next(err);
  }
}

module.exports = { getSummary, getCategoryBreakdown, getMonthlyTrends, getWeeklyTrends, getRecentActivity };
