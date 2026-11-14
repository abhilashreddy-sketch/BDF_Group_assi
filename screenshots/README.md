# Screenshots & Test Output Evidence Folder

> **Course:** Backend Development Fundamentals (BDF)  
> **Theme:** 14 – Seminar Halls  
> **Group ID:** ST-AIDE2A-G14  
> **Project:** EventSpark Hall  

This folder (`screenshots/`) is designated for storing all test execution screenshots, API response captures, and validation evidence required for assignment evaluation.

---

## 📁 Files Included in this Folder

1. **`test_evidence_report.html`**:  
   Open this file in your web browser (Chrome, Edge) to view a styled, high-resolution visual report of all 3 twist tests and core endpoints with exact request bodies and responses. You can screenshot or print to PDF.

2. **`test_outputs.json`**:  
   Programmatic JSON file containing the raw input payloads and response objects from actual test runs.

---

## 📸 Checklist of Screenshots to Take & Store Here

When preparing your submission bundle for Sunday, 15 Nov, capture and save the following screenshots in this folder:

### 1. The 3 Mandatory Twist Tests (Highest Priority)
- **`01_twist_test_1_HAL-0001.png`**:  
  Screenshot of Postman or browser showing `POST /halls` &rarr; `201 Created` with `"code": "HAL-0001"`.
- **`02_twist_test_2_HAL-0002.png`**:  
  Screenshot showing `POST /halls` &rarr; `201 Created` with `"code": "HAL-0002"`.
- **`03_twist_test_3_code_preserved.png`**:  
  Screenshot showing `PUT /halls/1` with a custom code &rarr; `200 OK` showing the code remained `"HAL-0001"` unchanged.

### 2. Core API Endpoints
- **`04_health_check.png`**:  
  `GET /health` &rarr; `200 OK` (`status: "OK"`, uptime).
- **`05_all_halls.png`**:  
  `GET /halls` &rarr; `200 OK` listing the created seminar halls.
- **`06_search_by_building.png`**:  
  `GET /halls?building=Block%20A` &rarr; `200 OK` showing filtered results.
- **`07_create_booking.png`**:  
  `POST /bookings` &rarr; `201 Created` showing booking created with `organiser_id`, `hall_id`, and `booking_date`.
- **`08_conflict_prevention_409.png`**:  
  `POST /bookings` (same hall + same date) &rarr; `409 Conflict` with `"error": "Hall is already booked for this date"`.
- **`09_join_booking_details.png`**:  
  `GET /bookings/details` &rarr; `200 OK` showing SQL `INNER JOIN` results (booking ID, date, organiser name & email, hall name, code, building).

### 3. Automated Test Suite Execution
- **`10_npm_test_62_passed.png`**:  
  Screenshot of your terminal running `npm test` showing all 5 test suites and 62 tests passing.

---

## 🚀 How to Capture Screenshots Quickly

### Option A: Using the Evidence Report
1. Double-click `screenshots/test_evidence_report.html` to open it in Chrome or Edge.
2. Press `Win + Shift + S` (Windows Snipping Tool) to capture each card.

### Option B: Using Postman
1. Open Postman with `postman/EventSpark.postman_collection.json`.
2. Click **Send** on each request.
3. Capture the request URL, body, status code, and response preview.
