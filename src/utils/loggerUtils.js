// utils/logger.js

const winston = require('winston');
require('winston-daily-rotate-file');
const fs = require('fs');
const path = require('path');

// Project name (can be dynamically set)
// const projectName = 'myProject';

// Log directory
// const logDir = path.join(__dirname, '../../logs');

// Create logs directory if it doesn't exist
// if (!fs.existsSync(logDir)) {
//   fs.mkdirSync(logDir);
// }

// Configure the logger
const createLogger = (projectName) => {

  // Log directory for the specific project
  const logDir = path.join(__dirname, '../../logs', projectName);

  // Create logs directory if it doesn't exist
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true }); // Create nested directories if needed
  }
  return winston.createLogger({
    level: 'info',
    format: winston.format.combine(
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
      }),
      winston.format.printf(({ timestamp, level, message }) => {
        return `${timestamp} [${level.toUpperCase()}]: ${message}`;
      })
    ),
    transports: [
      // Rotate log files daily
      new winston.transports.DailyRotateFile({
        filename: `${logDir}/%DATE%.log`,  // Log filename with project name and date
        datePattern: 'YYYY-MM-DD',                        // Daily rotation with this date format
        zippedArchive: true,                              // Compress logs
        maxSize: '20m',                                   // Max log file size
        maxFiles: '14d'                                   // Keep logs for 14 days
      }),
      new winston.transports.Console()                    // Also log to the console
    ]
  })
};

// Export the logger to be used in other parts of the app
module.exports = {createLogger};
