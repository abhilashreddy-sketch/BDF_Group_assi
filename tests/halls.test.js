const request = require('supertest');
const path = require('path');
const fs = require('fs');

const testDbPath = path.join(__dirname, '../database/test_halls.db');
process.env.NODE_ENV = 'test';
process.env.DB_PATH = testDbPath;

const app = require('../app');
const db = require('../config/db');

describe('Hall REST APIs', () => {
  beforeEach(() => {
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
      // Best effort cleanup
    }
  });

  describe('GET /halls', () => {
    test('returns empty array when no halls exist', async () => {
      const res = await request(app).get('/halls');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(0);
    });

    test('returns all halls with status 200', async () => {
      await request(app).post('/halls').send({ name: 'Hall 1', building: 'Block A' });
      await request(app).post('/halls').send({ name: 'Hall 2', building: 'Block B' });

      const res = await request(app).get('/halls');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
      expect(res.body[0].code).toBe('HAL-0001');
      expect(res.body[1].code).toBe('HAL-0002');
    });

    test('filters halls by building query parameter case-insensitively', async () => {
      await request(app).post('/halls').send({ name: 'Hall A1', building: 'Block A' });
      await request(app).post('/halls').send({ name: 'Hall A2', building: 'block a' });
      await request(app).post('/halls').send({ name: 'Hall B1', building: 'Block B' });

      const res = await request(app).get('/halls?building=block%20a');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
      expect(res.body[0].building.toLowerCase()).toBe('block a');
      expect(res.body[1].building.toLowerCase()).toBe('block a');
    });

    test('returns empty array when search finds no matching building', async () => {
      await request(app).post('/halls').send({ name: 'Hall A1', building: 'Block A' });
      const res = await request(app).get('/halls?building=NonExistent');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  describe('GET /halls/:id', () => {
    test('returns single hall by ID', async () => {
      const createRes = await request(app).post('/halls').send({ name: 'Main Auditorium', building: 'Block C' });
      const hallId = createRes.body.id;

      const res = await request(app).get(`/halls/${hallId}`);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(hallId);
      expect(res.body.name).toBe('Main Auditorium');
      expect(res.body.code).toBe('HAL-0001');
    });

    test('returns 404 if hall does not exist', async () => {
      const res = await request(app).get('/halls/9999');
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error', 'Hall not found');
    });

    test('returns 400 for invalid non-integer hall ID', async () => {
      const res = await request(app).get('/halls/invalid-id');
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'Invalid hall ID');
    });
  });

  describe('POST /halls', () => {
    test('creates hall and automatically assigns sequential code', async () => {
      const res = await request(app).post('/halls').send({
        name: 'Main Seminar Hall',
        building: 'Block A'
      });

      expect(res.status).toBe(201);
      expect(res.body.code).toBe('HAL-0001');
      expect(res.body.name).toBe('Main Seminar Hall');
      expect(res.body.building).toBe('Block A');
      expect(res.body).toHaveProperty('created_at');
      expect(res.body).toHaveProperty('updated_at');
    });

    test('rejects request if name is missing or empty', async () => {
      const res1 = await request(app).post('/halls').send({ building: 'Block A' });
      expect(res1.status).toBe(400);
      expect(res1.body).toHaveProperty('error', 'Hall name is required');

      const res2 = await request(app).post('/halls').send({ name: '   ', building: 'Block A' });
      expect(res2.status).toBe(400);
      expect(res2.body).toHaveProperty('error', 'Hall name is required');
    });

    test('rejects request if building is missing or empty', async () => {
      const res1 = await request(app).post('/halls').send({ name: 'Hall Alpha' });
      expect(res1.status).toBe(400);
      expect(res1.body).toHaveProperty('error', 'Building is required');

      const res2 = await request(app).post('/halls').send({ name: 'Hall Alpha', building: ' ' });
      expect(res2.status).toBe(400);
      expect(res2.body).toHaveProperty('error', 'Building is required');
    });
  });

  describe('PUT /halls/:id', () => {
    test('updates hall name and building and keeps code intact', async () => {
      const created = await request(app).post('/halls').send({ name: 'Old Hall', building: 'Old Block' });

      const res = await request(app).put(`/halls/${created.body.id}`).send({
        name: 'New Hall',
        building: 'New Block'
      });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('New Hall');
      expect(res.body.building).toBe('New Block');
      expect(res.body.code).toBe(created.body.code);
    });

    test('returns 404 when updating non-existent hall', async () => {
      const res = await request(app).put('/halls/8888').send({
        name: 'Ghost Hall',
        building: 'Ghost Block'
      });

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error', 'Hall not found');
    });

    test('validates inputs on PUT', async () => {
      const created = await request(app).post('/halls').send({ name: 'Valid Hall', building: 'Valid Block' });

      const res = await request(app).put(`/halls/${created.body.id}`).send({
        name: '',
        building: 'Valid Block'
      });
      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /halls/:id', () => {
    test('deletes hall successfully when not booked', async () => {
      const created = await request(app).post('/halls').send({ name: 'Hall To Delete', building: 'Block D' });

      const res = await request(app).delete(`/halls/${created.body.id}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'Hall deleted successfully');

      const check = await request(app).get(`/halls/${created.body.id}`);
      expect(check.status).toBe(404);
    });

    test('returns 404 when deleting non-existent hall', async () => {
      const res = await request(app).delete('/halls/7777');
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error', 'Hall not found');
    });

    test('returns 409 conflict when trying to delete hall with bookings', async () => {
      const hallRes = await request(app).post('/halls').send({ name: 'Booked Hall', building: 'Block X' });
      const orgRes = await request(app).post('/organisers').send({ name: 'Org 1', email: 'org1@test.com' });

      await request(app).post('/bookings').send({
        organiser_id: orgRes.body.id,
        hall_id: hallRes.body.id,
        booking_date: '2026-12-01'
      });

      const delRes = await request(app).delete(`/halls/${hallRes.body.id}`);
      expect(delRes.status).toBe(409);
      expect(delRes.body).toHaveProperty('error', 'Cannot delete hall with existing bookings');
    });
  });
});
