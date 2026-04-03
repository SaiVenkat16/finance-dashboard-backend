# Finance Dashboard Backend API

A production-ready RESTful backend for a Finance Dashboard system, built with **Node.js + Express**, **PostgreSQL**, and **JWT authentication**. Implements role-based access control (RBAC), financial record management, and aggregated analytics APIs.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Demo Credentials](#demo-credentials)
- [Role Permissions](#role-permissions)
- [API Reference](#api-reference)
- [Data Models](#data-models)
- [Design Decisions](#design-decisions)
- [Assumptions](#assumptions)

---

## Tech Stack

| Layer | Technology | Reason |
|---|---|---|
| Runtime | Node.js 18+ | Widely adopted, great async support |
| Framework | Express.js | Minimal, flexible, production-proven |
| Database | PostgreSQL | Relational integrity suits financial data |
| ORM | Prisma | Type-safe queries, easy migrations, great DX |
| Authentication | JWT (jsonwebtoken) | Stateless, scalable auth |
| Password Hashing | bcryptjs | Industry standard, configurable rounds |
| Validation | Zod | Schema-first, runtime type safety, great errors |

---

## Project Structure

```
finance-dashboard-backend/
├── prisma/
│   ├── schema.prisma        # Database schema — Users & FinancialRecords
│   └── seed.js              # Demo data seeder (3 users, 3 months of records)
│
├── src/
│   ├── app.js               # Express app entry point, middleware setup, route mounting
│   │
│   ├── config/
│   │   ├── env.js           # Centralized env variable access with defaults
│   │   └── prisma.js        # Prisma client singleton
│   │
│   ├── middleware/
│   │   ├── auth.middleware.js   # JWT verification → attaches req.user
│   │   ├── rbac.middleware.js   # requireRole() and requireMinRole() guards
│   │   └── error.middleware.js  # Global error handler + 404 handler
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.routes.js      # POST /register, POST /login, GET /me
│   │   │   ├── auth.controller.js  # Request/response handling
│   │   │   └── auth.service.js     # Business logic: hashing, JWT signing
│   │   │
│   │   ├── users/
│   │   │   ├── users.routes.js     # Full CRUD + status management
│   │   │   ├── users.controller.js
│   │   │   └── users.service.js    # User management logic (Admin only)
│   │   │
│   │   ├── records/
│   │   │   ├── records.routes.js   # CRUD + filtering + pagination
│   │   │   ├── records.controller.js
│   │   │   └── records.service.js  # Financial record logic, ownership checks
│   │   │
│   │   └── dashboard/
│   │       ├── dashboard.routes.js  # Summary, categories, trends, recent
│   │       ├── dashboard.controller.js
│   │       └── dashboard.service.js # Aggregation logic for analytics
│   │
│   └── utils/
│       ├── response.js      # Standardized JSON response helpers
│       └── validation.js    # All Zod schemas in one place
│
├── .env.example             # Environment variable template
├── package.json
└── README.md
```

**Architecture Pattern:** Each module follows `routes → controller → service`
- **Routes**: URL mapping and middleware attachment only
- **Controller**: Parses request, calls service, sends response
- **Service**: All business logic and database calls

---

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database running

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
```

Edit `.env`:
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/finance_dashboard"
JWT_SECRET=your-secret-key-here
PORT=3000
NODE_ENV=development
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=10
```

### 3. Setup database
```bash
npm run db:generate    # Generate Prisma client
npm run db:push        # Create tables in PostgreSQL
npm run db:seed        # Load demo users and records
```

### 4. Start the server
```bash
npm run dev    # Development with auto-reload
npm start      # Production
```

### 5. Verify
```
GET http://localhost:3000/health
```
```json
{ "success": true, "message": "Finance Dashboard API is running" }
```

---

## Demo Credentials

After running `npm run db:seed`, these accounts are available:

| Email | Password | Role |
|---|---|---|
| admin@finance.com | Password123! | ADMIN |
| analyst@finance.com | Password123! | ANALYST |
| viewer@finance.com | Password123! | VIEWER |

---

## Role Permissions

| Action | VIEWER | ANALYST | ADMIN |
|---|:---:|:---:|:---:|
| Login & view own profile | ✅ | ✅ | ✅ |
| View financial records | ✅ | ✅ | ✅ |
| View dashboard summary | ✅ | ✅ | ✅ |
| View category breakdown | ✅ | ✅ | ✅ |
| View recent activity | ✅ | ✅ | ✅ |
| View monthly/weekly trends | ❌ | ✅ | ✅ |
| Create financial records | ❌ | ✅ | ✅ |
| Update own records | ❌ | ✅ | ✅ |
| Update any record | ❌ | ❌ | ✅ |
| Delete records (soft) | ❌ | ❌ | ✅ |
| View all users | ❌ | ❌ | ✅ |
| Create/update/delete users | ❌ | ❌ | ✅ |
| Change user status | ❌ | ❌ | ✅ |

**Implementation:** Two middleware helpers in `rbac.middleware.js`:
- `requireRole("ADMIN")` — exact role match
- `requireMinRole("ANALYST")` — role priority check (ANALYST or higher)

---

## API Reference

All protected routes require: `Authorization: Bearer <token>`

All responses follow this envelope:
```json
{
  "success": true | false,
  "message": "Human readable message",
  "data": { },
  "meta": { "page": 1, "total": 50, "totalPages": 3 }
}
```

---

### Authentication — `/api/auth`

#### POST `/api/auth/register` — Public
Create a new VIEWER account.
```json
// Request
{ "email": "user@example.com", "password": "Password123!", "name": "John Doe" }

// Response 201
{ "success": true, "data": { "user": {...}, "token": "eyJ..." } }
```

#### POST `/api/auth/login` — Public
```json
// Request
{ "email": "admin@finance.com", "password": "Password123!" }

// Response 200
{ "success": true, "data": { "user": { "id":"...", "role":"ADMIN" }, "token": "eyJ..." } }
```

#### GET `/api/auth/me` — All roles
Returns current user's profile.

---

### Users — `/api/users` — ADMIN only

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/users` | List all users — query: `?page=1&limit=20&role=ANALYST&status=ACTIVE` |
| GET | `/api/users/:id` | Get single user |
| POST | `/api/users` | Create user with any role |
| PUT | `/api/users/:id` | Update name, email, or role |
| PATCH | `/api/users/:id/status` | Activate or deactivate |
| DELETE | `/api/users/:id` | Permanently delete |

```json
// POST /api/users — Request
{ "name": "New User", "email": "new@example.com", "password": "Pass123!", "role": "ANALYST" }

// PATCH /api/users/:id/status — Request
{ "status": "INACTIVE" }
```

---

### Financial Records — `/api/records`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/records` | All roles | Paginated list with filters |
| GET | `/api/records/:id` | All roles | Single record |
| POST | `/api/records` | ANALYST, ADMIN | Create record |
| PUT | `/api/records/:id` | ANALYST (own), ADMIN | Update record |
| DELETE | `/api/records/:id` | ADMIN only | Soft delete |

**Query parameters for GET `/api/records`:**
```
?type=INCOME          # or EXPENSE
?category=Salary      # partial match, case-insensitive
?startDate=2026-01-01
?endDate=2026-03-31
?page=1&limit=20
?sortBy=date          # date | amount | createdAt
?sortOrder=desc       # asc | desc
```

**Create/Update record body:**
```json
{
  "amount": 5000,
  "type": "INCOME",
  "category": "Salary",
  "date": "2026-04-01",
  "notes": "April salary"
}
```

---

### Dashboard Analytics — `/api/dashboard`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/dashboard/summary` | All roles | Total income, expenses, net balance |
| GET | `/api/dashboard/categories` | All roles | Breakdown by category and type |
| GET | `/api/dashboard/recent` | All roles | Recent N records — `?limit=10` |
| GET | `/api/dashboard/trends/monthly` | ANALYST, ADMIN | Monthly trends — `?months=6` |
| GET | `/api/dashboard/trends/weekly` | ANALYST, ADMIN | Weekly trends — `?weeks=4` |

**Summary response:**
```json
{
  "data": {
    "totalIncome": 18450.00,
    "totalExpenses": 9300.00,
    "netBalance": 9150.00,
    "recordCount": 24
  }
}
```

**Monthly trends response:**
```json
{
  "data": [
    { "month": "2026-01", "income": 5800.00, "expenses": 3200.00, "net": 2600.00 },
    { "month": "2026-02", "income": 6100.00, "expenses": 2900.00, "net": 3200.00 }
  ]
}
```

---

## Data Models

### User
```
id         String    (CUID)
email      String    (unique)
password   String    (bcrypt hashed)
name       String
role       Enum      VIEWER | ANALYST | ADMIN
status     Enum      ACTIVE | INACTIVE
createdAt  DateTime
updatedAt  DateTime
```

### FinancialRecord
```
id         String    (CUID)
amount     Float
type       Enum      INCOME | EXPENSE
category   String
date       DateTime
notes      String?   (optional)
isDeleted  Boolean   (soft delete flag, default false)
createdAt  DateTime
updatedAt  DateTime
userId     String    (FK → User)
```

---

## Error Responses

All errors return consistent JSON:
```json
{ "success": false, "message": "Human readable message" }
```

Validation errors include field-level details:
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "amount", "message": "Amount must be greater than 0" },
    { "field": "date", "message": "Required" }
  ]
}
```

**HTTP Status Codes:**
- `200` Success
- `201` Created
- `400` Validation error or bad request
- `401` Not authenticated / expired token
- `403` Authenticated but insufficient permissions
- `404` Resource not found
- `409` Conflict (duplicate email)
- `500` Unexpected server error

---

## Design Decisions

### 1. Modular Architecture (Routes → Controller → Service)
Each module is completely self-contained. Adding a new feature means creating a new folder with three files. This makes the codebase easy to navigate, test, and scale.

### 2. Soft Delete for Financial Records
Records are never permanently deleted — `isDeleted` is set to `true`. Financial data should always be auditable. Only ADMINs can soft-delete, and deleted records are invisible in all queries.

### 3. RBAC with Priority Levels
Instead of hardcoding role checks everywhere, `requireMinRole("ANALYST")` allows any role at or above ANALYST. This means adding a new role in the future only requires updating the priority map in one place.

### 4. Analyst Ownership Enforcement
ANALYSTs can only update their own records. The ownership check is in the service layer (not just the route), so it cannot be bypassed regardless of how the endpoint is called.

### 5. Consistent Response Envelope
Every response — success or error — uses `{ success, message, data, meta }`. The frontend always knows what to expect and never has to handle inconsistent shapes.

### 6. Zod at the Controller Boundary
Validation happens before any business logic runs. If a request is invalid, it fails fast with clear field-level messages. The service layer can trust its inputs are always valid.

### 7. JWT Stateless Auth with Live Status Check
Even though JWTs are stateless, the auth middleware fetches the user from the database on every request. This ensures deactivated accounts are blocked immediately, without waiting for the token to expire.

---

## Assumptions

1. **Self-registration creates VIEWER accounts only.** To create ANALYST or ADMIN users, an ADMIN must use `POST /api/users`.
2. **Financial records are shared** — all authenticated users can see all non-deleted records regardless of who created them.
3. **ANALYSTs** can create records and update their own. ADMINs can update or delete any record.
4. **Soft delete is permanent** from a user perspective — there is no "restore" endpoint (can be added as an enhancement).
5. **Pagination defaults** are page=1, limit=20 for all list endpoints.
6. **Amounts are stored as Float** — for a real financial system, a `Decimal` type would be preferred to avoid floating-point precision issues.

---

## Optional Enhancements (Not Implemented)

- Rate limiting (express-rate-limit)
- Refresh token rotation
- Audit log table (who changed what, when)
- Redis caching for dashboard summary
- Full-text search on records notes
- Unit and integration tests (Jest + Supertest)
- OpenAPI / Swagger documentation
