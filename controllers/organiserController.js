const db = require('../config/db');

/**
 * Controller for Organiser operations.
 */

/**
 * GET /organisers
 * Retrieves all organisers.
 */
function getAllOrganisers(req, res, next) {
  try {
    const organisers = db.prepare('SELECT * FROM organisers ORDER BY id ASC').all();
    return res.status(200).json(organisers);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /organisers/:id
 * Retrieves a single organiser by ID.
 */
function getOrganiserById(req, res, next) {
  try {
    const { id } = req.params;
    const organiser = db.prepare('SELECT * FROM organisers WHERE id = ?').get(id);

    if (!organiser) {
      return res.status(404).json({ error: 'Organiser not found' });
    }

    return res.status(200).json(organiser);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /organisers
 * Registers a new organiser with unique email validation.
 */
function createOrganiser(req, res, next) {
  try {
    const { name, email } = req.body;

    const existing = db.prepare('SELECT id FROM organisers WHERE LOWER(email) = LOWER(?)').get(email);
    if (existing) {
      return res.status(409).json({ error: 'An organiser with this email already exists' });
    }

    const now = new Date().toISOString();
    const result = db.prepare(`
      INSERT INTO organisers (name, email, created_at)
      VALUES (?, ?, ?)
    `).run(name, email, now);

    const newOrganiser = db.prepare('SELECT * FROM organisers WHERE id = ?').get(result.lastInsertRowid);
    return res.status(201).json(newOrganiser);
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /organisers/:id
 * Updates an organiser's name and email.
 */
function updateOrganiser(req, res, next) {
  try {
    const { id } = req.params;
    const { name, email } = req.body;

    const organiser = db.prepare('SELECT * FROM organisers WHERE id = ?').get(id);
    if (!organiser) {
      return res.status(404).json({ error: 'Organiser not found' });
    }

    const emailInUse = db.prepare('SELECT id FROM organisers WHERE LOWER(email) = LOWER(?) AND id != ?').get(email, id);
    if (emailInUse) {
      return res.status(409).json({ error: 'An organiser with this email already exists' });
    }

    db.prepare(`
      UPDATE organisers 
      SET name = ?, email = ?
      WHERE id = ?
    `).run(name, email, id);

    const updatedOrganiser = db.prepare('SELECT * FROM organisers WHERE id = ?').get(id);
    return res.status(200).json(updatedOrganiser);
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /organisers/:id
 * Deletes an organiser if no associated bookings exist.
 */
function deleteOrganiser(req, res, next) {
  try {
    const { id } = req.params;

    const organiser = db.prepare('SELECT * FROM organisers WHERE id = ?').get(id);
    if (!organiser) {
      return res.status(404).json({ error: 'Organiser not found' });
    }

    // Protect foreign key / booking history
    const bookingCount = db.prepare('SELECT COUNT(*) AS count FROM bookings WHERE organiser_id = ?').get(id);
    if (bookingCount && bookingCount.count > 0) {
      return res.status(409).json({ error: 'Cannot delete organiser with existing bookings' });
    }

    db.prepare('DELETE FROM organisers WHERE id = ?').run(id);
    return res.status(200).json({ message: 'Organiser deleted successfully' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllOrganisers,
  getOrganiserById,
  createOrganiser,
  updateOrganiser,
  deleteOrganiser
};
