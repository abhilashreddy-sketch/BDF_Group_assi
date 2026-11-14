/**
 * Middleware for validating Hall request payloads and parameters.
 */

function validateHallBody(req, res, next) {
  const { name, building } = req.body;

  if (name === undefined || name === null || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ error: 'Hall name is required' });
  }

  if (building === undefined || building === null || typeof building !== 'string' || building.trim() === '') {
    return res.status(400).json({ error: 'Building is required' });
  }

  // Normalize trimmed values onto req.body
  req.body.name = name.trim();
  req.body.building = building.trim();

  // Strip or ignore any client-supplied 'code', 'id', 'created_at', 'updated_at'
  // The server strictly controls the hall code and auto-generated fields
  delete req.body.code;
  delete req.body.id;
  delete req.body.created_at;
  delete req.body.updated_at;

  next();
}

function validateHallId(req, res, next) {
  const { id } = req.params;
  const numId = Number(id);

  if (!Number.isInteger(numId) || numId <= 0) {
    return res.status(400).json({ error: 'Invalid hall ID' });
  }

  req.params.id = numId;
  next();
}

module.exports = {
  validateHallBody,
  validateHallId
};
