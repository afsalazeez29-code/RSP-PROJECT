const rateLimit = require('express-rate-limit');
const { security } = require('../config/constants');

const loginLimiter = rateLimit({
  windowMs: security.loginRateLimitWindowMs,
  max: security.loginRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many login attempts, please try again later.',
  handler: (req, res) => {
    return res.status(429).json({
      success: false,
      error: {
        message: 'Too many login attempts, please try again later.',
        code: 'RATE_LIMITED',
        statusCode: 429
      }
    });
  }
});

module.exports = {
  loginLimiter
};
