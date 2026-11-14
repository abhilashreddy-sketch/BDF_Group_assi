/**
 * Middleware for validating Organiser request payloads and parameters.
 */

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

function validateOrganiserBody(req, res, next) {
  const { name, email } = req.body;

  if (name === undefined || name === null || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ error: 'Organiser name is required' });
  }

  if (email === undefined || email === null || typeof email !== 'string' || email.trim() === '') {
    return res.status(400).json({ error: 'Organiser email is required' });
  }

  const trimmedEmail = email.trim();
  if (!EMAIL_REGEX.test(trimmedEmail)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  req.body.name = name.trim();
  req.body.email = trimmedEmail.toLowerCase();

  delete req.body.id;
  delete req.body.created_at;

  next();
}

function validateOrganiserId(req, res, next) {
  const { id } = req.params;
  const numId = Number(id);

  if (!Number.isInteger(numId) || numId <= 0) {
    return res.status(400).json({ error: 'Invalid organiser ID' });
  }

  req.params.id = numId;
  next();
}

module.exports = {
  validateOrganiserBody,
  validateOrganiserId
};
