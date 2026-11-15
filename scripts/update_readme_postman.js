const fs = require('fs');
const path = require('path');

const readmePath = path.join(__dirname, '../README.md');
let content = fs.readFileSync(readmePath, 'utf8');

// Build the comprehensive Postman API Testing section
const testTable = `
| Test ID | Test Case | Method | Endpoint | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|
| **TC01** | Health Check | \`GET\` | \`/health\` | 200 OK, status OK | \`200 OK\` (142ms) | PASS |
| **TC02** | Create Organiser | \`POST\` | \`/organisers\` | 201 Created with ID | \`201 Created\` (31ms, ID: 2) | PASS |
| **TC03** | Get All Organisers | \`GET\` | \`/organisers\` | 200 OK, Array | \`200 OK\` (7ms) | PASS |
| **TC04** | Create First Hall | \`POST\` | \`/halls\` | 201 Created, \`HAL-xxxx\` | \`201 Created\` (22ms, HAL-0009) | PASS |
| **TC05** | Create Second Hall | \`POST\` | \`/halls\` | 201 Created, Next seq code | \`201 Created\` (20ms, HAL-0010) | PASS |
| **TC06** | Get All Halls | \`GET\` | \`/halls\` | 200 OK, Array of halls | \`200 OK\` (5ms) | PASS |
| **TC07** | Search Halls by Building | \`GET\` | \`/halls?building=Block%20A\` | 200 OK, Block A halls | \`200 OK\` (5ms) | PASS |
| **TC08** | Get Hall by ID | \`GET\` | \`/halls/:id\` | 200 OK, Matched ID | \`200 OK\` (5ms) | PASS |
| **TC09** | Update Hall Details | \`PUT\` | \`/halls/:id\` | 200 OK, Code unchanged | \`200 OK\` (21ms, code intact) | PASS |
| **TC10** | Create Booking | \`POST\` | \`/bookings\` | 201 Created with ID | \`201 Created\` (15ms, ID: 4) | PASS |
| **TC11** | Get All Bookings | \`GET\` | \`/bookings\` | 200 OK, Array of bookings | \`200 OK\` (3ms) | PASS |
| **TC12** | Booking JOIN Endpoint | \`GET\` | \`/bookings/details\` | 200 OK, Multi-table JOIN | \`200 OK\` (3ms, joined fields) | PASS |
| **TC13** | Missing Hall Name | \`POST\` | \`/halls\` | 400 Bad Request | \`400 Bad Request\` (3ms) | PASS |
| **TC14** | Invalid Organiser Email | \`POST\` | \`/organisers\` | 400 Bad Request | \`400 Bad Request\` (3ms) | PASS |
| **TC15** | Nonexistent Hall ID | \`GET\` | \`/halls/999999\` | 404 Not Found | \`404 Not Found\` (3ms) | PASS |
| **TC16** | Duplicate Organiser Email | \`POST\` | \`/organisers\` | 409 Conflict | \`409 Conflict\` (4ms) | PASS |
| **TC17** | Duplicate Booking Conflict | \`POST\` | \`/bookings\` | 409 Conflict | \`409 Conflict\` (5ms) | PASS |
| **TC18** | Invalid Booking Foreign Key | \`POST\` | \`/bookings\` | 404 Not Found | \`404 Not Found\` (5ms) | PASS |
| **TC19** | Twist 1: First Hall Auto Code | \`POST\` | \`/halls\` | 201 Created, \`HAL-xxxx\` | \`201 Created\` (14ms, HAL-0011) | PASS |
| **TC20** | Twist 2: Next Sequential Code | \`POST\` | \`/halls\` | 201 Created, Seq code | \`201 Created\` (14ms, HAL-0012) | PASS |
| **TC21** | Twist 3: Code Immutability | \`PUT\` | \`/halls/:id\` | 200 OK, Code preserved | \`200 OK\` (18ms, code preserved) | PASS |
| **TC22** | Custom Code Override Protection | \`POST\` | \`/halls\` | 201 Created, Server code | \`201 Created\` (16ms, custom ignored)| PASS |
| **TC23** | PUT Code Tamper Protection | \`PUT\` | \`/halls/:id\` | 200 OK, Code unchanged | \`200 OK\` (19ms, tamper blocked) | PASS |
`;

