/**
 * Seed Script — Creates demo users and sample financial records
 * Run: node prisma/seed.js
 */

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ── Create Users ─────────────────────────────────────────────────────────
  const hashedPassword = await bcrypt.hash("Password123!", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@finance.com" },
    update: {},
    create: {
      email: "admin@finance.com",
      password: hashedPassword,
      name: "Admin User",
      role: "ADMIN",
      status: "ACTIVE",
    },
  });

  const analyst = await prisma.user.upsert({
    where: { email: "analyst@finance.com" },
    update: {},
    create: {
      email: "analyst@finance.com",
      password: hashedPassword,
      name: "Analyst User",
      role: "ANALYST",
      status: "ACTIVE",
    },
  });

  const viewer = await prisma.user.upsert({
    where: { email: "viewer@finance.com" },
    update: {},
    create: {
      email: "viewer@finance.com",
      password: hashedPassword,
      name: "Viewer User",
      role: "VIEWER",
      status: "ACTIVE",
    },
  });

  console.log("✅ Created users:", { admin: admin.email, analyst: analyst.email, viewer: viewer.email });

  // ── Create Sample Financial Records ──────────────────────────────────────
  const categories = ["Salary", "Freelance", "Rent", "Groceries", "Utilities", "Entertainment", "Healthcare", "Transport"];
  const records = [];

  // Generate 3 months of sample data
  for (let month = 0; month < 3; month++) {
    const date = new Date();
    date.setMonth(date.getMonth() - month);

    // Income records
    records.push({
      amount: 5000 + Math.random() * 2000,
      type: "INCOME",
      category: "Salary",
      date: new Date(date.getFullYear(), date.getMonth(), 1),
      notes: "Monthly salary",
      userId: admin.id,
    });

    records.push({
      amount: 800 + Math.random() * 500,
      type: "INCOME",
      category: "Freelance",
      date: new Date(date.getFullYear(), date.getMonth(), 15),
      notes: "Freelance project",
      userId: analyst.id,
    });

    // Expense records
    const expenses = [
      { category: "Rent", amount: 1500, notes: "Monthly rent" },
      { category: "Groceries", amount: 300 + Math.random() * 100, notes: "Weekly groceries" },
      { category: "Utilities", amount: 150 + Math.random() * 50, notes: "Electricity & water" },
      { category: "Entertainment", amount: 100 + Math.random() * 100, notes: "Netflix, dining" },
      { category: "Transport", amount: 200 + Math.random() * 100, notes: "Fuel & commute" },
    ];

    expenses.forEach((exp, i) => {
      records.push({
        amount: exp.amount,
        type: "EXPENSE",
        category: exp.category,
        date: new Date(date.getFullYear(), date.getMonth(), 5 + i * 4),
        notes: exp.notes,
        userId: admin.id,
      });
    });
  }

  await prisma.financialRecord.deleteMany({});
  await prisma.financialRecord.createMany({ data: records });

  console.log(`✅ Created ${records.length} financial records`);
  console.log("\n🎉 Seeding complete!");
  console.log("\nDemo credentials (password: Password123!):");
  console.log("  Admin   → admin@finance.com");
  console.log("  Analyst → analyst@finance.com");
  console.log("  Viewer  → viewer@finance.com");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
