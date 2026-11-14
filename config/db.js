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
