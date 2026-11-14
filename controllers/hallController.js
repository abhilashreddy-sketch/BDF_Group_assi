const db = require('../config/db');

/**
 * Controller for Seminar Hall operations.
 */

/**
 * GET /halls
 * Retrieves all halls or searches by building query parameter (case-insensitive).
 */
function getAllHalls(req, res, next) {
  try {
    const { building } = req.query;

    if (building !== undefined && building !== null && building.trim() !== '') {
      const halls = db.prepare(`
        SELECT * FROM halls 
        WHERE LOWER(building) = LOWER(?) 
        ORDER BY id ASC
      `).all(building.trim());
      return res.status(200).json(halls);
    }

    const halls = db.prepare('SELECT * FROM halls ORDER BY id ASC').all();
    return res.status(200).json(halls);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /halls/:id
 * Retrieves a single hall by ID.
 */
function getHallById(req, res, next) {
  try {
    const { id } = req.params;
    const hall = db.prepare('SELECT * FROM halls WHERE id = ?').get(id);

    if (!hall) {
      return res.status(404).json({ error: 'Hall not found' });
    }

    return res.status(200).json(hall);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /halls
 * Creates a new hall with an automatically generated sequential code (e.g. HAL-0001).
 * The client cannot specify or modify the hall code.
 */
function createHall(req, res, next) {
  try {
    const { name, building } = req.body;

    // Transaction guarantees atomic and concurrency-safe code generation & insertion
    const createTransaction = db.transaction((hallName, hallBuilding) => {
      // Sequence tracker table query
      const seqRow = db.prepare('SELECT last_number FROM hall_sequence WHERE id = 1').get();
      // Also check max code in halls to be completely resilient against any external modifications
      const maxHall = db.prepare(`
        SELECT MAX(CAST(SUBSTR(code, 5) AS INTEGER)) AS max_code 
        FROM halls 
        WHERE code LIKE 'HAL-%'
      `).get();

      let currentMax = 0;
      if (seqRow && typeof seqRow.last_number === 'number') {
        currentMax = Math.max(currentMax, seqRow.last_number);
      }
      if (maxHall && typeof maxHall.max_code === 'number') {
        currentMax = Math.max(currentMax, maxHall.max_code);
      }

      const nextNumber = currentMax + 1;
      const generatedCode = `HAL-${String(nextNumber).padStart(4, '0')}`;

      // Advance sequence counter (sequence table never decrements even on delete)
      db.prepare('UPDATE hall_sequence SET last_number = ? WHERE id = 1').run(nextNumber);

      const now = new Date().toISOString();
      const insertResult = db.prepare(`
        INSERT INTO halls (code, name, building, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(generatedCode, hallName, hallBuilding, now, now);

      return db.prepare('SELECT * FROM halls WHERE id = ?').get(insertResult.lastInsertRowid);
    });

    const newHall = createTransaction(name, building);
    return res.status(201).json(newHall);
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /halls/:id
 * Updates an existing hall's name and building.
 * The existing hall code is immutable and cannot be altered.
 */
function updateHall(req, res, next) {
  try {
    const { id } = req.params;
    const { name, building } = req.body;

    const existingHall = db.prepare('SELECT * FROM halls WHERE id = ?').get(id);
    if (!existingHall) {
      return res.status(404).json({ error: 'Hall not found' });
    }

    const now = new Date().toISOString();
    db.prepare(`
      UPDATE halls 
      SET name = ?, building = ?, updated_at = ?
      WHERE id = ?
    `).run(name, building, now, id);

    const updatedHall = db.prepare('SELECT * FROM halls WHERE id = ?').get(id);
    return res.status(200).json(updatedHall);
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /halls/:id
 * Deletes a hall by ID if it has no associated bookings.
 */
function deleteHall(req, res, next) {
  try {
    const { id } = req.params;

    const existingHall = db.prepare('SELECT * FROM halls WHERE id = ?').get(id);
    if (!existingHall) {
      return res.status(404).json({ error: 'Hall not found' });
    }

    // Check if hall has existing bookings to preserve booking history
    const bookingCount = db.prepare('SELECT COUNT(*) AS count FROM bookings WHERE hall_id = ?').get(id);
    if (bookingCount && bookingCount.count > 0) {
      return res.status(409).json({ error: 'Cannot delete hall with existing bookings' });
    }

    db.prepare('DELETE FROM halls WHERE id = ?').run(id);
    return res.status(200).json({ message: 'Hall deleted successfully' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllHalls,
  getHallById,
  createHall,
  updateHall,
  deleteHall
};
