/**
 * Middleware for validating Booking request payloads and parameters.
 */

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function isValidCalendarDate(dateStr) {
  if (typeof dateStr !== 'string' || !DATE_REGEX.test(dateStr)) {
    return false;
  }
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year &&
         date.getUTCMonth() === month - 1 &&
         date.getUTCDate() === day;
}

function validateBookingBody(req, res, next) {
  const { organiser_id, hall_id, booking_date } = req.body;

  if (organiser_id === undefined || organiser_id === null) {
    return res.status(400).json({ error: 'Organiser ID is required' });
  }
  const numOrganiserId = Number(organiser_id);
  if (!Number.isInteger(numOrganiserId) || numOrganiserId <= 0) {
    return res.status(400).json({ error: 'Valid organiser ID is required' });
  }

  if (hall_id === undefined || hall_id === null) {
    return res.status(400).json({ error: 'Hall ID is required' });
  }
  const numHallId = Number(hall_id);
  if (!Number.isInteger(numHallId) || numHallId <= 0) {
    return res.status(400).json({ error: 'Valid hall ID is required' });
  }

  if (booking_date === undefined || booking_date === null || typeof booking_date !== 'string' || booking_date.trim() === '') {
    return res.status(400).json({ error: 'Booking date is required' });
  }

  const trimmedDate = booking_date.trim();
  if (!isValidCalendarDate(trimmedDate)) {
    return res.status(400).json({ error: 'Invalid booking date format. Expected YYYY-MM-DD' });
  }

  req.body.organiser_id = numOrganiserId;
  req.body.hall_id = numHallId;
  req.body.booking_date = trimmedDate;

  delete req.body.id;
  delete req.body.created_at;

  next();
}

function validateBookingId(req, res, next) {
  const { id } = req.params;
  const numId = Number(id);

  if (!Number.isInteger(numId) || numId <= 0) {
    return res.status(400).json({ error: 'Invalid booking ID' });
  }

  req.params.id = numId;
  next();
}

module.exports = {
  validateBookingBody,
  validateBookingId
};
