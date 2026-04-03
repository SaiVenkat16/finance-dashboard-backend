/**
 * Users Service
 * Business logic for user management (Admin-only operations)
 */

const bcrypt = require("bcryptjs");
const prisma = require("../../config/prisma");
const { BCRYPT_ROUNDS } = require("../../config/env");

// Fields to always exclude from user responses
const SAFE_USER_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  status: true,
  createdAt: true,
  updatedAt: true,
};

/**
 * getAllUsers — returns paginated list of all users
 */
async function getAllUsers({ page = 1, limit = 20, role, status } = {}) {
  const skip = (page - 1) * limit;

  const where = {};
  if (role) where.role = role;
  if (status) where.status = status;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: SAFE_USER_SELECT,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total };
}

/**
 * getUserById — returns a single user by ID
 */
async function getUserById(id) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: SAFE_USER_SELECT,
  });

  if (!user) {
    const err = new Error("User not found.");
    err.statusCode = 404;
    throw err;
  }

  return user;
}

/**
 * createUser — admin creates a user with a specified role
 */
async function createUser({ email, password, name, role }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const err = new Error("A user with this email already exists.");
    err.statusCode = 409;
    throw err;
  }

  const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

  return prisma.user.create({
    data: { email, password: hashedPassword, name, role: role || "VIEWER" },
    select: SAFE_USER_SELECT,
  });
}

/**
 * updateUser — updates user name, email, or role
 */
async function updateUser(id, updates) {
  // Check user exists first
  await getUserById(id);

  // If email is changing, check uniqueness
  if (updates.email) {
    const existing = await prisma.user.findFirst({
      where: { email: updates.email, NOT: { id } },
    });
    if (existing) {
      const err = new Error("This email is already in use by another account.");
      err.statusCode = 409;
      throw err;
    }
  }

  return prisma.user.update({
    where: { id },
    data: updates,
    select: SAFE_USER_SELECT,
  });
}

/**
 * updateUserStatus — activates or deactivates a user
 */
async function updateUserStatus(id, status, requestingUserId) {
  // Prevent admin from deactivating themselves
  if (id === requestingUserId && status === "INACTIVE") {
    const err = new Error("You cannot deactivate your own account.");
    err.statusCode = 400;
    throw err;
  }

  await getUserById(id);

  return prisma.user.update({
    where: { id },
    data: { status },
    select: SAFE_USER_SELECT,
  });
}

/**
 * deleteUser — permanently deletes a user (Admin only)
 */
async function deleteUser(id, requestingUserId) {
  if (id === requestingUserId) {
    const err = new Error("You cannot delete your own account.");
    err.statusCode = 400;
    throw err;
  }

  await getUserById(id);

  await prisma.user.delete({ where: { id } });
  return { deleted: true };
}

module.exports = { getAllUsers, getUserById, createUser, updateUser, updateUserStatus, deleteUser };
