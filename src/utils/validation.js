/**
 * Zod Validation Schemas
 * Centralizes all input validation rules
 */

const { z } = require("zod");

// ── Auth ──────────────────────────────────────────────────────────────────────

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  role: z.enum(["VIEWER", "ANALYST", "ADMIN"]).optional(),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// ── Users ─────────────────────────────────────────────────────────────────────

const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  role: z.enum(["VIEWER", "ANALYST", "ADMIN"]).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

const updateUserStatusSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE"], {
    required_error: "Status must be ACTIVE or INACTIVE",
  }),
});

// ── Financial Records ─────────────────────────────────────────────────────────

const createRecordSchema = z.object({
  amount: z
    .number({ required_error: "Amount is required", invalid_type_error: "Amount must be a number" })
    .positive("Amount must be greater than 0"),
  type: z.enum(["INCOME", "EXPENSE"], { required_error: "Type must be INCOME or EXPENSE" }),
  category: z.string().min(1, "Category is required").max(100),
  date: z.coerce.date({ required_error: "Date is required" }),
  notes: z.string().max(500).optional(),
});

const updateRecordSchema = z.object({
  amount: z.number().positive("Amount must be greater than 0").optional(),
  type: z.enum(["INCOME", "EXPENSE"]).optional(),
  category: z.string().min(1).max(100).optional(),
  date: z.coerce.date().optional(),
  notes: z.string().max(500).optional().nullable(),
});

// Query filters for listing records
const recordQuerySchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]).optional(),
  category: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(["date", "amount", "createdAt"]).default("date"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// ── Validate helper ───────────────────────────────────────────────────────────

/**
 * validate(schema, data) — parses and returns cleaned data or throws ZodError
 */
function validate(schema, data) {
  return schema.parse(data);
}

module.exports = {
  registerSchema,
  loginSchema,
  updateUserSchema,
  updateUserStatusSchema,
  createRecordSchema,
  updateRecordSchema,
  recordQuerySchema,
  validate,
};
