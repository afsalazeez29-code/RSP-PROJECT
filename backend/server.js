#!/usr/bin/env node

require('dotenv').config();

const debug = require('debug')('backend:server');
const http = require('http');
const { app: appConstants } = require('./config/constants');
const { connectDatabase } = require('./config/database');
const logger = require('./utils/logger');

const normalizePort = (value) => {
  const port = parseInt(value, 10);

  if (Number.isNaN(port)) return value;
  if (port >= 0) return port;
  return false;
};

const port = normalizePort(process.env.PORT || appConstants.port || '4000');
let server;

const onError = (error) => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof port === 'string' ? `Pipe ${port}` : `Port ${port}`;

  switch (error.code) {
    case 'EACCES':
      logger.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      logger.error(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
};

const onListening = () => {
  const addr = server.address();
  const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`;
  debug(`Listening on ${bind}`);
  logger.info(`Recipio backend listening on ${bind}`);
  console.log(`Recipio backend listening on ${bind}`);
};

const start = async () => {
  await connectDatabase();
  const app = require('./app');
  app.set('port', port);
  server = http.createServer(app);
  server.listen(port);
  server.on('error', onError);
  server.on('listening', onListening);
};

start().catch((error) => {
  logger.error(`Server startup failed: ${error.message}`);
  process.exit(1);
});

module.exports = server;
