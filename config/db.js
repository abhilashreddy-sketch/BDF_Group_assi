const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

let dbInstance = null;

/**
 * Initializes and returns the SQLite database instance.
 * @param {string} [customPath] Optional custom database file path or ':memory:'
 * @returns {Database.Database} The connected better-sqlite3 database instance
 */
function getDb(customPath) {
  if (dbInstance && !customPath) {
    return dbInstance;
  }

  const dbPath = customPath || process.env.DB_PATH || path.join(__dirname, '../database/eventspark.db');

  if (dbPath !== ':memory:') {
    const dir = path.dirname(path.resolve(dbPath));
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  const db = new Database(dbPath);

  // Enable foreign key constraints
  db.pragma('foreign_keys = ON');

  // Load and execute schema
  const schemaPath = path.join(__dirname, '../database/schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schemaSql);

  // Synchronize hall_sequence if existing halls have higher code
  const maxHall = db.prepare(`
    SELECT MAX(CAST(SUBSTR(code, 5) AS INTEGER)) AS max_code 
    FROM halls 
    WHERE code LIKE 'HAL-%'
  `).get();

  if (maxHall && maxHall.max_code) {
    const seqRow = db.prepare('SELECT last_number FROM hall_sequence WHERE id = 1').get();
    if (seqRow && seqRow.last_number < maxHall.max_code) {
      db.prepare('UPDATE hall_sequence SET last_number = ? WHERE id = 1').run(maxHall.max_code);
    }
  }

  // Seed initial demo data if database is brand new (for deployment and development)
  if (process.env.NODE_ENV !== 'test') {
    try {
      const hallCount = db.prepare('SELECT COUNT(*) AS count FROM halls').get().count;
      if (hallCount === 0) {
        const now = new Date().toISOString();
        
        // 1. Seed Organiser
        const orgInfo = db.prepare(`
          INSERT INTO organisers (name, email, created_at) 
          VALUES (?, ?, ?)
        `).run('Abhilash Reddy', 'abhilash@example.com', now);
        
        // 2. Seed Halls (HAL-0001 and HAL-0002)
        const hallStmt = db.prepare(`
          INSERT INTO halls (code, name, building, created_at, updated_at) 
          VALUES (?, ?, ?, ?, ?)
        `);
        const h1 = hallStmt.run('HAL-0001', 'Main Seminar Hall', 'Block A', now, now);
        hallStmt.run('HAL-0002', 'Conference Hall', 'Block B', now, now);
        
        // Advance sequence tracker
        db.prepare('UPDATE hall_sequence SET last_number = 2 WHERE id = 1').run();
        
        // 3. Seed Booking
        db.prepare(`
          INSERT INTO bookings (organiser_id, hall_id, booking_date, created_at) 
          VALUES (?, ?, ?, ?)
        `).run(orgInfo.lastInsertRowid, h1.lastInsertRowid, '2026-11-20', now);
      }
    } catch {
      // Ignore if already populated
    }
  }

  if (!customPath) {
    dbInstance = db;
  }

  return db;
}

/**
 * Closes the current database connection if open.
 */
function closeDb() {
  if (dbInstance) {
    try {
      dbInstance.close();
    } catch {
      // Ignore if already closed
    }
    dbInstance = null;
  }
}

// Initialize default instance
const db = getDb();

module.exports = db;
module.exports.getDb = getDb;
module.exports.closeDb = closeDb;
