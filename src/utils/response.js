/**
 * Response Helpers
 * Standardizes all API responses for consistency
 */

/**
 * sendSuccess — sends a 2xx JSON response
 * @param {object} res - Express response object
 * @param {number} statusCode - HTTP status code (default 200)
 * @param {string} message - Human-readable message
 * @param {any} data - Response payload
 * @param {object} meta - Optional pagination/extra metadata
 */
function sendSuccess(res, statusCode = 200, message = "Success", data = null, meta = null) {
  const body = { success: true, message };
  if (data !== null) body.data = data;
  if (meta !== null) body.meta = meta;
  return res.status(statusCode).json(body);
}

/**
 * sendError — sends a 4xx/5xx JSON response
 * @param {object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Human-readable error message
 * @param {any} errors - Optional error details
 */
function sendError(res, statusCode = 400, message = "An error occurred", errors = null) {
  const body = { success: false, message };
  if (errors !== null) body.errors = errors;
  return res.status(statusCode).json(body);
}

/**
 * buildPaginationMeta — helper for paginated responses
 */
function buildPaginationMeta(total, page, limit) {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNext: page * limit < total,
    hasPrev: page > 1,
  };
}

module.exports = { sendSuccess, sendError, buildPaginationMeta };
