const request = require('supertest');
const path = require('path');
const fs = require('fs');

// Configure test environment before loading app
const testDbPath = path.join(__dirname, '../database/test_twist.db');
process.env.NODE_ENV = 'test';
process.env.DB_PATH = testDbPath;

const app = require('../app');
const db = require('../config/db');

describe('ASSIGNMENT TWIST – Three Mandatory Tests & Code Security', () => {
  beforeAll(() => {
    // Ensure clean state
    db.exec(`
      DELETE FROM bookings;
      DELETE FROM halls;
      DELETE FROM organisers;
      UPDATE hall_sequence SET last_number = 0 WHERE id = 1;
      DELETE FROM sqlite_sequence;
    `);
  });

  afterAll(() => {
    try {
      db.close();
      if (fs.existsSync(testDbPath)) {
        fs.unlinkSync(testDbPath);
      }
    } catch {
      // Cleanup best effort
    }
  });

  // TEST 1: First hall creation
  test('TEST 1: First hall creation must return HTTP 201 and HAL-0001', async () => {
    const res = await request(app)
      .post('/halls')
      .send({
        name: 'Main Hall',
        building: 'Block A'
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id', 1);
    expect(res.body).toHaveProperty('name', 'Main Hall');
    expect(res.body).toHaveProperty('building', 'Block A');
    expect(res.body).toHaveProperty('code', 'HAL-0001');
  });

  // TEST 2: Second hall creation
  test('TEST 2: Second hall creation must return HTTP 201 and HAL-0002', async () => {
    const res = await request(app)
      .post('/halls')
      .send({
        name: 'Conference Hall',
        building: 'Block B'
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id', 2);
    expect(res.body).toHaveProperty('name', 'Conference Hall');
    expect(res.body).toHaveProperty('building', 'Block B');
    expect(res.body).toHaveProperty('code', 'HAL-0002');
  });

  // TEST 3: Update first hall
  test('TEST 3: Updating first hall must return HTTP 200, update name & building, and preserve HAL-0001', async () => {
    const res = await request(app)
      .put('/halls/1')
      .send({
        name: 'Updated Main Hall',
        building: 'Block C'
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', 1);
    expect(res.body).toHaveProperty('name', 'Updated Main Hall');
    expect(res.body).toHaveProperty('building', 'Block C');
    expect(res.body).toHaveProperty('code', 'HAL-0001');
  });

  // Additional security & integrity verification: Custom code override prevention
  test('Attempting to provide custom code in POST /halls must not override server generation', async () => {
    const res = await request(app)
      .post('/halls')
      .send({
        name: 'Seminar Hall 3',
        building: 'Block D',
        code: 'CUSTOM-9999'
      });

    expect(res.status).toBe(201);
    // Should be next sequential code HAL-0003, NOT CUSTOM-9999
    expect(res.body.code).toBe('HAL-0003');
    expect(res.body.name).toBe('Seminar Hall 3');
  });

  test('Attempting to provide custom code in PUT /halls/:id must not change hall code', async () => {
    const res = await request(app)
      .put('/halls/1')
      .send({
        name: 'Renamed Main Hall',
        building: 'Block C',
        code: 'HACKED-CODE-001'
      });

    expect(res.status).toBe(200);
    expect(res.body.code).toBe('HAL-0001');
    expect(res.body.name).toBe('Renamed Main Hall');
  });

  test('Sequence integrity: Sequence does not reuse code even after record deletion', async () => {
    // Delete hall 2 (HAL-0002)
    const delRes = await request(app).delete('/halls/2');
    expect(delRes.status).toBe(200);

    // Create 4th hall
    const res = await request(app)
      .post('/halls')
      .send({
        name: 'Executive Hall',
        building: 'Block E'
      });

    expect(res.status).toBe(201);
    // Sequence must be HAL-0004 (not reusing HAL-0002, not using count of remaining halls)
    expect(res.body.code).toBe('HAL-0004');
  });
});
