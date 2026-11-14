const request = require('supertest');
const path = require('path');
const fs = require('fs');

const testDbPath = path.join(__dirname, '../database/test_bookings.db');
process.env.NODE_ENV = 'test';
process.env.DB_PATH = testDbPath;

const app = require('../app');
const db = require('../config/db');

describe('Booking REST APIs & JOIN Details', () => {
  let organiser;
  let hall;

  beforeEach(async () => {
    db.exec(`
      DELETE FROM bookings;
      DELETE FROM halls;
      DELETE FROM organisers;
      UPDATE hall_sequence SET last_number = 0 WHERE id = 1;
      DELETE FROM sqlite_sequence;
    `);

    // Create a base organiser and hall for booking tests
    const orgRes = await request(app).post('/organisers').send({
      name: 'Abhilash Reddy',
      email: 'abhilash@example.com'
    });
    organiser = orgRes.body;

    const hallRes = await request(app).post('/halls').send({
      name: 'Main Seminar Hall',
      building: 'Block A'
    });
    hall = hallRes.body;
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

  describe('GET /bookings', () => {
    test('returns empty array when no bookings exist', async () => {
      const res = await request(app).get('/bookings');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    test('returns all bookings', async () => {
      await request(app).post('/bookings').send({
        organiser_id: organiser.id,
        hall_id: hall.id,
        booking_date: '2026-11-20'
      });

      const res = await request(app).get('/bookings');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].booking_date).toBe('2026-11-20');
    });
  });

  describe('GET /bookings/details (MANDATORY SQL INNER JOIN ENDPOINT)', () => {
    test('returns complete joined details across bookings, organisers, and halls', async () => {
      const bookRes = await request(app).post('/bookings').send({
        organiser_id: organiser.id,
        hall_id: hall.id,
        booking_date: '2026-11-20'
      });
      expect(bookRes.status).toBe(201);

      const res = await request(app).get('/bookings/details');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);

      const item = res.body[0];
      expect(item).toHaveProperty('booking_id', bookRes.body.id);
      expect(item).toHaveProperty('booking_date', '2026-11-20');
      expect(item).toHaveProperty('organiser_name', 'Abhilash Reddy');
      expect(item).toHaveProperty('organiser_email', 'abhilash@example.com');
      expect(item).toHaveProperty('hall_name', 'Main Seminar Hall');
      expect(item).toHaveProperty('hall_code', 'HAL-0001');
      expect(item).toHaveProperty('building', 'Block A');
    });

    test('returns empty array when no bookings exist', async () => {
      const res = await request(app).get('/bookings/details');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  describe('GET /bookings/:id', () => {
    test('returns single booking by ID', async () => {
      const created = await request(app).post('/bookings').send({
        organiser_id: organiser.id,
        hall_id: hall.id,
        booking_date: '2026-11-25'
      });

      const res = await request(app).get(`/bookings/${created.body.id}`);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(created.body.id);
      expect(res.body.booking_date).toBe('2026-11-25');
    });

    test('returns 404 for non-existent booking', async () => {
      const res = await request(app).get('/bookings/9999');
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error', 'Booking not found');
    });
  });

  describe('POST /bookings', () => {
    test('successfully creates a valid booking', async () => {
      const res = await request(app).post('/bookings').send({
        organiser_id: organiser.id,
        hall_id: hall.id,
        booking_date: '2026-11-20'
      });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.organiser_id).toBe(organiser.id);
      expect(res.body.hall_id).toBe(hall.id);
      expect(res.body.booking_date).toBe('2026-11-20');
      expect(res.body).toHaveProperty('created_at');
    });

    test('returns 404 if organiser does not exist', async () => {
      const res = await request(app).post('/bookings').send({
        organiser_id: 9999,
        hall_id: hall.id,
        booking_date: '2026-11-20'
      });

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error', 'Organiser not found');
    });

    test('returns 404 if hall does not exist', async () => {
      const res = await request(app).post('/bookings').send({
        organiser_id: organiser.id,
        hall_id: 9999,
        booking_date: '2026-11-20'
      });

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error', 'Hall not found');
    });

    test('prevents duplicate booking for the same hall on the same date (409 Conflict)', async () => {
      // First booking succeeds
      await request(app).post('/bookings').send({
        organiser_id: organiser.id,
        hall_id: hall.id,
        booking_date: '2026-11-20'
      });

      // Second booking attempt for same hall on same date must fail with 409
      const secondOrg = await request(app).post('/organisers').send({
        name: 'Second Club',
        email: 'club2@example.com'
      });

      const conflictRes = await request(app).post('/bookings').send({
        organiser_id: secondOrg.body.id,
        hall_id: hall.id,
        booking_date: '2026-11-20'
      });

      expect(conflictRes.status).toBe(409);
      expect(conflictRes.body).toHaveProperty('error', 'Hall is already booked for this date');
    });

    test('allows booking different halls on the same date', async () => {
      const hall2 = await request(app).post('/halls').send({ name: 'Seminar Hall 2', building: 'Block B' });

      const res1 = await request(app).post('/bookings').send({
        organiser_id: organiser.id,
        hall_id: hall.id,
        booking_date: '2026-11-20'
      });
      expect(res1.status).toBe(201);

      const res2 = await request(app).post('/bookings').send({
        organiser_id: organiser.id,
        hall_id: hall2.body.id,
        booking_date: '2026-11-20'
      });
      expect(res2.status).toBe(201);
    });

    test('allows booking the same hall on different dates', async () => {
      const res1 = await request(app).post('/bookings').send({
        organiser_id: organiser.id,
        hall_id: hall.id,
        booking_date: '2026-11-20'
      });
      expect(res1.status).toBe(201);

      const res2 = await request(app).post('/bookings').send({
        organiser_id: organiser.id,
        hall_id: hall.id,
        booking_date: '2026-11-21'
      });
      expect(res2.status).toBe(201);
    });

    test('validates required fields and invalid date formats', async () => {
      // Missing organiser_id
      const res1 = await request(app).post('/bookings').send({
        hall_id: hall.id,
        booking_date: '2026-11-20'
      });
      expect(res1.status).toBe(400);

      // Missing hall_id
      const res2 = await request(app).post('/bookings').send({
        organiser_id: organiser.id,
        booking_date: '2026-11-20'
      });
      expect(res2.status).toBe(400);

      // Invalid date formats
      const invalidDates = ['20-11-2026', 'invalid-date', '2026-02-30', '2026/11/20'];
      for (const date of invalidDates) {
        const resDate = await request(app).post('/bookings').send({
          organiser_id: organiser.id,
          hall_id: hall.id,
          booking_date: date
        });
        expect(resDate.status).toBe(400);
      }
    });
  });

  describe('PUT /bookings/:id', () => {
    test('updates booking date successfully', async () => {
      const created = await request(app).post('/bookings').send({
        organiser_id: organiser.id,
        hall_id: hall.id,
        booking_date: '2026-11-20'
      });

      const res = await request(app).put(`/bookings/${created.body.id}`).send({
        organiser_id: organiser.id,
        hall_id: hall.id,
        booking_date: '2026-11-22'
      });

      expect(res.status).toBe(200);
      expect(res.body.booking_date).toBe('2026-11-22');
    });

    test('returns 409 if updated booking conflicts with another booking', async () => {
      // Booking 1
      await request(app).post('/bookings').send({
        organiser_id: organiser.id,
        hall_id: hall.id,
        booking_date: '2026-11-20'
      });

      // Booking 2
      const book2 = await request(app).post('/bookings').send({
        organiser_id: organiser.id,
        hall_id: hall.id,
        booking_date: '2026-11-21'
      });

      // Attempt to move booking 2 to 2026-11-20
      const res = await request(app).put(`/bookings/${book2.body.id}`).send({
        organiser_id: organiser.id,
        hall_id: hall.id,
        booking_date: '2026-11-20'
      });

      expect(res.status).toBe(409);
      expect(res.body).toHaveProperty('error', 'Hall is already booked for this date');
    });

    test('returns 404 when updating non-existent booking', async () => {
      const res = await request(app).put('/bookings/9999').send({
        organiser_id: organiser.id,
        hall_id: hall.id,
        booking_date: '2026-11-20'
      });

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error', 'Booking not found');
    });
  });

  describe('DELETE /bookings/:id', () => {
    test('deletes booking successfully', async () => {
      const created = await request(app).post('/bookings').send({
        organiser_id: organiser.id,
        hall_id: hall.id,
        booking_date: '2026-11-20'
      });

      const res = await request(app).delete(`/bookings/${created.body.id}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'Booking deleted successfully');

      const check = await request(app).get(`/bookings/${created.body.id}`);
      expect(check.status).toBe(404);
    });

    test('returns 404 when deleting non-existent booking', async () => {
      const res = await request(app).delete('/bookings/9999');
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error', 'Booking not found');
    });
  });
});
