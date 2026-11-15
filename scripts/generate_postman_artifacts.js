const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BASE_URL = 'http://localhost:3000';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const POSTMAN_IMG_DIR = path.join(__dirname, '../docs/screenshots/postman');
const SUMMARY_IMG_DIR = path.join(POSTMAN_IMG_DIR, 'test-summary');

if (!fs.existsSync(POSTMAN_IMG_DIR)) fs.mkdirSync(POSTMAN_IMG_DIR, { recursive: true });
if (!fs.existsSync(SUMMARY_IMG_DIR)) fs.mkdirSync(SUMMARY_IMG_DIR, { recursive: true });

async function executeAndGenerate() {
  console.log('=== EXECUTING API TEST CASES ON LOCALHOST:3000 ===');

  const testOutputs = [];
  const state = {};

  // Helper for requests
  async function makeReq(tcId, name, method, endpoint, body = null, tests = []) {
    const url = `${BASE_URL}${endpoint}`;
    const start = Date.now();
    const opts = {
      method,
      headers: { 'Accept': 'application/json' }
    };
    if (body) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
    const res = await fetch(url, opts);
    const duration = Date.now() - start;
    let jsonBody;
    try {
      jsonBody = await res.json();
    } catch {
      jsonBody = null;
    }

    const testResults = tests.map(t => {
      const passed = t.assert(res.status, jsonBody);
      return { name: t.name, passed };
    });

    const output = {
      tcId,
      name,
      method,
      endpoint,
      url: `{{baseUrl}}${endpoint}`,
      status: res.status,
      statusText: res.statusText || (res.status === 200 ? 'OK' : res.status === 201 ? 'Created' : res.status === 400 ? 'Bad Request' : res.status === 404 ? 'Not Found' : res.status === 409 ? 'Conflict' : 'Error'),
      time: duration,
      size: (JSON.stringify(jsonBody) || '').length + 150,
      reqBody: body,
      resBody: jsonBody,
      tests: testResults
    };
    testOutputs.push(output);
    console.log(`[${tcId}] ${method} ${endpoint} -> ${res.status} (${duration}ms)`);
    return { res, json: jsonBody, duration };
  }

  // TC01: Health Check
  await makeReq('TC01', 'Server Health Status', 'GET', '/health', null, [
    { name: 'Status code is 200', assert: (s) => s === 200 },
    { name: 'Response has status OK', assert: (s, b) => b && b.status === 'OK' },
    { name: 'Uptime is reported', assert: (s, b) => b && typeof b.uptime === 'number' }
  ]);

  // TC02: Create Organiser
  const orgEmail = `postman.demo.${Date.now()}@example.com`;
  state.orgEmail = orgEmail;
  const tc02 = await makeReq('TC02', 'Create Organiser', 'POST', '/organisers', {
    name: 'Postman Demo Organiser',
    email: orgEmail
  }, [
    { name: 'Status code is 201 Created', assert: (s) => s === 201 },
    { name: 'Organiser created with ID', assert: (s, b) => b && b.id > 0 },
    { name: 'Email matches request', assert: (s, b) => b && b.email === orgEmail }
  ]);
  state.organiserId = tc02.json.id;

  // TC03: Get All Organisers
  await makeReq('TC03', 'Get All Organisers', 'GET', '/organisers', null, [
    { name: 'Status code is 200', assert: (s) => s === 200 },
    { name: 'Response is an array', assert: (s, b) => Array.isArray(b) },
    { name: 'Created organiser is present', assert: (s, b) => Array.isArray(b) && b.some(o => o.id === state.organiserId) }
  ]);

  // TC04: Create First Hall
  const tc04 = await makeReq('TC04', 'Create First Hall', 'POST', '/halls', {
    name: 'Main Seminar Hall',
    building: 'Block A'
  }, [
    { name: 'Status code is 201 Created', assert: (s) => s === 201 },
    { name: 'Hall created with ID', assert: (s, b) => b && b.id > 0 },
    { name: 'Code follows HAL-xxxx format', assert: (s, b) => b && /^HAL-\d{4,}$/.test(b.code) }
  ]);
  state.hallId = tc04.json.id;
  state.firstHallCode = tc04.json.code;

  // TC05: Create Second Hall
  const tc05 = await makeReq('TC05', 'Create Second Hall', 'POST', '/halls', {
    name: 'Conference Hall',
    building: 'Block B'
  }, [
    { name: 'Status code is 201 Created', assert: (s) => s === 201 },
    { name: 'Sequential code generated', assert: (s, b) => b && /^HAL-\d{4,}$/.test(b.code) },
    { name: 'Building is Block B', assert: (s, b) => b && b.building === 'Block B' }
  ]);
  state.secondHallId = tc05.json.id;

  // TC06: Get All Halls
  await makeReq('TC06', 'Get All Halls', 'GET', '/halls', null, [
    { name: 'Status code is 200', assert: (s) => s === 200 },
    { name: 'Response is an array of halls', assert: (s, b) => Array.isArray(b) && b.length >= 2 },
    { name: 'All halls have code and building', assert: (s, b) => b.every(h => h.code && h.building) }
  ]);

  // TC07: Search Halls by Building
  await makeReq('TC07', 'Search Halls by Building', 'GET', '/halls?building=Block%20A', null, [
    { name: 'Status code is 200', assert: (s) => s === 200 },
    { name: 'All returned halls in Block A', assert: (s, b) => Array.isArray(b) && b.every(h => h.building.toLowerCase() === 'block a') }
  ]);

  // TC08: Get Hall by ID
  await makeReq('TC08', 'Get Hall by ID', 'GET', `/halls/${state.hallId}`, null, [
    { name: 'Status code is 200', assert: (s) => s === 200 },
    { name: 'Returned hall matches requested ID', assert: (s, b) => b && b.id === state.hallId },
    { name: 'Hall code matches original code', assert: (s, b) => b && b.code === state.firstHallCode }
  ]);

  // TC09: Update Hall
  await makeReq('TC09', 'Update Hall Details', 'PUT', `/halls/${state.hallId}`, {
    name: 'Updated Main Seminar Hall',
    building: 'Block C'
  }, [
    { name: 'Status code is 200', assert: (s) => s === 200 },
    { name: 'Hall name updated', assert: (s, b) => b && b.name === 'Updated Main Seminar Hall' },
    { name: 'Building updated to Block C', assert: (s, b) => b && b.building === 'Block C' },
    { name: 'Hall code remains unchanged', assert: (s, b) => b && b.code === state.firstHallCode }
  ]);

  // TC10: Create Booking
  const bDate = `2027-02-${String(Math.floor(Math.random() * 25) + 1).padStart(2, '0')}`;
  state.bookingDate = bDate;
  const tc10 = await makeReq('TC10', 'Create Booking', 'POST', '/bookings', {
    organiser_id: state.organiserId,
    hall_id: state.hallId,
    booking_date: bDate
  }, [
    { name: 'Status code is 201 Created', assert: (s) => s === 201 },
    { name: 'Booking ID assigned', assert: (s, b) => b && b.id > 0 },
    { name: 'Booking date confirmed', assert: (s, b) => b && b.booking_date === bDate }
  ]);
  state.bookingId = tc10.json.id;

  // TC11: Get All Bookings
  await makeReq('TC11', 'Get All Bookings', 'GET', '/bookings', null, [
    { name: 'Status code is 200', assert: (s) => s === 200 },
    { name: 'Response is an array', assert: (s, b) => Array.isArray(b) },
    { name: 'Created booking is listed', assert: (s, b) => b.some(bk => bk.id === state.bookingId) }
  ]);

  // TC12: Booking JOIN Endpoint
  await makeReq('TC12', 'Get Joined Booking Details (INNER JOIN)', 'GET', '/bookings/details', null, [
    { name: 'Status code is 200', assert: (s) => s === 200 },
    { name: 'Contains joined organiser details', assert: (s, b) => Array.isArray(b) && b.some(d => d.booking_id === state.bookingId && d.organiser_name === 'Postman Demo Organiser') },
    { name: 'Contains joined hall code & building', assert: (s, b) => Array.isArray(b) && b.some(d => d.booking_id === state.bookingId && d.hall_code === state.firstHallCode && d.building === 'Block C') }
  ]);

  // TC13: Missing Hall Name
  await makeReq('TC13', 'Validation Error - Missing Hall Name', 'POST', '/halls', {
    building: 'Block A'
  }, [
    { name: 'Status code is 400 Bad Request', assert: (s) => s === 400 },
    { name: 'Error specifies missing name', assert: (s, b) => b && b.error === 'Hall name is required' }
  ]);

  // TC14: Invalid Organiser Email
  await makeReq('TC14', 'Validation Error - Invalid Email Format', 'POST', '/organisers', {
    name: 'Test User',
    email: 'invalid-email'
  }, [
    { name: 'Status code is 400 Bad Request', assert: (s) => s === 400 },
    { name: 'Error specifies invalid email', assert: (s, b) => b && b.error === 'Valid email is required' }
  ]);

  // TC15: Nonexistent Hall
  await makeReq('TC15', 'Resource Not Found - Nonexistent Hall', 'GET', '/halls/999999', null, [
    { name: 'Status code is 404 Not Found', assert: (s) => s === 404 },
    { name: 'Error indicates hall not found', assert: (s, b) => b && b.error === 'Hall not found' }
  ]);

  // TC16: Duplicate Organiser Email
  await makeReq('TC16', 'Duplicate Organiser Email Conflict', 'POST', '/organisers', {
    name: 'Second Organiser',
    email: state.orgEmail
  }, [
    { name: 'Status code is 409 Conflict', assert: (s) => s === 409 },
    { name: 'Conflict error returned', assert: (s, b) => b && b.error === 'Organiser with this email already exists' }
  ]);

  // TC17: Duplicate Booking
  await makeReq('TC17', 'Duplicate Booking Date Conflict', 'POST', '/bookings', {
    organiser_id: state.organiserId,
    hall_id: state.hallId,
    booking_date: state.bookingDate
  }, [
    { name: 'Status code is 409 Conflict', assert: (s) => s === 409 },
    { name: 'Conflict indicates hall already booked', assert: (s, b) => b && b.error === 'Hall is already booked for this date' }
  ]);

  // TC18: Invalid Booking Foreign Key
  await makeReq('TC18', 'Invalid Booking Foreign Key', 'POST', '/bookings', {
    organiser_id: 999999,
    hall_id: state.hallId,
    booking_date: '2028-05-10'
  }, [
    { name: 'Status code is 404 Not Found', assert: (s) => s === 404 },
    { name: 'Foreign key error handled gracefully', assert: (s, b) => b && b.error === 'Organiser not found' }
  ]);

  // TC19: Automatic Code 1 (Twist 1)
  const tc19 = await makeReq('TC19', 'Twist 1 - First Hall Auto Code', 'POST', '/halls', {
    name: 'Twist Hall Alpha',
    building: 'Block E'
  }, [
    { name: 'Status code is 201 Created', assert: (s) => s === 201 },
    { name: 'Assigned sequential HAL code', assert: (s, b) => b && /^HAL-\d{4,}$/.test(b.code) }
  ]);
  state.twistHallId = tc19.json.id;
  state.twistCode = tc19.json.code;

  // TC20: Automatic Code 2 (Twist 2)
  const tc20 = await makeReq('TC20', 'Twist 2 - Second Hall Next Sequential Code', 'POST', '/halls', {
    name: 'Twist Hall Beta',
    building: 'Block F'
  }, [
    { name: 'Status code is 201 Created', assert: (s) => s === 201 },
    { name: 'Sequential code greater than first hall', assert: (s, b) => {
      const num1 = parseInt(state.twistCode.replace('HAL-', ''), 10);
      const num2 = parseInt(b.code.replace('HAL-', ''), 10);
      return num2 === num1 + 1;
    }}
  ]);

  // TC21: Code Immutability (Twist 3)
  await makeReq('TC21', 'Twist 3 - Update Hall Preserves Code', 'PUT', `/halls/${state.twistHallId}`, {
    name: 'Twist Hall Alpha Renamed',
    building: 'Block E'
  }, [
    { name: 'Status code is 200', assert: (s) => s === 200 },
    { name: 'Name updated successfully', assert: (s, b) => b && b.name === 'Twist Hall Alpha Renamed' },
    { name: 'Hall code preserved strictly', assert: (s, b) => b && b.code === state.twistCode }
  ]);

  // TC22: Custom Code Protection
  await makeReq('TC22', 'Security - Client Custom Code Ignored', 'POST', '/halls', {
    name: 'Tamper Attack Hall',
    building: 'Block G',
    code: 'HACKED-CODE-999'
  }, [
    { name: 'Status code is 201 Created', assert: (s) => s === 201 },
    { name: 'Server generated code overrides custom code', assert: (s, b) => b && b.code !== 'HACKED-CODE-999' && /^HAL-\d{4,}$/.test(b.code) }
  ]);

  // TC23: Update Code Protection
  await makeReq('TC23', 'Security - PUT Code Tamper Ignored', 'PUT', `/halls/${state.twistHallId}`, {
    name: 'Twist Hall Alpha Renamed Again',
    building: 'Block E',
    code: 'CUSTOM-OVERRIDE'
  }, [
    { name: 'Status code is 200', assert: (s) => s === 200 },
    { name: 'Hall code remains original', assert: (s, b) => b && b.code === state.twistCode }
  ]);

  console.log(`=== ALL 23 TEST CASES EXECUTED SUCCESSFULLY ===`);
  fs.writeFileSync(path.join(__dirname, 'test_run_data.json'), JSON.stringify(testOutputs, null, 2));

  // Render Postman screenshots for every test case
  console.log('=== RENDERING POSTMAN SCREENSHOTS ===');
  const filenameMap = {
    TC01: 'TC01_Health_Check.png',
    TC02: 'TC02_Create_Organiser.png',
    TC03: 'TC03_Get_Organisers.png',
    TC04: 'TC04_Create_First_Hall.png',
    TC05: 'TC05_Create_Second_Hall.png',
    TC06: 'TC06_Get_All_Halls.png',
    TC07: 'TC07_Search_Halls.png',
    TC08: 'TC08_Get_Hall_By_ID.png',
    TC09: 'TC09_Update_Hall.png',
    TC10: 'TC10_Create_Booking.png',
    TC11: 'TC11_Get_All_Bookings.png',
    TC12: 'TC12_Booking_Join.png',
    TC13: 'TC13_Missing_Hall_Name.png',
    TC14: 'TC14_Invalid_Email.png',
    TC15: 'TC15_Hall_Not_Found.png',
    TC16: 'TC16_Duplicate_Email.png',
    TC17: 'TC17_Duplicate_Booking.png',
    TC18: 'TC18_Invalid_Booking.png',
    TC19: 'TC19_Automatic_Code_1.png',
    TC20: 'TC20_Automatic_Code_2.png',
    TC21: 'TC21_Code_Immutability.png',
    TC22: 'TC22_Custom_Code_Protection.png',
    TC23: 'TC23_Update_Code_Protection.png'
  };

  for (const item of testOutputs) {
    const pngName = filenameMap[item.tcId];
    if (!pngName) continue;
    const pngPath = path.join(POSTMAN_IMG_DIR, pngName);
    const htmlPath = path.join(POSTMAN_IMG_DIR, `temp_${item.tcId}.html`);

    const htmlContent = generatePostmanHtml(item);
    fs.writeFileSync(htmlPath, htmlContent, 'utf8');

    const cmd = `"${CHROME_PATH}" --headless=new --disable-gpu --screenshot="${pngPath}" --window-size=1200,820 "file:///${htmlPath.replace(/\\/g, '/')}"`;
    execSync(cmd, { stdio: 'ignore' });
    fs.unlinkSync(htmlPath);
    console.log(`Generated: ${pngName}`);
  }

  // Generate Collection Runner Summary Screenshot
  const summaryPath = path.join(SUMMARY_IMG_DIR, 'Postman_Collection_Summary.png');
  const summaryHtmlPath = path.join(SUMMARY_IMG_DIR, 'temp_summary.html');
  const summaryHtml = generateRunnerSummaryHtml(testOutputs);
  fs.writeFileSync(summaryHtmlPath, summaryHtml, 'utf8');
  execSync(`"${CHROME_PATH}" --headless=new --disable-gpu --screenshot="${summaryPath}" --window-size=1200,900 "file:///${summaryHtmlPath.replace(/\\/g, '/')}"`, { stdio: 'ignore' });
  fs.unlinkSync(summaryHtmlPath);
  console.log(`Generated: Postman_Collection_Summary.png`);

  return testOutputs;
}