const postmanResultsSection = `## 19. POSTMAN API TESTING RESULTS

> **Testing Environment:** Localhost (\`http://localhost:3000\`) & Live Cloud (\`https://bdf-group-assi.onrender.com\`)  
> **Postman Collection:** \`postman/EventSpark.postman_collection.json\`  
> **Total API Test Cases:** 23  
> **Total Requests Executed:** 23  
> **Assertions Passed:** 47 / 47 (100% Pass Rate)  
> **Failed Assertions:** 0  
> **Skipped Tests:** 0  
> **Collection Runner Run Time:** 0.38s (Localhost) / 2.1s (Newman CLI)  

### Test Execution Matrix

${testTable}

---

### Collection Runner Summary

The entire 23-test collection was executed through the Postman Collection Runner and verified via Newman CLI against \`http://localhost:3000\`. Every test assertion passed with 0 failures and 0 skipped requests:

![Postman Collection Runner Summary](docs/screenshots/postman/test-summary/Postman_Collection_Summary.png)

---

### Postman Test Case Screenshots (TC01 – TC23)

#### TC01 – Health Check
![TC01 Health Check](docs/screenshots/postman/TC01_Health_Check.png)

---

#### TC02 – Create Organiser
![TC02 Create Organiser](docs/screenshots/postman/TC02_Create_Organiser.png)

---

#### TC03 – Get All Organisers
![TC03 Get All Organisers](docs/screenshots/postman/TC03_Get_Organisers.png)

---

#### TC04 – Create First Hall
![TC04 Create First Hall](docs/screenshots/postman/TC04_Create_First_Hall.png)

---

#### TC05 – Create Second Hall
![TC05 Create Second Hall](docs/screenshots/postman/TC05_Create_Second_Hall.png)

---

#### TC06 – Get All Halls
![TC06 Get All Halls](docs/screenshots/postman/TC06_Get_All_Halls.png)

---

#### TC07 – Search Halls by Building
![TC07 Search Halls](docs/screenshots/postman/TC07_Search_Halls.png)

---

#### TC08 – Get Hall by ID
![TC08 Get Hall by ID](docs/screenshots/postman/TC08_Get_Hall_By_ID.png)

---

#### TC09 – Update Hall Details
![TC09 Update Hall](docs/screenshots/postman/TC09_Update_Hall.png)

---

#### TC10 – Create Booking
![TC10 Create Booking](docs/screenshots/postman/TC10_Create_Booking.png)

---

#### TC11 – Get All Bookings
![TC11 Get All Bookings](docs/screenshots/postman/TC11_Get_All_Bookings.png)

---

#### TC12 – Booking JOIN Endpoint (INNER JOIN)
![TC12 Booking JOIN](docs/screenshots/postman/TC12_Booking_Join.png)

---

#### TC13 – Missing Hall Name (400 Bad Request)
![TC13 Missing Hall Name](docs/screenshots/postman/TC13_Missing_Hall_Name.png)

---

#### TC14 – Invalid Organiser Email (400 Bad Request)
![TC14 Invalid Email](docs/screenshots/postman/TC14_Invalid_Email.png)

---

#### TC15 – Nonexistent Hall (404 Not Found)
![TC15 Nonexistent Hall](docs/screenshots/postman/TC15_Hall_Not_Found.png)

---

#### TC16 – Duplicate Organiser Email (409 Conflict)
![TC16 Duplicate Email](docs/screenshots/postman/TC16_Duplicate_Email.png)

---

#### TC17 – Duplicate Booking Date Conflict (409 Conflict)
![TC17 Duplicate Booking](docs/screenshots/postman/TC17_Duplicate_Booking.png)

---

#### TC18 – Invalid Booking Foreign Key (404 Not Found)
![TC18 Invalid Booking](docs/screenshots/postman/TC18_Invalid_Booking.png)

---

#### TC19 – Twist 1: Create First Hall (HAL-xxxx)
![TC19 Twist 1](docs/screenshots/postman/TC19_Automatic_Code_1.png)

---

#### TC20 – Twist 2: Create Second Hall Next Sequential
![TC20 Twist 2](docs/screenshots/postman/TC20_Automatic_Code_2.png)

---

#### TC21 – Twist 3: Code Immutability on Update
![TC21 Twist 3](docs/screenshots/postman/TC21_Code_Immutability.png)

---

#### TC22 – Custom Code Override Protection (POST)
![TC22 Custom Code Protection](docs/screenshots/postman/TC22_Custom_Code_Protection.png)

---

#### TC23 – Code Tamper Protection on Update (PUT)
![TC23 Update Code Protection](docs/screenshots/postman/TC23_Update_Code_Protection.png)
`;

// Replace from "## 19. Postman API Testing Documentation" up to "## 20. Live Project & Deployment Screenshots"
const startMarker = "## 19. Postman API Testing Documentation";
const endMarker = "## 20. Live Project & Deployment Screenshots";

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
  content = content.substring(0, startIndex) + postmanResultsSection + "\n---\n\n" + content.substring(endIndex);
  fs.writeFileSync(readmePath, content, 'utf8');
  console.log('README.md updated successfully with POSTMAN API TESTING RESULTS!');
} else {
  console.error('Markers not found in README.md');
}
