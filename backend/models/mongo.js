const mongoose = require('mongoose');
const { connectDatabase } = require('../config/database');

connectDatabase().catch(() => {});

module.exports = mongoose.connection;
