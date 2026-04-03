/**
 * Global Error Handler Middleware
 * Catches all unhandled errors and returns consistent JSON responses
 */

const { ZodError } = require("zod");

function errorHandler(err, req, res, next) {
  // Zod validation errors — convert to readable messages
  if (err instanceof ZodError) {
    const errors = err.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  // Prisma known errors
  if (err.code === "P2002") {
    // Unique constraint violation
    const field = err.meta?.target?.[0] || "field";
    return res.status(409).json({
      success: false,
      message: `A record with this ${field} already exists.`,
    });
  }

  if (err.code === "P2025") {
    // Record not found
    return res.status(404).json({
      success: false,
      message: "Record not found.",
    });
  }

  // Log unexpected errors
  if (process.env.NODE_ENV !== "test") {
    console.error("❌ Unhandled error:", err);
  }

  // Generic server error
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === "production"
      ? "An unexpected error occurred."
      : err.message || "Internal server error",
  });
}

// Catch-all for unknown routes
function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found.`,
  });
}

module.exports = { errorHandler, notFoundHandler };
