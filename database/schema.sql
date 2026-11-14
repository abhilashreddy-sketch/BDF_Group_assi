-- EventSpark Hall Database Schema
-- Theme 14: Seminar Halls (Group ID: ST-AIDE2A-G14)

-- Enable SQLite Foreign Key enforcement
PRAGMA foreign_keys = ON;

-- Table 1: organisers
CREATE TABLE IF NOT EXISTS organisers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table 2: halls
CREATE TABLE IF NOT EXISTS halls (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  building TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table 3: bookings
CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organiser_id INTEGER NOT NULL,
  hall_id INTEGER NOT NULL,
  booking_date TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organiser_id) REFERENCES organisers(id) ON DELETE RESTRICT,
  FOREIGN KEY (hall_id) REFERENCES halls(id) ON DELETE RESTRICT,
  CONSTRAINT uq_hall_booking_date UNIQUE (hall_id, booking_date)
);

-- Dedicated sequence generator table for halls
-- Ensures sequential HAL-0001, HAL-0002... even when halls are deleted
CREATE TABLE IF NOT EXISTS hall_sequence (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  last_number INTEGER NOT NULL DEFAULT 0
);

-- Seed initial sequence row if it does not exist
INSERT OR IGNORE INTO hall_sequence (id, last_number) VALUES (1, 0);

-- Indexes for performance and quick searching
CREATE INDEX IF NOT EXISTS idx_halls_building ON halls(building);
CREATE INDEX IF NOT EXISTS idx_halls_code ON halls(code);
CREATE INDEX IF NOT EXISTS idx_bookings_hall_date ON bookings(hall_id, booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_organiser ON bookings(organiser_id);
