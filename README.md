# EventSpark Hall – Seminar Hall Booking Management System

> **Course:** Backend Development Fundamentals (BDF)  
> **Theme:** 14 – Seminar Halls  
> **Group ID:** ST-AIDE2A-G14  
> **Technologies:** Node.js, Express.js, SQLite (better-sqlite3), Jest, Supertest, Postman

---

## 1. Project Introduction

**EventSpark Hall** is a dedicated, production-grade RESTful backend system built to manage college seminar hall reservations, registered event organisers, and booking schedules. Built strictly as an API service without frontend clutter, it provides deterministic scheduling, data integrity enforcement, and server-controlled automatic sequence generation.

---

## 2. Problem Statement

Historically, seminar halls across college campus blocks were booked informally through manual emails and paper forms. Because bookings lacked centralized synchronization:
- Different student clubs frequently booked the same seminar hall on the same date.
- Conflicts were only discovered on the event day, leading to last-minute cancellations, wasted logistics, and scheduling chaos.
- No historical audit trail or relational link existed between organisers, venues, and schedules.

---

## 3. Project Objectives

- **Relational Integrity:** Establish a relational SQLite database connecting organisers, seminar halls, and bookings with strict foreign key constraints.
- **Conflict Prevention:** Guarantee at both the application and database levels that no two bookings can ever occupy the same hall on the same calendar date.
- **Automated Hall Code Generation:** Eliminate client error and tampering by generating guaranteed, sequential, unique hall identifiers (`HAL-0001`, `HAL-0002`, ...) using atomic SQLite transactions.
- **Consolidated Join Analytics:** Provide a dedicated SQL `INNER JOIN` endpoint (`/bookings/details`) to report full event details across all three relational tables in a single query.
- **Clean REST Architecture:** Adhere to modular software architecture with clean separation between routing, business controllers, database access, validation, and centralized error handling.

---

## 4. Technology Stack

- **Runtime:** Node.js (v18+)
- **Web Framework:** Express.js 5
- **Database Engine:** SQLite 3 (via `better-sqlite3`)
- **Testing Suite:** Jest & Supertest
- **Security & Utilities:** `cors`, `dotenv`
- **API Client:** Postman (v2.1.0 collection format)

---

## 5. Database Schema

The database consists of three core relational tables and one dedicated sequence tracker table. SQLite foreign keys are explicitly enforced via `PRAGMA foreign_keys = ON;`.

```
+--------------------+        +--------------------+        +--------------------+
|     organisers     |        |      bookings      |        |       halls        |
+--------------------+        +--------------------+        +--------------------+
| id (PK, AI)        |<---+   | id (PK, AI)        |   +--->| id (PK, AI)        |
| name (TEXT)        |    +---| organiser_id (FK)  |   |    | code (TEXT, UNIQUE)|
| email (TEXT, UNIQUE)        | hall_id (FK)       |---+    | name (TEXT)        |
| created_at (DATETIME)       | booking_date (TEXT)|        | building (TEXT)    |
+--------------------+        | created_at (DATETIME)       | created_at (DATETIME)
                              +--------------------+        | updated_at (DATETIME)
                              | UNIQUE(hall_id,    |        +--------------------+
                              |   booking_date)    |
                              +--------------------+
```

### Table Definitions

#### 1. `organisers`
- `id`: `INTEGER PRIMARY KEY AUTOINCREMENT`
- `name`: `TEXT NOT NULL`
- `email`: `TEXT NOT NULL UNIQUE`
- `created_at`: `DATETIME DEFAULT CURRENT_TIMESTAMP`

#### 2. `halls`
- `id`: `INTEGER PRIMARY KEY AUTOINCREMENT`
- `code`: `TEXT NOT NULL UNIQUE` (server-generated, e.g., `HAL-0001`)
- `name`: `TEXT NOT NULL`
- `building`: `TEXT NOT NULL`
- `created_at`: `DATETIME DEFAULT CURRENT_TIMESTAMP`
- `updated_at`: `DATETIME DEFAULT CURRENT_TIMESTAMP`

#### 3. `bookings`
- `id`: `INTEGER PRIMARY KEY AUTOINCREMENT`
- `organiser_id`: `INTEGER NOT NULL` (Foreign Key referencing `organisers(id)` on delete restrict)
- `hall_id`: `INTEGER NOT NULL` (Foreign Key referencing `halls(id)` on delete restrict)
- `booking_date`: `TEXT NOT NULL` (Format: `YYYY-MM-DD`)
- `created_at`: `DATETIME DEFAULT CURRENT_TIMESTAMP`
- **Constraint:** `UNIQUE (hall_id, booking_date)`

