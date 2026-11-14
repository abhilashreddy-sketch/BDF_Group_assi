const db = require('../config/db');

/**
 * Controller for Booking operations and JOIN details.
 */

/**
 * GET /bookings
 * Retrieves all bookings.
 */
function getAllBookings(req, res, next) {
  try {
    const bookings = db.prepare('SELECT * FROM bookings ORDER BY id ASC').all();
    return res.status(200).json(bookings);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /bookings/details
 * Mandatory SQL INNER JOIN query retrieving complete booking, organiser and hall information.
 */
function getBookingDetails(req, res, next) {
  try {
    const sql = `
      SELECT 
        b.id AS booking_id,
        b.booking_date,
        o.name AS organiser_name,
        o.email AS organiser_email,
        h.name AS hall_name,
        h.code AS hall_code,
        h.building
      FROM bookings b
      INNER JOIN organisers o ON b.organiser_id = o.id
      INNER JOIN halls h ON b.hall_id = h.id
      ORDER BY b.id ASC
    `;

    const details = db.prepare(sql).all();
    return res.status(200).json(details);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /bookings/:id
 * Retrieves a single booking by ID.
 */
function getBookingById(req, res, next) {
  try {
    const { id } = req.params;
    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    return res.status(200).json(booking);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /bookings
 * Creates a new booking with organiser and hall existence validation,
 * and date conflict prevention for the same hall.
 */
function createBooking(req, res, next) {
  try {
    const { organiser_id, hall_id, booking_date } = req.body;

    // Verify that organiser exists
    const organiser = db.prepare('SELECT id FROM organisers WHERE id = ?').get(organiser_id);
    if (!organiser) {
      return res.status(404).json({ error: 'Organiser not found' });
    }

    // Verify that hall exists
    const hall = db.prepare('SELECT id FROM halls WHERE id = ?').get(hall_id);
    if (!hall) {
      return res.status(404).json({ error: 'Hall not found' });
    }

    // Prevent duplicate booking for the same hall on the same date
    const conflict = db.prepare(`
      SELECT id FROM bookings 
      WHERE hall_id = ? AND booking_date = ?
    `).get(hall_id, booking_date);

    if (conflict) {
      return res.status(409).json({ error: 'Hall is already booked for this date' });
    }

    const now = new Date().toISOString();
    const result = db.prepare(`
      INSERT INTO bookings (organiser_id, hall_id, booking_date, created_at)
      VALUES (?, ?, ?, ?)
    `).run(organiser_id, hall_id, booking_date, now);

    const newBooking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(result.lastInsertRowid);
    return res.status(201).json(newBooking);
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'Hall is already booked for this date' });
    }
    next(error);
  }
}

/**
 * PUT /bookings/:id
 * Updates an existing booking.
 */
function updateBooking(req, res, next) {
  try {
    const { id } = req.params;
    const { organiser_id, hall_id, booking_date } = req.body;

    const existingBooking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id);
    if (!existingBooking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check if new organiser exists
    const organiser = db.prepare('SELECT id FROM organisers WHERE id = ?').get(organiser_id);
    if (!organiser) {
      return res.status(404).json({ error: 'Organiser not found' });
    }

    // Check if new hall exists
    const hall = db.prepare('SELECT id FROM halls WHERE id = ?').get(hall_id);
    if (!hall) {
      return res.status(404).json({ error: 'Hall not found' });
    }

    // Check for conflicts excluding current booking
    const conflict = db.prepare(`
      SELECT id FROM bookings 
      WHERE hall_id = ? AND booking_date = ? AND id != ?
    `).get(hall_id, booking_date, id);

    if (conflict) {
      return res.status(409).json({ error: 'Hall is already booked for this date' });
    }

    db.prepare(`
      UPDATE bookings 
      SET organiser_id = ?, hall_id = ?, booking_date = ?
      WHERE id = ?
    `).run(organiser_id, hall_id, booking_date, id);

    const updatedBooking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id);
    return res.status(200).json(updatedBooking);
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'Hall is already booked for this date' });
    }
    next(error);
  }
}

/**
 * DELETE /bookings/:id
 * Deletes a booking by ID.
 */
function deleteBooking(req, res, next) {
  try {
    const { id } = req.params;

    const existingBooking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id);
    if (!existingBooking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    db.prepare('DELETE FROM bookings WHERE id = ?').run(id);
    return res.status(200).json({ message: 'Booking deleted successfully' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllBookings,
  getBookingDetails,
  getBookingById,
  createBooking,
  updateBooking,
  deleteBooking
};
