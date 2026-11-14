/**
 * Centralized error handler middleware.
 * Ensures consistent error JSON format and protects internal details from leaking.
 */
function errorHandler(err, req, res, next) {
  // If response has already started streaming, delegate to default Express handler
  if (res.headersSent) {
    return next(err);
  }

  // Handle SQLite specific constraint errors if unhandled by controller
  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    return res.status(409).json({ error: 'Resource conflict or duplicate entry detected' });
  }

  if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
    return res.status(400).json({ error: 'Referenced foreign key resource does not exist' });
  }

  // Generic 500 internal server error
  const statusCode = err.status || err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  const response = {
    error: isProduction || statusCode === 500 ? 'Internal server error' : (err.message || 'An error occurred')
  };

  res.status(statusCode).json(response);
}

module.exports = errorHandler;
