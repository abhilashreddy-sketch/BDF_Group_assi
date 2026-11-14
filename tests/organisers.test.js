const request = require('supertest');
const path = require('path');
const fs = require('fs');

const testDbPath = path.join(__dirname, '../database/test_organisers.db');
process.env.NODE_ENV = 'test';
process.env.DB_PATH = testDbPath;

const app = require('../app');
const db = require('../config/db');

describe('Organiser REST APIs', () => {
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

  describe('GET /organisers', () => {
    test('returns empty array when no organisers exist', async () => {
      const res = await request(app).get('/organisers');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(0);
    });

    test('returns all organisers', async () => {
      await request(app).post('/organisers').send({ name: 'Org 1', email: 'org1@uni.edu' });
      await request(app).post('/organisers').send({ name: 'Org 2', email: 'org2@uni.edu' });

      const res = await request(app).get('/organisers');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
      expect(res.body[0].name).toBe('Org 1');
      expect(res.body[1].name).toBe('Org 2');
    });
  });

  describe('GET /organisers/:id', () => {
    test('returns single organiser by ID', async () => {
      const created = await request(app).post('/organisers').send({
        name: 'Abhilash Reddy',
        email: 'abhilash@example.com'
      });

      const res = await request(app).get(`/organisers/${created.body.id}`);
      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Abhilash Reddy');
      expect(res.body.email).toBe('abhilash@example.com');
    });

    test('returns 404 if organiser not found', async () => {
      const res = await request(app).get('/organisers/9999');
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error', 'Organiser not found');
    });

    test('returns 400 for invalid ID parameter', async () => {
      const res = await request(app).get('/organisers/xyz');
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'Invalid organiser ID');
    });
  });

  describe('POST /organisers', () => {
    test('creates organiser with valid payload', async () => {
      const res = await request(app).post('/organisers').send({
        name: 'Abhilash Reddy',
        email: 'abhilash@example.com'
      });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('Abhilash Reddy');
      expect(res.body.email).toBe('abhilash@example.com');
      expect(res.body).toHaveProperty('created_at');
    });

    test('rejects creation if name is missing or empty', async () => {
      const res1 = await request(app).post('/organisers').send({ email: 'test@example.com' });
      expect(res1.status).toBe(400);
      expect(res1.body).toHaveProperty('error', 'Organiser name is required');

      const res2 = await request(app).post('/organisers').send({ name: '   ', email: 'test@example.com' });
      expect(res2.status).toBe(400);
      expect(res2.body).toHaveProperty('error', 'Organiser name is required');
    });

    test('rejects creation if email is missing or empty', async () => {
      const res = await request(app).post('/organisers').send({ name: 'Test Org' });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'Organiser email is required');
    });

    test('rejects invalid email formats', async () => {
      const badEmails = ['plainaddress', '@missingusername.com', 'user@.com', 'user@domain'];
      for (const email of badEmails) {
        const res = await request(app).post('/organisers').send({ name: 'Test Org', email });
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', 'Invalid email format');
      }
    });

    test('prevents duplicate email registration (409 Conflict)', async () => {
      await request(app).post('/organisers').send({
        name: 'First Org',
        email: 'common@example.com'
      });

      const res = await request(app).post('/organisers').send({
        name: 'Second Org',
        email: 'COMMON@example.com'
      });

      expect(res.status).toBe(409);
      expect(res.body).toHaveProperty('error', 'An organiser with this email already exists');
    });
  });

  describe('PUT /organisers/:id', () => {
    test('updates organiser details successfully', async () => {
      const created = await request(app).post('/organisers').send({
        name: 'Old Name',
        email: 'old@example.com'
      });

      const res = await request(app).put(`/organisers/${created.body.id}`).send({
        name: 'New Name',
        email: 'new@example.com'
      });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('New Name');
      expect(res.body.email).toBe('new@example.com');
    });

    test('returns 404 for non-existent organiser', async () => {
      const res = await request(app).put('/organisers/8888').send({
        name: 'Ghost Org',
        email: 'ghost@example.com'
      });
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error', 'Organiser not found');
    });

    test('returns 409 if updating to an email already used by another organiser', async () => {
      const org1 = await request(app).post('/organisers').send({ name: 'Org 1', email: 'org1@example.com' });
      const org2 = await request(app).post('/organisers').send({ name: 'Org 2', email: 'org2@example.com' });

      const res = await request(app).put(`/organisers/${org2.body.id}`).send({
        name: 'Org 2 Updated',
        email: 'org1@example.com'
      });

      expect(res.status).toBe(409);
      expect(res.body).toHaveProperty('error', 'An organiser with this email already exists');
    });

    test('allows updating name while keeping identical email', async () => {
      const org = await request(app).post('/organisers').send({ name: 'Org Name', email: 'same@example.com' });

      const res = await request(app).put(`/organisers/${org.body.id}`).send({
        name: 'Org Renamed',
        email: 'same@example.com'
      });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Org Renamed');
    });
  });

  describe('DELETE /organisers/:id', () => {
    test('deletes organiser successfully when not associated with bookings', async () => {
      const org = await request(app).post('/organisers').send({ name: 'To Delete', email: 'delete@test.com' });

      const res = await request(app).delete(`/organisers/${org.body.id}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'Organiser deleted successfully');

      const check = await request(app).get(`/organisers/${org.body.id}`);
      expect(check.status).toBe(404);
    });

    test('returns 404 when deleting non-existent organiser', async () => {
      const res = await request(app).delete('/organisers/7777');
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error', 'Organiser not found');
    });

    test('returns 409 conflict when deleting organiser with bookings', async () => {
      const org = await request(app).post('/organisers').send({ name: 'Booker', email: 'booker@test.com' });
      const hall = await request(app).post('/halls').send({ name: 'Hall X', building: 'Block X' });

      await request(app).post('/bookings').send({
        organiser_id: org.body.id,
        hall_id: hall.body.id,
        booking_date: '2026-11-20'
      });

      const delRes = await request(app).delete(`/organisers/${org.body.id}`);
      expect(delRes.status).toBe(409);
      expect(delRes.body).toHaveProperty('error', 'Cannot delete organiser with existing bookings');
    });
  });
});
