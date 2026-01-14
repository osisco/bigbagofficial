// Simple logging utility with environment-based log levels
const isDevelopment = process.env.NODE_ENV !== 'production';

const logger = {
  log: (...args) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  
  debug: (...args) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },
  
  warn: (...args) => {
    console.warn(...args);
  },
  
  error: (...args) => {
    console.error(...args);
  },
  
  info: (...args) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },
};

export default logger;