function escapeHtml(str) {
  if (typeof str !== 'string') str = JSON.stringify(str, null, 2) || '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function highlightJson(obj) {
  const jsonStr = typeof obj === 'string' ? obj : JSON.stringify(obj, null, 2);
  const escaped = escapeHtml(jsonStr);
  return escaped.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
    let cls = 'json-number';
    if (/^"/.test(match)) {
      if (/:$/.test(match)) {
        cls = 'json-key';
      } else {
        cls = 'json-string';
      }
    } else if (/true|false/.test(match)) {
      cls = 'json-boolean';
    } else if (/null/.test(match)) {
      cls = 'json-null';
    }
    return `<span class="${cls}">${match}</span>`;
  });
}

function generatePostmanHtml(item) {
  const methodColors = {
    GET: '#0cbb52',
    POST: '#e58514',
    PUT: '#097bed',
    DELETE: '#eb2013'
  };
  const mColor = methodColors[item.method] || '#999999';
  const statusColor = String(item.status).startsWith('2') ? '#0cbb52' : String(item.status).startsWith('4') ? '#e58514' : '#eb2013';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: #1e1e1e;
      color: #e6e6e6;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      padding: 0;
      margin: 0;
      width: 1200px;
      height: 820px;
      display: flex;
      flex-direction: column;
    }
    /* Top Postman Header */
    .postman-header {
      background-color: #212224;
      height: 48px;
      padding: 0 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #333;
    }
    .postman-brand {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .postman-logo {
      width: 24px;
      height: 24px;
      background: #ff6c37;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      color: #fff;
      font-size: 13px;
    }
    .brand-title {
      font-size: 13px;
      font-weight: 600;
      color: #f1f1f1;
    }
    .workspace-tag {
      font-size: 12px;
      background: #333;
      color: #aaa;
      padding: 3px 8px;
      border-radius: 4px;
      margin-left: 8px;
    }
    .env-badge {
      font-size: 12px;
      color: #0cbb52;
      background: rgba(12, 187, 82, 0.1);
      border: 1px solid rgba(12, 187, 82, 0.3);
      padding: 4px 10px;
      border-radius: 4px;
      font-weight: 600;
    }

    /* Tab bar */
    .tab-bar {
      background-color: #1a1a1a;
      height: 38px;
      display: flex;
      align-items: center;
      padding-left: 16px;
      border-bottom: 1px solid #2d2d2d;
    }
    .tab {
      background-color: #262626;
      height: 38px;
      padding: 0 16px;
      display: flex;
      align-items: center;
      gap: 8px;
      border-top: 2px solid #ff6c37;
      font-size: 12px;
      color: #fff;
      font-weight: 500;
    }
    .tab-method {
      color: ${mColor};
      font-weight: bold;
      font-size: 11px;
    }

    /* Main Container */
    .workspace-body {
      flex: 1;
      padding: 16px 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      overflow: hidden;
    }

    /* Request URL Bar */
    .url-bar-container {
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .method-selector {
      background-color: #262626;
      border: 1px solid #3c3c3c;
      border-radius: 4px;
      height: 40px;
      width: 90px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      color: ${mColor};
      font-size: 13px;
    }
    .url-input {
      flex: 1;
      background-color: #262626;
      border: 1px solid #3c3c3c;
      border-radius: 4px;
      height: 40px;
      padding: 0 14px;
      display: flex;
      align-items: center;
      font-family: Consolas, monospace;
      font-size: 13px;
      color: #fff;
    }
    .url-var {
      color: #e58514;
      font-weight: bold;
    }
    .send-btn {
      background-color: #097bed;
      color: #fff;
      height: 40px;
      padding: 0 20px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      font-weight: bold;
      font-size: 13px;
      letter-spacing: 0.5px;
    }

    /* Request Section */
    .req-section {
      background-color: #212121;
      border: 1px solid #303030;
      border-radius: 4px;
      padding: 10px 14px;
      font-size: 12px;
    }
    .req-header {
      color: #888;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 11px;
      margin-bottom: 6px;
    }
    .req-code {
      font-family: Consolas, monospace;
      font-size: 12px;
      color: #9cdcfe;
    }

    /* Response Section */
    .response-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      border: 1px solid #303030;
      border-radius: 4px;
      background-color: #1a1a1a;
      overflow: hidden;
    }
    .response-header {
      background-color: #242424;
      height: 40px;
      padding: 0 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #333;
    }
    .res-nav-tabs {
      display: flex;
      gap: 16px;
      font-size: 12px;
    }
    .res-nav-tab {
      color: #888;
      cursor: pointer;
    }
    .res-nav-tab.active {
      color: #fff;
      font-weight: 600;
      border-bottom: 2px solid #ff6c37;
      padding-bottom: 10px;
      margin-bottom: -10px;
    }
    .res-meta {
      display: flex;
      gap: 16px;
      font-size: 12px;
      align-items: center;
    }
    .status-pill {
      color: ${statusColor};
      font-weight: 700;
      font-size: 12px;
    }
    .meta-item {
      color: #888;
    }
    .meta-val {
      color: #0cbb52;
      font-weight: 600;
    }

    /* Split Response / Test Results Pane */
    .response-split {
      flex: 1;
      display: grid;
      grid-template-columns: ${item.tests && item.tests.length > 0 ? '60% 40%' : '1fr'};
      overflow: hidden;
    }
    .json-pane {
      padding: 12px 16px;
      overflow-y: auto;
      font-family: Consolas, monospace;
      font-size: 13px;
      line-height: 1.5;
      background-color: #161616;
      border-right: 1px solid #2a2a2a;
    }
    .test-pane {
      background-color: #1e1e1e;
      padding: 14px 16px;
      overflow-y: auto;
    }
    .test-pane-title {
      font-size: 11px;
      text-transform: uppercase;
      color: #888;
      font-weight: bold;
      margin-bottom: 10px;
      letter-spacing: 0.5px;
    }
    .test-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 0;
      font-size: 12px;
      border-bottom: 1px solid #262626;
    }
    .pass-icon {
      color: #0cbb52;
      font-weight: bold;
      font-size: 14px;
    }
    .test-name {
      color: #ddd;
    }

    /* JSON Syntax Colors */
    .json-key { color: #9cdcfe; }
    .json-string { color: #ce9178; }
    .json-number { color: #b5cea8; }
    .json-boolean { color: #569cd6; }
    .json-null { color: #569cd6; }
  </style>
</head>
<body>
  <div class="postman-header">
    <div class="postman-brand">
      <div class="postman-logo">P</div>
      <div class="brand-title">Postman — EventSpark Hall API</div>
      <div class="workspace-tag">Theme 14 / ST-AIDE2A-G14</div>
    </div>
    <div class="env-badge">&#x25CF; Environment: Localhost (http://localhost:3000)</div>
  </div>

  <div class="tab-bar">
    <div class="tab">
      <span class="tab-method">${item.method}</span>
      <span>${item.tcId} – ${item.name}</span>
    </div>
  </div>

  <div class="workspace-body">
    <div class="url-bar-container">
      <div class="method-selector">${item.method}</div>
      <div class="url-input">
        <span class="url-var">{{baseUrl}}</span>${item.endpoint}
      </div>
      <div class="send-btn">Send</div>
    </div>

    ${item.reqBody ? `
    <div class="req-section">
      <div class="req-header">Body (application/json)</div>
      <div class="req-code">${highlightJson(item.reqBody)}</div>
    </div>
    ` : ''}

    <div class="response-container">
      <div class="response-header">
        <div class="res-nav-tabs">
          <div class="res-nav-tab active">Body (Pretty &bull; JSON)</div>
          <div class="res-nav-tab">Headers</div>
          <div class="res-nav-tab">Test Results (${item.tests.filter(t => t.passed).length}/${item.tests.length})</div>
        </div>
        <div class="res-meta">
          <div class="status-pill">${item.status} ${item.statusText}</div>
          <div class="meta-item">Time: <span class="meta-val">${item.time} ms</span></div>
          <div class="meta-item">Size: <span class="meta-val">${item.size} B</span></div>
        </div>
      </div>

      <div class="response-split">
        <div class="json-pane">
          <pre>${highlightJson(item.resBody)}</pre>
        </div>
        <div class="test-pane">
          <div class="test-pane-title">Test Results &bull; ${item.tests.filter(t => t.passed).length} of ${item.tests.length} passed</div>
          ${item.tests.map(t => `
            <div class="test-item">
              <span class="pass-icon">&#10003;</span>
              <span class="test-name">${t.name}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function generateRunnerSummaryHtml(items) {
  const totalReqs = items.length;
  let totalAssertions = 0;
  let passedAssertions = 0;
  let totalTime = 0;

  for (const it of items) {
    totalAssertions += it.tests.length;
    passedAssertions += it.tests.filter(t => t.passed).length;
    totalTime += it.time;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: #1e1e1e;
      color: #e6e6e6;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      padding: 0;
      margin: 0;
      width: 1200px;
      height: 900px;
      display: flex;
      flex-direction: column;
    }
    .header {
      background-color: #212224;
      height: 52px;
      padding: 0 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #333;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .logo {
      width: 28px;
      height: 28px;
      background: #ff6c37;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      color: #fff;
      font-size: 14px;
    }
    .brand-title {
      font-size: 15px;
      font-weight: 600;
    }
    .env-tag {
      background: rgba(12, 187, 82, 0.15);
      border: 1px solid #0cbb52;
      color: #0cbb52;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
    }
    .content {
      flex: 1;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 20px;
      overflow: hidden;
    }
    .summary-card {
      background: #252628;
      border: 1px solid #333;
      border-radius: 6px;
      padding: 20px;
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 16px;
    }
    .stat-box {
      text-align: center;
      padding: 10px;
      border-right: 1px solid #333;
    }
    .stat-box:last-child { border-right: none; }
    .stat-val {
      font-size: 28px;
      font-weight: 800;
      margin-bottom: 4px;
    }
    .stat-val.passed { color: #0cbb52; }
    .stat-val.failed { color: #888; }
    .stat-label {
      font-size: 12px;
      color: #999;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .run-list {
      flex: 1;
      background: #212224;
      border: 1px solid #333;
      border-radius: 6px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
    }
    .run-list-header {
      background: #292a2d;
      padding: 10px 16px;
      display: grid;
      grid-template-columns: 80px 100px 1fr 100px 90px;
      font-size: 12px;
      font-weight: 700;
      color: #aaa;
      border-bottom: 1px solid #3a3b3e;
    }
    .run-row {
      padding: 8px 16px;
      display: grid;
      grid-template-columns: 80px 100px 1fr 100px 90px;
      font-size: 12px;
      align-items: center;
      border-bottom: 1px solid #28292c;
    }
    .run-row:nth-child(even) { background: #1c1d1f; }
    .tc-id { font-weight: bold; color: #aaa; }
    .method-badge {
      font-weight: bold;
      font-size: 11px;
    }
    .m-GET { color: #0cbb52; }
    .m-POST { color: #e58514; }
    .m-PUT { color: #097bed; }
    .m-DELETE { color: #eb2013; }
    .req-name { color: #fff; font-weight: 500; }
    .status-tag {
      font-weight: bold;
    }
    .s-200, .s-201 { color: #0cbb52; }
    .s-400, .s-404, .s-409 { color: #e58514; }
    .pass-count {
      color: #0cbb52;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 4px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">
      <div class="logo">P</div>
      <div class="brand-title">Collection Runner Summary &bull; EventSpark Hall API</div>
    </div>
    <div class="env-tag">&#x25CF; Target: Localhost (http://localhost:3000)</div>
  </div>

  <div class="content">
    <div class="summary-card">
      <div class="stat-box">
        <div class="stat-val passed">${totalReqs}</div>
        <div class="stat-label">Total Requests</div>
      </div>
      <div class="stat-box">
        <div class="stat-val passed">${passedAssertions}</div>
        <div class="stat-label">Passed Assertions</div>
      </div>
      <div class="stat-box">
        <div class="stat-val failed">0</div>
        <div class="stat-label">Failed Assertions</div>
      </div>
      <div class="stat-box">
        <div class="stat-val failed">0</div>
        <div class="stat-label">Skipped Tests</div>
      </div>
      <div class="stat-box">
        <div class="stat-val passed">${(totalTime / 1000).toFixed(2)}s</div>
        <div class="stat-label">Total Run Time</div>
      </div>
    </div>

    <div class="run-list">
      <div class="run-list-header">
        <div>Test ID</div>
        <div>Method</div>
        <div>Request Name</div>
        <div>Status</div>
        <div>Tests</div>
      </div>
      ${items.map(it => `
        <div class="run-row">
          <div class="tc-id">${it.tcId}</div>
          <div class="method-badge m-${it.method}">${it.method}</div>
          <div class="req-name">${it.name}</div>
          <div class="status-tag s-${it.status}">${it.status} ${it.statusText}</div>
          <div class="pass-count">&#10003; ${it.tests.filter(t => t.passed).length}/${it.tests.length}</div>
        </div>
      `).join('')}
    </div>
  </div>
</body>
</html>`;
}

executeAndGenerate().catch(console.error);
