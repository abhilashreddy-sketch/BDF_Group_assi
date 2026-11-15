# EventSpark Hall – Seminar Hall Booking Management System

[![Node.js CI](https://img.shields.io/badge/Node.js-v18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-v5.3.0-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![SQLite](https://img.shields.io/badge/SQLite-better--sqlite3-003B57?logo=sqlite&logoColor=white)](https://sqlite.org/)
[![Tests](https://img.shields.io/badge/Tests-62%20Passed-22c55e?logo=jest&logoColor=white)](https://jestjs.io/)
[![Deployment](https://img.shields.io/badge/Render-Live%20Operational-46E3B7?logo=render&logoColor=white)](https://bdf-group-assi.onrender.com/health)
[![Postman](https://img.shields.io/badge/Postman-v2.1.0%20Collection-FF6C37?logo=postman&logoColor=white)](https://www.postman.com/)

> **Course:** Backend Development Fundamentals (BDF)  
> **Theme:** 14 – Seminar Halls  
> **Group ID:** `ST-AIDE2A-G14`  
> **GitHub Repository:** [https://github.com/abhilashreddy-sketch/BDF_Group_assi](https://github.com/abhilashreddy-sketch/BDF_Group_assi)  
> **Live Deployed API:** [https://bdf-group-assi.onrender.com](https://bdf-group-assi.onrender.com)  
> **Health Check Endpoint:** [https://bdf-group-assi.onrender.com/health](https://bdf-group-assi.onrender.com/health)  

---

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Problem Statement](#2-problem-statement)
3. [Project Objectives](#3-project-objectives)
4. [Key Features](#4-key-features)
5. [Technology Stack](#5-technology-stack)
6. [System Architecture](#6-system-architecture)
7. [Project Folder Structure](#7-project-folder-structure)
8. [Database Design](#8-database-design)
9. [Database Relationships](#9-database-relationships)
10. [API Documentation](#10-api-documentation)
11. [Automatic Hall Code Generation](#11-automatic-hall-code-generation)
12. [Double-Booking Prevention](#12-double-booking-prevention)
13. [Input Validation](#13-input-validation)
14. [Error Handling](#14-error-handling)
15. [Installation Instructions](#15-installation-instructions)
16. [Running the Backend](#16-running-the-backend)
17. [Running Automated Tests](#17-running-automated-tests)
18. [Postman Collection Instructions](#18-postman-collection-instructions)
19. [Postman API Testing Documentation (12 Test Cases)](#19-postman-api-testing-documentation)
20. [Live Project & Deployment Screenshots](#20-live-project--deployment-screenshots)
21. [Automated Test Results](#21-automated-test-results)
22. [Assignment Twist Test Results](#22-assignment-twist-test-results)
23. [Deployment Information](#23-deployment-information)
24. [Limitations](#24-limitations)
25. [Team Contributions](#25-team-contributions)

---

## 1. Project Overview

**EventSpark Hall** is a dedicated, production-grade RESTful backend application engineered to manage campus seminar hall scheduling, event organiser registrations, and reservation schedules. Built strictly adhering to REST architectural constraints using **Express.js 5** and **SQLite (`better-sqlite3`)**, the system delivers deterministic calendar reservation integrity, atomic auto-incrementing sequential venue code generation (`HAL-0001`, `HAL-0002`), relational cross-table SQL aggregation, and comprehensive HTTP status handling.

---

## 2. Problem Statement

Across university campuses, student societies, academic departments, and guest lecture committees compete daily for seminar halls. Traditionally handled through manual paper logs, informal chat channels, or fragmented spreadsheets:
- **Scheduling Conflicts:** Double-bookings frequently occurred where two distinct student clubs booked the same hall on the same calendar day without mutual awareness.
- **On-Day Disruptions:** Conflicts were only uncovered when attendees arrived at the venue, resulting in event cancellations and administrative friction.
- **Human Error & Inconsistency:** Manual identifier entry produced malformed or duplicated hall numbers.
- **Lack of Relational Audit Trail:** Venues, organisers, and booking dates lacked synchronized database foreign-key constraints and historical query records.

---

## 3. Project Objectives

- **Relational Data Integrity:** Construct a normalized relational schema connecting event organisers, seminar halls, and reservations with strict SQLite foreign-key enforcement (`PRAGMA foreign_keys = ON;`).
- **Deterministic Conflict Elimination:** Guarantee at both application routing and database constraint levels (`UNIQUE(hall_id, booking_date)`) that zero calendar clashes occur.
- **Monotonic Sequential Code Generation:** Eliminate manual entry errors by implementing server-controlled, concurrency-safe, sequential hall codes (`HAL-0001`, `HAL-0002`, ...) using atomic SQLite transactions.
- **Consolidated Multi-Table Reporting:** Provide a dedicated SQL `INNER JOIN` endpoint (`/bookings/details`) to report booking schedules combined with organiser profiles and venue details in one query.
- **Production Readiness & Testing:** Verify 100% of functional requirements with automated Jest/Supertest suites and Postman collection testing on live cloud infrastructure.

---

## 4. Key Features

- **Strict REST API Design:** Clean, standardized endpoints supporting CRUD workflows for Halls, Organisers, and Bookings.
- **Atomic Code Sequence Tracking:** Concurrency-safe monotonic sequence generator table (`hall_sequence`) ensuring numbers never regress or repeat upon record deletion.
- **Client Code Tamper Immunity:** Ignores and strips any client-provided `code` in `POST /halls` and prevents modification during `PUT /halls/:id`.
- **Relational Deletion Protection:** Deletion of any hall or organiser tied to existing bookings is blocked with `409 Conflict`.
- **Building-Based Filter Search:** Case-insensitive search on `GET /halls?building=Block%20A`.
- **Centralized Middleware Pipeline:** Robust request validation, regex email verification, calendar format checks, and environment-aware error masking.

---

## 5. Technology Stack

| Layer | Technology | Details |
|---|---|---|
| **Runtime** | Node.js | v18+ LTS (Engineered and tested on v24.16.0) |
| **Framework** | Express.js | v5.3.0 (Modern Express 5 routing & async pipeline) |
| **Database Engine** | SQLite 3 | Embedded high-performance transactional SQL |
| **Driver** | `better-sqlite3` | v13.0.3 (Fast, synchronous, native binding) |
| **Testing Framework** | Jest & Supertest | v30.5.2 & v7.3.2 (62 automated test cases) |
| **API Client & Runner** | Postman & Newman | Postman v2.1.0 Collection & Newman CLI runner |
| **Utilities** | `cors`, `dotenv` | Cross-origin resource sharing & configuration |
| **Cloud Deployment** | Render | Continuous deployment with live health monitoring |

---

## 6. System Architecture

```
                    +------------------------------------+
                    |        HTTP Client Request         |
                    |     (Postman / Browser / Curl)     |
                    +-----------------+------------------+
                                      |
                                      v
                    +------------------------------------+
                    |        Express Application         |
                    |              (app.js)              |
                    +-----------------+------------------+
                                      |
                    +-----------------+------------------+
                    |        Global Middleware           |
                    |    (CORS, JSON Parser, URL-Enc)    |
                    +-----------------+------------------+
                                      |
                                      v
                    +------------------------------------+
                    |           Router Layer             |
                    |   /health, /halls, /organisers,    |
                    |        /bookings, /details         |
                    +-----------------+------------------+
                                      |
                                      v
                    +------------------------------------+
                    |        Validation Layer            |
                    |  (validateHall, validateOrganiser, |
                    |          validateBooking)          |
                    +-----------------+------------------+
                                      |
                                      v
                    +------------------------------------+
                    |         Controller Layer           |
                    |  (hallController, bookingController|
                    |        organiserController)        |
                    +-----------------+------------------+
                                      |
                                      v
                    +------------------------------------+
                    |          Database Layer            |
                    |  better-sqlite3 + PRAGMA FK = ON   |
                    |       (eventspark.db)              |
                    +-----------------+------------------+
                                      |
                                      v
                    +------------------------------------+
                    |    Centralized Error Middleware    |
                    |   (HTTP 400, 404, 409, 500 mapping)|
                    +------------------------------------+
```

---

## 7. Project Folder Structure

```
eventspark-hall/
│
├── config/
│   └── db.js                              # SQLite connection, FK pragma, schema bootstrap & sequence sync
│
├── controllers/
│   ├── hallController.js                  # Hall CRUD, building search & atomic HAL-xxxx sequence generator
│   ├── organiserController.js             # Organiser CRUD & unique email conflict enforcement
│   └── bookingController.js               # Booking CRUD, date conflict logic & SQL INNER JOIN aggregation
│
├── routes/
│   ├── hallRoutes.js                      # Hall REST route definitions
│   ├── organiserRoutes.js                 # Organiser REST route definitions
│   └── bookingRoutes.js                   # Booking REST route definitions (including /details)
│
├── middleware/
│   ├── errorHandler.js                    # Centralized error handler & HTTP status mapper
│   ├── validateHall.js                    # Request validation for hall endpoints
│   ├── validateOrganiser.js               # Request validation & email regex for organisers
│   ├── validateBooking.js                 # Request validation & date string checks for bookings
│   └── notFound.js                        # Standard 404 handler for unknown routes
│
├── database/
│   ├── schema.sql                         # SQL DDL table schema, foreign keys, unique constraints & indexes
│   └── eventspark.db                      # SQLite transactional database file (auto-created on boot)
│
├── docs/
│   └── screenshots/
│       ├── project/                       # Verified live production deployment screenshots
│       │   ├── 01-live-welcome-root.png
│       │   ├── 02-live-health-check.png
│       │   ├── 03-live-halls-code-generation.png
│       │   ├── 04-live-booking-details-join.png
│       │   ├── 05-live-active-bookings.png
│       │   └── 06-live-registered-organisers.png
│       ├── postman/                       # Postman test suite screenshot documentation
│       └── testing/                       # Verified automated testing execution evidence
│           ├── automated-test-results.png # Full Jest test suite run (62 tests passed)
│           └── twist-test-results.png     # Assignment twist tests & sequence security (6 tests passed)
│
├── tests/
│   ├── server.test.js                     # Root welcome, /health, 404 & SQLite FK pragma tests
│   ├── halls.test.js                      # Complete Hall CRUD, building search & validation tests
│   ├── organisers.test.js                 # Complete Organiser CRUD, email regex & duplicate tests
│   ├── bookings.test.js                   # Booking CRUD, date clash prevention & SQL JOIN tests
│   └── twist.test.js                      # The 3 mandatory assignment twist tests & code security
│
├── postman/
│   └── EventSpark.postman_collection.json # Official Postman collection (v2.1.0 format, 27 requests)
│
├── app.js                                 # Express application configuration & middleware mount
├── server.js                              # Server entry point, port binding (0.0.0.0) & shutdown hooks
├── package.json                           # NPM dependencies, scripts & Jest configuration
├── package-lock.json                      # Deterministic dependency tree lockfile
├── .env.example                           # Environment configuration template
├── .gitignore                             # Git ignore rules (node_modules, .env, DB binaries)
└── README.md                              # Comprehensive project documentation
```

---

## 8. Database Design

The relational database schema is stored in `database/schema.sql` and initialized upon startup. It comprises three core business entities and one dedicated sequence tracker table.

```sql
PRAGMA foreign_keys = ON;

-- Table 1: organisers
CREATE TABLE IF NOT EXISTS organisers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table 2: halls
CREATE TABLE IF NOT EXISTS halls (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  building TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table 3: bookings
CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organiser_id INTEGER NOT NULL,
  hall_id INTEGER NOT NULL,
  booking_date TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organiser_id) REFERENCES organisers(id) ON DELETE RESTRICT,
  FOREIGN KEY (hall_id) REFERENCES halls(id) ON DELETE RESTRICT,
  CONSTRAINT uq_hall_booking_date UNIQUE (hall_id, booking_date)
);

-- Table 4: hall_sequence
CREATE TABLE IF NOT EXISTS hall_sequence (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  last_number INTEGER NOT NULL DEFAULT 0
);
```

### Performance Indexes
- `idx_halls_building`: Accelerates search queries on `building` column.
- `idx_halls_code`: Optimizes lookups on unique hall code.
- `idx_bookings_hall_date`: Powers zero-latency composite duplicate checks on `(hall_id, booking_date)`.
- `idx_bookings_organiser`: Optimizes relational queries filtering by organiser.

---

## 9. Database Relationships

```
+------------------------------------+             +------------------------------------+
|             organisers             |             |               halls                |
+------------------------------------+             +------------------------------------+
| id (PK, INTEGER AUTOINCREMENT)     |             | id (PK, INTEGER AUTOINCREMENT)     |
| name (TEXT NOT NULL)               |             | code (TEXT NOT NULL UNIQUE)        |
| email (TEXT NOT NULL UNIQUE)       |             | name (TEXT NOT NULL)               |
| created_at (DATETIME)              |             | building (TEXT NOT NULL)           |
+-----------------+------------------+             | created_at (DATETIME)              |
                  | 1                              | updated_at (DATETIME)              |
                  |                                +-----------------+------------------+
                  |                                                  | 1
                  |                                                  |
                  |        +--------------------------------+        |
                  +------->|            bookings            |<-------+
                         N | id (PK, INTEGER AUTOINCREMENT) | N
                           | organiser_id (FK -> organisers)|
                           | hall_id (FK -> halls)          |
                           | booking_date (TEXT NOT NULL)   |
                           | created_at (DATETIME)          |
                           +--------------------------------+
                           | CONSTRAINT:                    |
                           | UNIQUE(hall_id, booking_date)  |
                           +--------------------------------+
```

### Relational Constraints
1. **One-to-Many (`organisers` -> `bookings`):** An organiser can create multiple hall bookings over time.
2. **One-to-Many (`halls` -> `bookings`):** A seminar hall can host multiple events across different calendar dates.
3. **Composite Uniqueness:** `UNIQUE(hall_id, booking_date)` enforces that a single hall cannot have multiple bookings on the identical date.
4. **Delete Restrictions:** `ON DELETE RESTRICT` guarantees that active halls and organisers cannot be deleted if associated with booking records.

---

## 10. API Documentation

### Base URLs
- **Live Cloud Production:** `https://bdf-group-assi.onrender.com`
- **Local Development:** `http://localhost:3000`

### Endpoints Overview

| Area | Method | Endpoint | Description | Status Codes |
|---|---|---|---|---|
| **System** | `GET` | `/` | Root API directory & welcome status | `200` |
| **System** | `GET` | `/health` | Health check, server uptime & timestamp | `200` |
| **Halls** | `GET` | `/halls` | Get all halls (supports `?building=...`) | `200` |
| **Halls** | `GET` | `/halls/:id` | Get single hall by ID | `200`, `400`, `404` |
| **Halls** | `POST` | `/halls` | Create hall (auto-generates `HAL-xxxx` code) | `201`, `400` |
| **Halls** | `PUT` | `/halls/:id` | Update hall name & building (code immutable) | `200`, `400`, `404` |
| **Halls** | `DELETE` | `/halls/:id` | Delete hall (rejected if bookings exist) | `200`, `400`, `404`, `409` |
| **Organisers** | `GET` | `/organisers` | Get all registered organisers | `200` |
| **Organisers** | `GET` | `/organisers/:id` | Get single organiser by ID | `200`, `400`, `404` |
| **Organisers** | `POST` | `/organisers` | Register organiser (unique email enforced) | `201`, `400`, `409` |
| **Organisers** | `PUT` | `/organisers/:id` | Update organiser name or email | `200`, `400`, `404`, `409` |
| **Organisers** | `DELETE` | `/organisers/:id` | Delete organiser (rejected if bookings exist) | `200`, `400`, `404`, `409` |
| **Bookings** | `GET` | `/bookings` | Get all active bookings | `200` |
| **Bookings** | `GET` | `/bookings/details` | **JOIN Endpoint**: Combines bookings, organisers & halls | `200` |
| **Bookings** | `GET` | `/bookings/:id` | Get single booking by ID | `200`, `400`, `404` |
| **Bookings** | `POST` | `/bookings` | Create booking (checks FKs & prevents date clash) | `201`, `400`, `404`, `409` |
| **Bookings** | `PUT` | `/bookings/:id` | Update booking date, organiser or hall | `200`, `400`, `404`, `409` |
| **Bookings** | `DELETE` | `/bookings/:id` | Cancel/delete a booking | `200`, `400`, `404` |

---

## 11. Automatic Hall Code Generation

A core specification of the assignment is the automatic server-side generation of sequential hall codes formatted as `HAL-0001`, `HAL-0002`, `HAL-0003`, etc.

### Architectural Implementation:
1. **Never Rely on `SELECT COUNT(*)`:** Counting existing rows is flawed because deleting row 2 would cause the next created row to reuse `HAL-0002`, resulting in duplicate key violations or code reuse.
2. **Dedicated Monotonic Sequence Table (`hall_sequence`):** A single-row tracker maintains `last_number`. It only advances monotonically forward. Record deletions have zero effect on the sequence number.
3. **Atomic SQLite Immediate Transaction:** Code generation and insertion are encapsulated in a `db.transaction()` block. In SQLite, this immediately acquires an exclusive write lock, eliminating race conditions even under concurrent incoming requests.
4. **Boot Synchronisation:** At boot, `config/db.js` inspects the maximum existing code suffix in `halls` to ensure `hall_sequence` is at least equal to the highest code present.
5. **Client Tamper Immunity:** `validateHall.js` sanitizes input bodies by stripping any client-supplied `code`. The `PUT /halls/:id` SQL query strictly updates `name`, `building`, and `updated_at`, keeping `code` immutable.

---

## 12. Double-Booking Prevention

Calendar conflict elimination is enforced through a two-tiered defense:

1. **Database Constraint Tier:**
   ```sql
   CONSTRAINT uq_hall_booking_date UNIQUE (hall_id, booking_date)
   ```
   Ensures that SQLite will reject any duplicate combination at the storage engine level.
2. **Application Controller Tier:**
   Before running the insert, `bookingController.js` executes:
   ```sql
   SELECT id FROM bookings WHERE hall_id = ? AND booking_date = ?
   ```
   If a matching record exists, the server responds with `HTTP 409 Conflict`:
   ```json
   {
     "error": "Hall is already booked for this date"
   }
   ```
   The same conflict logic is enforced on `PUT /bookings/:id` using `id != ?` exclusion to allow date changes while preventing overlap with any other booking.

---

## 13. Input Validation

Each resource route utilizes dedicated validation middleware prior to invoking the controller:

- **Halls (`validateHall.js`):**
  - Rejects empty, missing, or whitespace-only `name` or `building` with `400 Bad Request`.
  - Strips any client-injected `code` property.
  - Validates numeric ID parameters (`/halls/:id`).
- **Organisers (`validateOrganiser.js`):**
  - Validates presence of `name` and `email`.
  - Validates email formatting via standard RFC 5322 regex pattern (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`).
  - Returns `400 Bad Request` with clear messages for invalid email syntaxes.
- **Bookings (`validateBooking.js`):**
  - Enforces positive integer `organiser_id` and `hall_id`.
  - Enforces `booking_date` format matching `YYYY-MM-DD` and verifies actual calendar validity.

---

## 14. Error Handling

Centralized in `middleware/errorHandler.js`:
- Maps SQLite errors (`SQLITE_CONSTRAINT_UNIQUE` -> `409 Conflict`, `SQLITE_CONSTRAINT_FOREIGNKEY` -> `400 Bad Request`).
- Consistent JSON response format: `{ "error": "<Message>" }`.
- In production (`NODE_ENV === 'production'`), generic 500 errors mask database internals to prevent information leakage while logging full details on the server.
- Unhandled routes are captured by `middleware/notFound.js` returning `HTTP 404 Not Found`.

---

## 15. Installation Instructions

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0.0 or higher)
- [Git](https://git-scm.com/)

### Clone and Install
```bash
# 1. Clone repository
git clone https://github.com/abhilashreddy-sketch/BDF_Group_assi.git

# 2. Enter directory
cd BDF_Group_assi

# 3. Install dependencies
npm install
```

---

## 16. Running the Backend

### Standard Production Mode
```bash
npm start
```
Starts `server.js` on `http://localhost:3000` (or `process.env.PORT`).

### Development Mode (with Nodemon Auto-Reload)
```bash
npm run dev
```

### Health Check Verification
```bash
curl http://localhost:3000/health
```

---

## 17. Running Automated Tests

The backend includes a comprehensive Jest test suite covering all REST endpoints, validation edge cases, date conflicts, relational constraints, and assignment twist requirements.

```bash
# Run full test suite
npm test
```

### Verified Test Suite Results:
- **Total Test Suites:** 5 passed, 5 total
- **Total Tests:** 62 passed, 62 total
- **Execution Time:** ~21.5 seconds

```
PASS tests/bookings.test.js
PASS tests/organisers.test.js
PASS tests/halls.test.js
PASS tests/server.test.js
PASS tests/twist.test.js

Test Suites: 5 passed, 5 total
Tests:       62 passed, 62 total
Snapshots:   0 total
Time:        21.594 s
```

---

## 18. Postman Collection Instructions

The complete, official Postman collection is committed directly inside the repository at:
`postman/EventSpark.postman_collection.json`

### Step-by-Step Instructions:

1. **Open Postman:** Launch your Postman desktop application or Postman Web.
2. **Import Collection:** Click the **Import** button in the upper left navigation pane.
3. **Select File:** Choose or drag-and-drop `postman/EventSpark.postman_collection.json` from the repository root.
4. **Configure Base URL Environment Variable:**
   - Click the imported collection **EventSpark Hall API** -> **Variables** tab.
   - For **Live Cloud Backend:** Set `baseUrl` to `https://bdf-group-assi.onrender.com`.
   - For **Local Development:** Set `baseUrl` to `http://localhost:3000`.
   - Click **Save**.
5. **Run Individual Requests:** Expand folders (e.g. `1. Health Check`, `2. Halls`, `3. Organisers`, `4. Bookings`, `5. Booking Details`) and click **Send**.
6. **Execute Full Collection Runner:**
   - Click the `...` menu next to the collection name and select **Run collection**.
   - Ensure all 27 requests are selected and click **Run EventSpark Hall API**.
7. **View Test Results:** Open the **Test Results** tab in any request to inspect status code assertions and JSON schema validations.

---

## 19. Postman API Testing Documentation

Below is the verified test matrix of the 12 core API test cases executed against the live deployed cloud backend (`https://bdf-group-assi.onrender.com`):

### TEST 1 – Health Check
- **Method:** `GET`
- **URL:** `https://bdf-group-assi.onrender.com/health`
- **Expected Status:** `200 OK`
- **Actual Status:** `200 OK` (Response time: ~105ms)
- **Response Payload:**
  ```json
  {
    "status": "OK",
    "service": "EventSpark Hall Backend",
    "timestamp": "2026-11-15T12:23:56.707Z",
    "uptime": 566.58
  }
  ```
- **Postman Tests:** Status code is 200, response has status OK.

---

### TEST 2 – Create Organiser
- **Method:** `POST`
- **URL:** `https://bdf-group-assi.onrender.com/organisers`
- **Headers:** `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "name": "Demo Organiser",
    "email": "demo.organiser@example.com"
  }
  ```
- **Expected Status:** `201 Created`
- **Actual Status:** `201 Created`
- **Response Payload:**
  ```json
  {
    "id": 2,
    "name": "Demo Organiser",
    "email": "demo.org.1794745439070@example.com",
    "created_at": "2026-11-15T12:23:57.032Z"
  }
  ```

---

### TEST 3 – Create First Hall (Twist Test 1)
- **Method:** `POST`
- **URL:** `https://bdf-group-assi.onrender.com/halls`
- **Headers:** `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "name": "Main Seminar Hall",
    "building": "Block A"
  }
  ```
- **Expected Status:** `201 Created`
- **Expected Code:** Sequential `HAL-xxxx` code generated automatically
- **Actual Status:** `201 Created`
- **Response Payload:**
  ```json
  {
    "id": 7,
    "code": "HAL-0007",
    "name": "Main Seminar Hall",
    "building": "Block A",
    "created_at": "2026-11-15T12:23:57.159Z",
    "updated_at": "2026-11-15T12:23:57.159Z"
  }
  ```

---

### TEST 4 – Create Second Hall (Twist Test 2)
- **Method:** `POST`
- **URL:** `https://bdf-group-assi.onrender.com/halls`
- **Headers:** `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "name": "Conference Hall",
    "building": "Block B"
  }
  ```
- **Expected Status:** `201 Created`
- **Expected Code:** Sequentially incremented code
- **Actual Status:** `201 Created`
- **Response Payload:**
  ```json
  {
    "id": 8,
    "code": "HAL-0008",
    "name": "Conference Hall",
    "building": "Block B",
    "created_at": "2026-11-15T12:23:57.347Z",
    "updated_at": "2026-11-15T12:23:57.347Z"
  }
  ```

---

### TEST 5 – Get All Halls
- **Method:** `GET`
- **URL:** `https://bdf-group-assi.onrender.com/halls`
- **Expected Status:** `200 OK`
- **Actual Status:** `200 OK`
- **Response Summary:** Returns an array of seminar halls with generated sequential codes.

---

### TEST 6 – Search Halls by Building
- **Method:** `GET`
- **URL:** `https://bdf-group-assi.onrender.com/halls?building=Block%20A`
- **Expected Status:** `200 OK`
- **Actual Status:** `200 OK`
- **Response Summary:** Returns filtered array where `building` matches "Block A" case-insensitively.

---

### TEST 7 – Update Hall (Twist Test 3 – Immutability)
- **Method:** `PUT`
- **URL:** `https://bdf-group-assi.onrender.com/halls/7`
- **Headers:** `Content-Type: application/json`
- **Request Body (Attempting to inject custom code):**
  ```json
  {
    "name": "Updated Seminar Hall",
    "building": "Block C",
    "code": "CUSTOM-999"
  }
  ```
- **Expected Status:** `200 OK`
- **Expected Behavior:** Name & building updated, hall code remains strictly immutable.
- **Actual Status:** `200 OK`
- **Response Payload:**
  ```json
  {
    "id": 7,
    "code": "HAL-0007",
    "name": "Updated Seminar Hall",
    "building": "Block C",
    "created_at": "2026-11-15T12:23:57.159Z",
    "updated_at": "2026-11-15T12:23:57.839Z"
  }
  ```

---

### TEST 8 – Create Booking
- **Method:** `POST`
- **URL:** `https://bdf-group-assi.onrender.com/bookings`
- **Headers:** `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "organiser_id": 2,
    "hall_id": 7,
    "booking_date": "2027-01-24"
  }
  ```
- **Expected Status:** `201 Created`
- **Actual Status:** `201 Created`
- **Response Payload:**
  ```json
  {
    "id": 3,
    "organiser_id": 2,
    "hall_id": 7,
    "booking_date": "2027-01-24",
    "created_at": "2026-11-15T12:23:58.035Z"
  }
  ```

---

### TEST 9 – Booking JOIN Endpoint (Mandatory Multi-Table Query)
- **Method:** `GET`
- **URL:** `https://bdf-group-assi.onrender.com/bookings/details`
- **Expected Status:** `200 OK`
- **Actual Status:** `200 OK`
- **Response Payload:**
  ```json
  [
    {
      "booking_id": 3,
      "booking_date": "2027-01-24",
      "organiser_name": "Demo Organiser",
      "organiser_email": "demo.org.1794745439070@example.com",
      "hall_name": "Updated Seminar Hall",
      "hall_code": "HAL-0007",
      "building": "Block C"
    }
  ]
  ```

---

### TEST 10 – Duplicate Booking Prevention (Calendar Conflict)
- **Method:** `POST`
- **URL:** `https://bdf-group-assi.onrender.com/bookings`
- **Headers:** `Content-Type: application/json`
- **Request Body (Same hall 7 and same date 2027-01-24):**
  ```json
  {
    "organiser_id": 2,
    "hall_id": 7,
    "booking_date": "2027-01-24"
  }
  ```
- **Expected Status:** `409 Conflict`
- **Actual Status:** `409 Conflict`
- **Response Payload:**
  ```json
  {
    "error": "Hall is already booked for this date"
  }
  ```

---

### TEST 11 – Validation Error (Missing Required Fields)
- **Method:** `POST`
- **URL:** `https://bdf-group-assi.onrender.com/halls`
- **Headers:** `Content-Type: application/json`
- **Request Body (Missing name):**
  ```json
  {
    "building": "Block Z"
  }
  ```
- **Expected Status:** `400 Bad Request`
- **Actual Status:** `400 Bad Request`
- **Response Payload:**
  ```json
  {
    "error": "Hall name is required"
  }
  ```

---

### TEST 12 – Delete Hall
- **Method:** `DELETE`
- **URL:** `https://bdf-group-assi.onrender.com/halls/8`
- **Expected Status:** `200 OK` (for a hall with no associated bookings)
- **Actual Status:** `200 OK`
- **Response Payload:**
  ```json
  {
    "message": "Hall deleted successfully"
  }
  ```

---

## 20. Live Project & Deployment Screenshots

The following verified screenshots capture the live deployed cloud application running on Render (`https://bdf-group-assi.onrender.com`):

### 1. Root Welcome Endpoint (`GET /`)
Confirms the live cloud server is running and exposes the API route directory.

![Root Welcome Endpoint](docs/screenshots/project/01-live-welcome-root.png)

---

### 2. Server Health Check (`GET /health`)
Confirms system health, service name, ISO timestamp, and live uptime.

![Server Health Check](docs/screenshots/project/02-live-health-check.png)

---

### 3. Seminar Halls & Automatic Code Generation (`GET /halls`)
Demonstrates initial seed data showing auto-generated sequential codes **`HAL-0001`** and **`HAL-0002`**.

![Seminar Halls Endpoint](docs/screenshots/project/03-live-halls-code-generation.png)

---

### 4. Mandatory SQL INNER JOIN Details (`GET /bookings/details`)
Verifies single-query aggregation across `bookings`, `organisers`, and `halls` tables returning combined booking ID, date, organiser name/email, and hall name/code/building.

![Booking Details JOIN](docs/screenshots/project/04-live-booking-details-join.png)

---

### 5. Active Bookings (`GET /bookings`)
Displays active hall reservations with foreign keys pointing to registered organisers and seminar halls.

![Active Bookings](docs/screenshots/project/05-live-active-bookings.png)

---

### 6. Registered Organisers (`GET /organisers`)
Displays registered event organisers with validated unique email addresses.

![Registered Organisers](docs/screenshots/project/06-live-registered-organisers.png)

---

## 21. Automated Test Results

The backend contains 62 automated unit and integration tests executed using **Jest** and **Supertest** (`npm test`). Every test passes cleanly across all 5 test suites.

- **Test Suites:** 5 passed, 5 total
- **Tests:** 62 passed, 62 total
- **Execution Time:** ~21.5 seconds

![Automated Jest Test Results](docs/screenshots/testing/automated-test-results.png)

---

## 22. Assignment Twist Test Results

The three mandatory assignment twist requirements and hall code security invariants are rigorously verified in `tests/twist.test.js`:

1. **TEST 1:** First hall creation must return `HTTP 201` and code `HAL-0001`.
2. **TEST 2:** Second hall creation must return `HTTP 201` and sequential code `HAL-0002`.
3. **TEST 3:** Updating first hall must return `HTTP 200`, update name/building, and preserve `HAL-0001` intact.
4. **Security Check 1:** Attempting to provide a custom `code` in `POST /halls` is ignored by the server.
5. **Security Check 2:** Attempting to provide a custom `code` in `PUT /halls/:id` cannot overwrite the hall code.
6. **Sequence Retention:** The monotonic sequence does not reuse codes even if intermediate halls are deleted.

- **Test Suites:** 1 passed, 1 total
- **Tests:** 6 passed, 6 total
- **Execution Time:** ~9.7 seconds

![Assignment Twist Test Results](docs/screenshots/testing/twist-test-results.png)

---

## 23. Deployment Information

- **Hosting Platform:** [Render](https://render.com/) (Web Service)
- **Deployment URL:** [https://bdf-group-assi.onrender.com](https://bdf-group-assi.onrender.com)
- **Health Endpoint:** [https://bdf-group-assi.onrender.com/health](https://bdf-group-assi.onrender.com/health)
- **Root Directory:** Repository root (`/`)
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Environment:** `NODE_ENV=production`

---

## 24. Limitations

1. **Date-Level Granularity:** Current booking model reserves halls for full calendar days (`YYYY-MM-DD`). Finer hourly timeslot management (e.g. 10:00 AM – 12:00 PM) is planned for future revisions.
2. **Timezone Standardization:** All dates and timestamps are formatted in UTC (ISO 8601); localized campus timezone adjustments are handled on the client.
3. **Role-Based Access Control:** In accordance with the foundational backend assignment brief, authentication and JWT authorization are omitted in favor of strict REST principles and transactional integrity.

---

## 25. Team Contributions

- **Course:** Backend Development Fundamentals (BDF)
- **Theme:** 14 – Seminar Halls
- **Group ID:** `ST-AIDE2A-G14`
- **Team Lead & Developer:** Abhilash Reddy (`abhilashreddy-sketch`)
- **Contributions:**
  - Database schema engineering, SQLite FK constraint implementation & migration scripts.
  - Express.js route mapping, validation middleware & centralized error handling.
  - Atomic monotonic sequential code generation (`hall_sequence`).
  - SQL `INNER JOIN` `/bookings/details` multi-table aggregation endpoint.
  - Automated Jest/Supertest suites (62 tests), Postman collection authoring & deployment verification.
