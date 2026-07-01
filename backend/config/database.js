const mongoose = require('mongoose');
const { database } = require('./constants');
const logger = require('../utils/logger');

let connectionPromise = null;

const wait = (ms) => new Promise((resolve) => {
  setTimeout(resolve, ms);
});

const connectWithRetry = async () => {
  let lastError;

  for (let attempt = 1; attempt <= database.connectRetries; attempt += 1) {
    try {
      if (attempt > 1) {
        logger.info(`Retrying MongoDB connection (${attempt}/${database.connectRetries})`);
      }

      return await mongoose.connect(database.uri, {
        serverSelectionTimeoutMS: 10000,
        maxPoolSize: 10
      });
    } catch (error) {
      lastError = error;

      if (attempt < database.connectRetries) {
        logger.warn(`MongoDB connection attempt ${attempt} failed: ${error.message}`);
        await wait(database.connectRetryDelayMs);
      }
    }
  }

  throw lastError;
};

const connectDatabase = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = connectWithRetry()
    .then(() => {
      logger.info('MongoDB connected');
      return mongoose.connection;
    })
    .catch((error) => {
      connectionPromise = null;
      logger.error(`MongoDB connection failed: ${error.message}`);
      throw error;
    });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });

  mongoose.connection.on('error', (error) => {
    logger.error(`MongoDB error: ${error.message}`);
  });

  return connectionPromise;
};

const disconnectDatabase = () => mongoose.disconnect();

module.exports = {
  connectDatabase,
  disconnectDatabase
};
