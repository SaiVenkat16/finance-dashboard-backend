/**
 * Records Controller
 * Handles HTTP request/response for financial record endpoints
 */

const recordsService = require("./records.service");
const { sendSuccess, sendError, buildPaginationMeta } = require("../../utils/response");
const { createRecordSchema, updateRecordSchema, recordQuerySchema, validate } = require("../../utils/validation");

/**
 * GET /api/records
 * All authenticated roles can view records
 */
async function listRecords(req, res, next) {
  try {
    const query = validate(recordQuerySchema, req.query);
    const { records, total } = await recordsService.getRecords(query);
    const meta = buildPaginationMeta(total, query.page, query.limit);
    return sendSuccess(res, 200, "Records retrieved.", records, meta);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/records/:id
 * All authenticated roles can view a single record
 */
async function getRecord(req, res, next) {
  try {
    const record = await recordsService.getRecordById(req.params.id);
    return sendSuccess(res, 200, "Record retrieved.", record);
  } catch (err) {
    if (err.statusCode) return sendError(res, err.statusCode, err.message);
    next(err);
  }
}

/**
 * POST /api/records
 * ANALYST and ADMIN can create records
 */
async function createRecord(req, res, next) {
  try {
    const data = validate(createRecordSchema, req.body);
    const record = await recordsService.createRecord(data, req.user.id);
    return sendSuccess(res, 201, "Record created successfully.", record);
  } catch (err) {
    if (err.statusCode) return sendError(res, err.statusCode, err.message);
    next(err);
  }
}

/**
 * PUT /api/records/:id
 * ANALYST (own records only) and ADMIN (any record) can update
 */
async function updateRecord(req, res, next) {
  try {
    const data = validate(updateRecordSchema, req.body);
    const record = await recordsService.updateRecord(req.params.id, data, req.user);
    return sendSuccess(res, 200, "Record updated successfully.", record);
  } catch (err) {
    if (err.statusCode) return sendError(res, err.statusCode, err.message);
    next(err);
  }
}

/**
 * DELETE /api/records/:id
 * ADMIN only — soft delete
 */
async function deleteRecord(req, res, next) {
  try {
    await recordsService.deleteRecord(req.params.id);
    return sendSuccess(res, 200, "Record deleted successfully.");
  } catch (err) {
    if (err.statusCode) return sendError(res, err.statusCode, err.message);
    next(err);
  }
}

module.exports = { listRecords, getRecord, createRecord, updateRecord, deleteRecord };
