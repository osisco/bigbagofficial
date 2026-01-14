import logger from "../utils/logger.js";

/**
 * Request logging middleware
 * Logs request method, path, IP, and response time
 */
export const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  // Log request
  logger.debug(`${req.method} ${req.path} - IP: ${req.ip}`);

  // Log response when finished
  res.on("finish", () => {
    const duration = Date.now() - startTime;
    const logLevel = res.statusCode >= 400 ? "error" : "debug";

    logger[logLevel](
      `${req.method} ${req.path} - ${res.statusCode} - ${duration}ms - IP: ${req.ip}`,
    );
  });

  next();
};