#### 4. `hall_sequence`
- `id`: `INTEGER PRIMARY KEY CHECK (id = 1)`
- `last_number`: `INTEGER NOT NULL DEFAULT 0`
- Tracks the monotonic sequence counter to guarantee sequential generation even if halls are deleted.

---

## 6. Project Folder Structure

```
eventspark-hall/
│
├── config/
│   └── db.js                        # SQLite connection, FK pragma & schema initialization
│
├── controllers/
│   ├── hallController.js            # Hall CRUD, building search & sequence generator
│   ├── organiserController.js       # Organiser CRUD & duplicate email checks
│   └── bookingController.js         # Booking CRUD, date conflict logic & SQL JOIN
│
├── routes/
│   ├── hallRoutes.js                # Hall route mappings
│   ├── organiserRoutes.js           # Organiser route mappings
│   └── bookingRoutes.js             # Booking route mappings (including /details)
│
├── middleware/
│   ├── errorHandler.js              # Centralized error handler & status mapper
│   ├── validateHall.js              # Request validation for hall endpoints
│   ├── validateOrganiser.js         # Request validation for organiser endpoints
│   ├── validateBooking.js           # Request validation for booking endpoints
│   └── notFound.js                  # 404 handler for unknown routes
│
├── database/
│   ├── schema.sql                   # DDL table creation, constraints & indexes
│   └── eventspark.db                # SQLite database file (created on boot)
│
├── tests/
│   ├── server.test.js               # Health check, 404 & DB verification
│   ├── halls.test.js                # Complete Hall CRUD and validation tests
│   ├── organisers.test.js           # Complete Organiser CRUD and email tests
│   ├── bookings.test.js             # Booking CRUD, conflicts & JOIN tests
│   └── twist.test.js                # The 3 mandatory twist tests + tamper protection
│
├── postman/
│   └── EventSpark.postman_collection.json # Official Postman collection (v2.1.0)
│
├── app.js                           # Express application & global middleware setup
├── server.js                        # Server entry point & graceful shutdown
├── package.json                     # Node.js dependencies & scripts
├── .gitignore                       # Git ignore configuration
├── .env.example                     # Environment template
└── README.md                        # Complete project documentation
```

---

## 7. API Documentation

### Base URL
`http://localhost:3000`

### Health Check
- `GET /health` – Returns server operational status, uptime, and timestamp.

### Seminar Halls (`/halls`)
| Method | Endpoint | Description | Status Codes |
|---|---|---|---|
| `GET` | `/halls` | Get all halls (supports `?building=...`) | `200` |
| `GET` | `/halls/:id` | Get a single hall by ID | `200`, `400`, `404` |
| `POST` | `/halls` | Create a new hall (code generated by server) | `201`, `400` |
| `PUT` | `/halls/:id` | Update hall name and building (preserves code) | `200`, `400`, `404` |
| `DELETE` | `/halls/:id` | Delete a hall (rejects if bookings exist) | `200`, `400`, `404`, `409` |

### Organisers (`/organisers`)
| Method | Endpoint | Description | Status Codes |
|---|---|---|---|
| `GET` | `/organisers` | Get all organisers | `200` |
| `GET` | `/organisers/:id` | Get a single organiser by ID | `200`, `400`, `404` |
| `POST` | `/organisers` | Register an organiser (unique email enforced) | `201`, `400`, `409` |
| `PUT` | `/organisers/:id` | Update organiser name or email | `200`, `400`, `404`, `409` |
| `DELETE` | `/organisers/:id` | Delete an organiser (rejects if bookings exist)| `200`, `400`, `404`, `409` |

### Bookings (`/bookings`)
| Method | Endpoint | Description | Status Codes |
|---|---|---|---|
| `GET` | `/bookings` | Get all bookings | `200` |
| `GET` | `/bookings/details` | **JOIN Endpoint**: Returns combined booking, organiser & hall info | `200` |
| `GET` | `/bookings/:id` | Get a single booking by ID | `200`, `400`, `404` |
| `POST` | `/bookings` | Create a booking (validates FK & prevents date clash) | `201`, `400`, `404`, `409` |
| `PUT` | `/bookings/:id` | Update booking date, organiser or hall | `200`, `400`, `404`, `409` |
| `DELETE` | `/bookings/:id` | Cancel/delete a booking | `200`, `400`, `404` |

