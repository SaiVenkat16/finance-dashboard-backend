/**
 * Auth Service
 * Business logic for user registration and login
 */

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../../config/prisma");
const { JWT_SECRET, JWT_EXPIRES_IN, BCRYPT_ROUNDS } = require("../../config/env");

/**
 * register — creates a new user account.
 * Only ADMINs can create users with specific roles via the /users endpoint.
 * This endpoint creates VIEWER accounts by default (self-registration).
 */
async function register({ email, password, name, role }) {
  // Check if email already exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const err = new Error("An account with this email already exists.");
    err.statusCode = 409;
    throw err;
  }

  const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role: role || "VIEWER", // Default role is VIEWER
    },
    select: { id: true, email: true, name: true, role: true, status: true, createdAt: true },
  });

  const token = generateToken(user.id);

  return { user, token };
}

/**
 * login — verifies credentials and returns a JWT token.
 */
async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });

  // Use same error for both "user not found" and "wrong password" to prevent enumeration
  const invalidCredentials = () => {
    const err = new Error("Invalid email or password.");
    err.statusCode = 401;
    return err;
  };

  if (!user) throw invalidCredentials();

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) throw invalidCredentials();

  if (user.status === "INACTIVE") {
    const err = new Error("Your account has been deactivated. Contact an administrator.");
    err.statusCode = 403;
    throw err;
  }

  const token = generateToken(user.id);

  const { password: _, ...safeUser } = user;
  return { user: safeUser, token };
}

/**
 * generateToken — signs and returns a JWT for the given userId.
 */
function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

module.exports = { register, login };
