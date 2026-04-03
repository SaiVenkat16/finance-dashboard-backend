/**
 * Finance Dashboard Backend — Express Application
 *
 * Entry point. Sets up middleware, routes, and starts the server.
 */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { PORT, NODE_ENV } = require("./config/env");
const { errorHandler, notFoundHandler } = require("./middleware/error.middleware");

// ── Route Modules ─────────────────────────────────────────────────────────────
const authRoutes = require("./modules/auth/auth.routes");
const userRoutes = require("./modules/users/users.routes");
const recordRoutes = require("./modules/records/records.routes");
const dashboardRoutes = require("./modules/dashboard/dashboard.routes");

const app = express();

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || NODE_ENV === "development") {
      return callback(null, true);
    }
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

// ── Core Middleware ───────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple request logger in development
if (NODE_ENV === "development") {
  app.use((req, _res, next) => {
    console.log(`→ ${req.method} ${req.originalUrl}`);
    next();
  });
}

// ── Health Check ──────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({
    success: true,
    message: "Finance Dashboard API is running",
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/records", recordRoutes);
app.use("/api/dashboard", dashboardRoutes);

// ── Error Handling ────────────────────────────────────────────────────────────
app.use(notFoundHandler);   // 404 for unknown routes
app.use(errorHandler);      // Global error handler

// ── Start Server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 Finance Dashboard API running on http://localhost:${PORT}`);
  console.log(`   Environment : ${NODE_ENV}`);
  console.log(`   Health check: http://localhost:${PORT}/health\n`);
});

module.exports = app; // for testing
