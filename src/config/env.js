/**
 * Environment Configuration
 * Centralizes all env variable access with defaults and validation
 */

require("dotenv").config();

const config = {
  // Server
  PORT: parseInt(process.env.PORT || "3000", 10),
  NODE_ENV: process.env.NODE_ENV || "development",

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || "change-this-secret-in-production",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",

  // Database
  DATABASE_URL: process.env.DATABASE_URL,

  // Bcrypt
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS || "10", 10),
};

// Warn in development if JWT secret is default
if (config.NODE_ENV === "production" && config.JWT_SECRET === "change-this-secret-in-production") {
  console.warn("⚠️  WARNING: Using default JWT_SECRET in production. Please set a secure secret.");
}

module.exports = config;
