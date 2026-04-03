/**
 * Dashboard Service
 * Aggregation logic for summary-level analytics
 */

const prisma = require("../../config/prisma");

/**
 * getSummary — returns overall totals for the dashboard header cards.
 * Returns: totalIncome, totalExpenses, netBalance, recordCount
 */
async function getSummary() {
  const records = await prisma.financialRecord.findMany({
    where: { isDeleted: false },
    select: { amount: true, type: true },
  });

  const totalIncome = records
    .filter((r) => r.type === "INCOME")
    .reduce((sum, r) => sum + r.amount, 0);

  const totalExpenses = records
    .filter((r) => r.type === "EXPENSE")
    .reduce((sum, r) => sum + r.amount, 0);

  return {
    totalIncome: round(totalIncome),
    totalExpenses: round(totalExpenses),
    netBalance: round(totalIncome - totalExpenses),
    recordCount: records.length,
  };
}

/**
 * getCategoryBreakdown — returns totals grouped by category and type.
 * Useful for pie/donut charts on the dashboard.
 */
async function getCategoryBreakdown() {
  const records = await prisma.financialRecord.findMany({
    where: { isDeleted: false },
    select: { amount: true, type: true, category: true },
  });

  // Group by type → category
  const breakdown = {};

  for (const record of records) {
    const key = `${record.type}:${record.category}`;
    if (!breakdown[key]) {
      breakdown[key] = { type: record.type, category: record.category, total: 0, count: 0 };
    }
    breakdown[key].total += record.amount;
    breakdown[key].count += 1;
  }

  const result = Object.values(breakdown).map((item) => ({
    ...item,
    total: round(item.total),
  }));

  // Sort by total descending
  result.sort((a, b) => b.total - a.total);

  return result;
}

/**
 * getMonthlyTrends — returns income vs expense totals grouped by month.
 * Used for line/bar charts showing monthly trends.
 * @param {number} months — number of past months to include (default 6)
 */
async function getMonthlyTrends(months = 6) {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months + 1);
  startDate.setDate(1);
  startDate.setHours(0, 0, 0, 0);

  const records = await prisma.financialRecord.findMany({
    where: {
      isDeleted: false,
      date: { gte: startDate },
    },
    select: { amount: true, type: true, date: true },
  });

  // Group by year-month
  const monthMap = {};

  for (const record of records) {
    const d = new Date(record.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

    if (!monthMap[key]) {
      monthMap[key] = { month: key, income: 0, expenses: 0, net: 0 };
    }

    if (record.type === "INCOME") monthMap[key].income += record.amount;
    else monthMap[key].expenses += record.amount;
  }

  // Sort chronologically and round values
  return Object.values(monthMap)
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((item) => ({
      month: item.month,
      income: round(item.income),
      expenses: round(item.expenses),
      net: round(item.income - item.expenses),
    }));
}

/**
 * getWeeklyTrends — returns income vs expense totals for the last N weeks.
 */
async function getWeeklyTrends(weeks = 4) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - weeks * 7);
  startDate.setHours(0, 0, 0, 0);

  const records = await prisma.financialRecord.findMany({
    where: {
      isDeleted: false,
      date: { gte: startDate },
    },
    select: { amount: true, type: true, date: true },
  });

  // Group by ISO week number
  const weekMap = {};

  for (const record of records) {
    const d = new Date(record.date);
    const weekKey = getISOWeek(d);

    if (!weekMap[weekKey]) {
      weekMap[weekKey] = { week: weekKey, income: 0, expenses: 0, net: 0 };
    }

    if (record.type === "INCOME") weekMap[weekKey].income += record.amount;
    else weekMap[weekKey].expenses += record.amount;
  }

  return Object.values(weekMap)
    .sort((a, b) => a.week.localeCompare(b.week))
    .map((item) => ({
      week: item.week,
      income: round(item.income),
      expenses: round(item.expenses),
      net: round(item.income - item.expenses),
    }));
}

/**
 * getRecentActivity — returns the most recent N records with user info.
 */
async function getRecentActivity(limit = 10) {
  return prisma.financialRecord.findMany({
    where: { isDeleted: false },
    take: limit,
    orderBy: { date: "desc" },
    include: {
      user: { select: { id: true, name: true } },
    },
  });
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function round(value) {
  return Math.round(value * 100) / 100;
}

function getISOWeek(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNum = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

module.exports = { getSummary, getCategoryBreakdown, getMonthlyTrends, getWeeklyTrends, getRecentActivity };
