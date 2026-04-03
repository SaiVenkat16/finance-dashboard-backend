/**
 * Financial Records Service
 * Business logic for creating, reading, updating, and deleting financial entries
 */

const prisma = require("../../config/prisma");

/**
 * getRecords — returns a paginated, filtered list of financial records.
 *
 * Filters: type, category, startDate, endDate
 * Pagination: page, limit
 * Sorting: sortBy (date | amount | createdAt), sortOrder (asc | desc)
 */
async function getRecords({ type, category, startDate, endDate, page = 1, limit = 20, sortBy = "date", sortOrder = "desc" } = {}) {
  const skip = (page - 1) * limit;

  const where = {
    isDeleted: false,
    ...(type && { type }),
    ...(category && { category: { contains: category, mode: "insensitive" } }),
    ...(startDate || endDate
      ? {
          date: {
            ...(startDate && { gte: startDate }),
            ...(endDate && { lte: endDate }),
          },
        }
      : {}),
  };

  const [records, total] = await Promise.all([
    prisma.financialRecord.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.financialRecord.count({ where }),
  ]);

  return { records, total };
}

/**
 * getRecordById — fetches a single non-deleted record by ID
 */
async function getRecordById(id) {
  const record = await prisma.financialRecord.findFirst({
    where: { id, isDeleted: false },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  if (!record) {
    const err = new Error("Financial record not found.");
    err.statusCode = 404;
    throw err;
  }

  return record;
}

/**
 * createRecord — creates a new financial record.
 * Linked to the authenticated user who created it.
 */
async function createRecord(data, userId) {
  return prisma.financialRecord.create({
    data: { ...data, userId },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });
}

/**
 * updateRecord — updates a record.
 * ADMINs can update any record; ANALYSTs can only update their own.
 */
async function updateRecord(id, updates, requestingUser) {
  const record = await getRecordById(id);

  // Ownership check for non-admins
  if (requestingUser.role !== "ADMIN" && record.userId !== requestingUser.id) {
    const err = new Error("You can only update your own records.");
    err.statusCode = 403;
    throw err;
  }

  return prisma.financialRecord.update({
    where: { id },
    data: updates,
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });
}

/**
 * deleteRecord — soft-deletes a record (sets isDeleted = true).
 * Only ADMINs can delete records.
 */
async function deleteRecord(id) {
  await getRecordById(id);

  return prisma.financialRecord.update({
    where: { id },
    data: { isDeleted: true },
    select: { id: true, isDeleted: true },
  });
}

module.exports = { getRecords, getRecordById, createRecord, updateRecord, deleteRecord };