---

## 8. Request and Response Examples

### 1. Create a Seminar Hall
**Request:** `POST /halls`
```json
{
  "name": "Main Seminar Hall",
  "building": "Block A"
}
```
**Response:** `HTTP 201 Created`
```json
{
  "id": 1,
  "code": "HAL-0001",
  "name": "Main Seminar Hall",
  "building": "Block A",
  "created_at": "2026-11-14T05:00:00.000Z",
  "updated_at": "2026-11-14T05:00:00.000Z"
}
```

### 2. Search Halls by Building
**Request:** `GET /halls?building=Block%20A`
**Response:** `HTTP 200 OK`
```json
[
  {
    "id": 1,
    "code": "HAL-0001",
    "name": "Main Seminar Hall",
    "building": "Block A",
    "created_at": "2026-11-14T05:00:00.000Z",
    "updated_at": "2026-11-14T05:00:00.000Z"
  }
]
```

### 3. Register an Organiser
**Request:** `POST /organisers`
```json
{
  "name": "Abhilash Reddy",
  "email": "abhilash@example.com"
}
```
**Response:** `HTTP 201 Created`
```json
{
  "id": 1,
  "name": "Abhilash Reddy",
  "email": "abhilash@example.com",
  "created_at": "2026-11-14T05:00:00.000Z"
}
```

### 4. Create a Booking
**Request:** `POST /bookings`
```json
{
  "organiser_id": 1,
  "hall_id": 1,
  "booking_date": "2026-11-20"
}
```
**Response:** `HTTP 201 Created`
```json
{
  "id": 1,
  "organiser_id": 1,
  "hall_id": 1,
  "booking_date": "2026-11-20",
  "created_at": "2026-11-14T05:00:00.000Z"
}
```

### 5. Attempt Duplicate Booking (Conflict)
**Request:** `POST /bookings` (Same hall and same date)
```json
{
  "organiser_id": 2,
  "hall_id": 1,
  "booking_date": "2026-11-20"
}
```
**Response:** `HTTP 409 Conflict`
```json
{
  "error": "Hall is already booked for this date"
}
```

### 6. Booking JOIN Details
**Request:** `GET /bookings/details`
**Response:** `HTTP 200 OK`
```json
[
  {
    "booking_id": 1,
    "booking_date": "2026-11-20",
    "organiser_name": "Abhilash Reddy",
    "organiser_email": "abhilash@example.com",
    "hall_name": "Main Seminar Hall",
    "hall_code": "HAL-0001",
    "building": "Block A"
  }
]
```

---

## 9. HTTP Status Codes Used

- `200 OK`: Request succeeded (GET, PUT, DELETE).
- `201 Created`: Resource successfully created (POST).
- `400 Bad Request`: Input validation failed (missing fields, invalid email format, invalid date string, non-integer ID).
- `404 Not Found`: Targeted resource does not exist.
- `409 Conflict`: Business rule violation (hall already booked on requested date, duplicate email address, deleting hall/organiser with active bookings).
- `500 Internal Server Error`: Unhandled server/database error (masked in production to avoid leaking stack traces).

---

## 10. Automatic Hall Code Generation Explanation

The assignment requires automatic, server-side hall codes formatted as `HAL-0001`, `HAL-0002`, `HAL-0003`, etc.

### Implementation Strategy
1. **Never Rely on Row Count:** Generating codes using `SELECT COUNT(*)` is fatally flawed because deleting row 2 would cause the next created row to reuse `HAL-0002`, creating duplicate codes.
2. **Dedicated Sequence Table (`hall_sequence`):** A dedicated single-row table tracks `last_number`. It only increments forward. When a record is deleted, `last_number` is unaffected.
3. **Atomic SQLite Immediate Transaction:** Code generation and row insertion are wrapped in an immediate transaction (`db.transaction`). In SQLite, this acquires a write lock before generating the code, preventing race conditions or duplicate numbers even under concurrent requests.
4. **Resilience Synchronization:** At startup, `config/db.js` inspects the maximum existing code in `halls` to ensure `hall_sequence` is at least equal to the highest code present.
5. **Client Tamper Proofing:** In `validateHall.js`, any `code` property sent in the request body is stripped. During `PUT /halls/:id`, the SQL query updates only `name`, `building`, and `updated_at`, keeping `code` strictly immutable.

