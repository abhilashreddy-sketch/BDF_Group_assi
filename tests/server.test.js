const request = require('supertest');
const path = require('path');
const fs = require('fs');

const testDbPath = path.join(__dirname, '../database/test_server.db');
process.env.NODE_ENV = 'test';
process.env.DB_PATH = testDbPath;

const app = require('../app');
const db = require('../config/db');

describe('Server & Infrastructure Tests', () => {
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

  test('GET / returns 200 with JSON welcome response and endpoints', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      message: "Welcome to EventSpark Hall API",
      project: "EventSpark Hall",
      status: "Running",
      version: "1.0.0",
      endpoints: {
        health: "/health",
        halls: "/halls",
        organisers: "/organisers",
        bookings: "/bookings",
        bookingDetails: "/bookings/details"
      }
    });
  });

  test('GET /health returns 200 with service status, timestamp and uptime', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'OK');
    expect(res.body).toHaveProperty('service', 'EventSpark Hall Backend');
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('uptime');
    expect(typeof res.body.uptime).toBe('number');
  });

  test('GET /unknown-route returns 404 with error message', async () => {
    const res = await request(app).get('/non-existent-endpoint');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Route not found' });
  });

  test('Database initialization: foreign key enforcement is ON', () => {
    const fkStatus = db.pragma('foreign_keys', { simple: true });
    expect(fkStatus).toBe(1);
  });

  test('Database initialization: all required tables and indexes exist', () => {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t => t.name);
    expect(tables).toContain('organisers');
    expect(tables).toContain('halls');
    expect(tables).toContain('bookings');
    expect(tables).toContain('hall_sequence');

    const indexes = db.prepare("SELECT name FROM sqlite_master WHERE type='index'").all().map(i => i.name);
    expect(indexes).toContain('idx_halls_building');
    expect(indexes).toContain('idx_halls_code');
    expect(indexes).toContain('idx_bookings_hall_date');
    expect(indexes).toContain('idx_bookings_organiser');
  });
});
