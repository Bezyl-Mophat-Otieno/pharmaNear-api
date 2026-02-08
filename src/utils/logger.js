const LOG_LEVELS = {
    INFO: 'INFO',
    WARN: 'WARN',
    ERROR: 'ERROR',
    DEBUG: 'DEBUG',
  };
  
  function log(level, message, context = {}) {
    const timestamp = new Date().toLocaleString("en-KE", {
      timeZone: "Africa/Nairobi",
      hour12: true
      });
  
    const logData = {
      timestamp: `${timestamp} EAT`,
      level,
      message,
      ...context,
    };
  
    const formatted = JSON.stringify(logData);
  
    if (level === LOG_LEVELS.ERROR) {
      console.error(formatted);
    } else {
      console.log(formatted);
    }
  }
  
  module.exports = {
    log,
    LOG_LEVELS,
  };
  