---

## 11. How to Install Dependencies

Clone or navigate to the project directory, then run:

```bash
npm install
```

---

## 12. How to Initialize the Database

The database initializes automatically when the application starts or when tests run. The schema file located at `database/schema.sql` is automatically parsed and applied, enabling foreign keys, creating tables, and building performance indexes.

To reset or start with a clean database at any time, simply delete `database/eventspark.db`. The application will recreate it cleanly on the next run.

---

## 13. How to Start the Server

### Production / Standard Mode
```bash
npm start
```

### Development Mode (with Nodemon Auto-Reload)
```bash
npm run dev
```

The server binds to `0.0.0.0` (accessible locally and across containerized/cloud environments) and listens on port `3000` (or `process.env.PORT`).

---

## 14. How to Run Tests

Run the complete automated test suite (includes 61 tests across 5 suites):

```bash
npm test
```

### Test Coverage Highlights:
- **`tests/twist.test.js`**: Specifically executes the three mandatory assignment twist tests:
  - Test 1: First hall -> `HAL-0001`
  - Test 2: Second hall -> `HAL-0002`
  - Test 3: Updating first hall updates name/building while preserving `HAL-0001`
  - Security tests: Client code tamper override prevention & sequence retention on deletion.
- **`tests/halls.test.js`**: Hall CRUD, building search, 400 validation, 404 handling, and 409 protection.
- **`tests/organisers.test.js`**: Organiser CRUD, email validation regex, duplicate email prevention.
- **`tests/bookings.test.js`**: Booking CRUD, conflict prevention, foreign key checks, and the SQL `INNER JOIN` `/bookings/details` test.
- **`tests/server.test.js`**: `/health`, 404 handler, and foreign key pragma verification.

---

## 15. How to Import the Postman Collection

1. Open Postman.
2. Click **Import** in the upper left corner.
3. Select the file located at:
   `postman/EventSpark.postman_collection.json`
4. The collection **EventSpark Hall API** will appear in your left sidebar, organized into 8 folders:
   1. `Health Check`
   2. `Halls`
   3. `Organisers`
   4. `Bookings`
   5. `Booking Details`
   6. `Automatic Hall Code Tests`
   7. `Validation Tests`
   8. `Search Tests`
5. The collection is pre-configured with the variable `baseUrl = http://localhost:3000`.

---

## 16. Example API Testing Workflow

Follow this step-by-step workflow to test the system manually using curl, Postman, or your browser:

### Step 1: Health Check
```bash
curl http://localhost:3000/health
```

### Step 2: Create First Hall (Expect HAL-0001)
```bash
curl -X POST http://localhost:3000/halls \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"Main Seminar Hall\", \"building\": \"Block A\"}"
```

### Step 3: Create Second Hall (Expect HAL-0002)
```bash
curl -X POST http://localhost:3000/halls \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"Conference Hall\", \"building\": \"Block B\"}"
```

### Step 4: Register an Organiser
```bash
curl -X POST http://localhost:3000/organisers \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"Abhilash Reddy\", \"email\": \"abhilash@example.com\"}"
```

### Step 5: Book Hall 1 on 2026-11-20
```bash
curl -X POST http://localhost:3000/bookings \
  -H "Content-Type: application/json" \
  -d "{\"organiser_id\": 1, \"hall_id\": 1, \"booking_date\": \"2026-11-20\"}"
```

### Step 6: Verify Conflict Prevention (Same Hall, Same Date)
```bash
curl -X POST http://localhost:3000/bookings \
  -H "Content-Type: application/json" \
  -d "{\"organiser_id\": 1, \"hall_id\": 1, \"booking_date\": \"2026-11-20\"}"
```
*Expected: HTTP 409 Conflict with error message.*

### Step 7: View Joined Details (SQL INNER JOIN)
```bash
curl http://localhost:3000/bookings/details
```
*Expected: Complete details showing booking ID, date, organiser name & email, hall name, hall code, and building.*

---

## 17. Assignment Information

- **Theme:** 14 – Seminar Halls
- **Group ID:** ST-AIDE2A-G14
- **Project Name:** EventSpark Hall
- **Assignment:** Backend Development Fundamentals (BDF)
