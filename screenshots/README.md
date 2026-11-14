# EventSpark Hall – Live Deployment Screenshots & Evidence

> **Course:** Backend Development Fundamentals (BDF)  
> **Theme:** 14 – Seminar Halls  
> **Group ID:** ST-AIDE2A-G14  
> **Live Render URL:** [https://bdf-group-assi-1.onrender.com](https://bdf-group-assi-1.onrender.com)  

This folder contains the verified production screenshots taken directly from our live deployed cloud backend on Render.

---

## 📸 Live Deployment Screenshot Gallery

### 1. Root Welcome Endpoint (`GET /`)
> **URL:** `https://bdf-group-assi-1.onrender.com/`  
> Confirms server is running with API directory links.

![Root Welcome Endpoint](Screenshot%202026-11-14%20191110.png)

---

### 2. Server Health Check (`GET /health`)
> **URL:** `https://bdf-group-assi-1.onrender.com/health`  
> Confirms system operational status, uptime, and timestamp.

![Health Check Endpoint](Screenshot%202026-11-14%20191155.png)

---

### 3. Seminar Halls & Automatic Code Generation (`GET /halls`)
> **URL:** `https://bdf-group-assi-1.onrender.com/halls`  
> Verifies automatic server code assignment: **`HAL-0001`** and **`HAL-0002`**.

![Seminar Halls Endpoint](Screenshot%202026-11-14%20192205.png)

---

### 4. Registered Organisers (`GET /organisers`)
> **URL:** `https://bdf-group-assi-1.onrender.com/organisers`  
> Displays registered club organisers with unique email validation.

![Organisers Endpoint](Screenshot%202026-11-14%20192346.png)

---

### 5. Active Bookings (`GET /bookings`)
> **URL:** `https://bdf-group-assi-1.onrender.com/bookings`  
> Displays active hall bookings with foreign key links.

![Bookings Endpoint](Screenshot%202026-11-14%20192313.png)

---

### 6. Mandatory SQL INNER JOIN Details (`GET /bookings/details`)
> **URL:** `https://bdf-group-assi-1.onrender.com/bookings/details`  
> Consolidates `bookings`, `organisers`, and `halls` via a single SQL query.

![JOIN Booking Details Endpoint](Screenshot%202026-11-14%20192234.png)

---

## 📄 Additional Verification Files

- **`test_evidence_report.html`**: Interactive HTML report detailing the 3 mandatory twist tests and conflict checks.
- **`test_outputs.json`**: Raw JSON outputs from programmatic test runs.
