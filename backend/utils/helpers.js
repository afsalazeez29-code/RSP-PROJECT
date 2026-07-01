const mongoose = require('mongoose');
const { pagination } = require('../config/constants');

const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const cleanSearch = (value = '') => String(value).trim().slice(0, 100);

const parsePositiveInt = (value, fallback = 1, max = pagination.maxPerPage) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
};

const getPagination = (query, fallbackLimit) => {
  const page = parsePositiveInt(query.page, 1, Number.MAX_SAFE_INTEGER);
  const limit = parsePositiveInt(query.limit, fallbackLimit, pagination.maxPerPage);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

const buildTotalPages = (total, limit) => Math.max(1, Math.ceil(total / limit));

const getClientIp = (req) => {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    return String(forwardedFor).split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || null;
};

const getSafeRedirect = (req, fallback = '/') => {
  const referer = req.get('referer');
  if (!referer) return fallback;

  try {
    const refererUrl = new URL(referer);
    const requestHost = req.get('host');
    if (refererUrl.host !== requestHost) return fallback;
    return `${refererUrl.pathname}${refererUrl.search}`;
  } catch (error) {
    return fallback;
  }
};

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const apiSuccess = (res, data = {}, message = 'Operation successful', statusCode = 200) => (
  res.status(statusCode).json({ success: true, data, message })
);

const apiError = (res, message, code = 'ERROR', statusCode = 400) => (
  res.status(statusCode).json({
    success: false,
    error: { message, code, statusCode }
  })
);

module.exports = {
  apiError,
  apiSuccess,
  buildTotalPages,
  cleanSearch,
  escapeRegex,
  getClientIp,
  getPagination,
  getSafeRedirect,
  isValidObjectId,
  parsePositiveInt
};
