const logger = require('../utils/logger');

const notFound = (req, res, next) => {
  const error = new Error('Not Found');
  error.status = 404;
  next(error);
};

const errorHandler = (err, req, res, next) => {
  const statusCode = err.status || err.statusCode || 500;
  const isDevelopment = req.app.get('env') === 'development';

  logger.error(`${req.method} ${req.originalUrl} ${statusCode}: ${err.message}`, {
    stack: err.stack
  });

  if (req.path.startsWith('/api/') || req.accepts('json') || !req.accepts('html')) {
    return res.status(statusCode).json({
      success: false,
      error: {
        message: err.message || 'Internal Server Error',
        code: err.code || 'INTERNAL_ERROR',
        statusCode,
        details: isDevelopment ? err.stack : undefined
      }
    });
  }

  return res.status(statusCode).send(err.message || 'Internal Server Error');
};

module.exports = {
  errorHandler,
  notFound
};