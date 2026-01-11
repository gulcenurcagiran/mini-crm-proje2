const { createLogger, transports, format } = require('winston');

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'debug',
  format: format.combine(
    format.timestamp(),
    // DONE: Using JSON format for production, simple for development
    process.env.NODE_ENV === 'production'
      ? format.json()
      : format.printf(({ level, message, timestamp, stack }) => {
          if (stack) {
            return `${timestamp} [${level}] ${message} - ${stack}`;
          }
          return `${timestamp} [${level}] ${message}`;
        })
  ),
  transports: [
    new transports.Console(),
    // DONE: File transport added for production
    ...(process.env.NODE_ENV === 'production' 
      ? [new transports.File({ filename: 'logs/app.log' })] 
      : [])
  ]
});

// Bazen direkt console.log da kullanılmış projede…
module.exports = logger;
