// middleware/loggerMiddleware.js

const {createLogger} = require('../core/logger');

// Pass the project name dynamically
const logger = createLogger('API'); // Use a specific project name for API logs

const loggerMiddleware = (req, res, next) => {
  // Log the request method and path
  // logger.info(`Request Method: ${req.method}, Request Path: ${req.path}`);
  const userAgent = req.get('User-Agent');

  // Log the request method, path, query, body, and user agent
  logger.info(`Request Method: ${req.method}, Request Path: ${req.path}, Query: ${JSON.stringify(req.query)}, Body: ${JSON.stringify(req.body)}, User Agent: ${userAgent}`);
  // logger.info(`Request Method: ${req.method}, Request Path: ${req.path}, Query: ${JSON.stringify(req.query)}, Body: ${JSON.stringify(req.body)}`);
  next(); // Pass control to the next middleware or route handler
};

module.exports = loggerMiddleware;
