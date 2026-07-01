const fs = require('fs');
const path = require('path');
const winston = require('winston');
require('winston-daily-rotate-file');
const { logging } = require('../config/constants');

const logPath = path.resolve(process.cwd(), logging.filePath);
fs.mkdirSync(path.dirname(logPath), { recursive: true });

const logger = winston.createLogger({
  level: logging.level,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.DailyRotateFile({
      filename: logPath.replace(/\.log$/i, '-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d'
    })
  ],
  exitOnError: false
});

module.exports = logger;
