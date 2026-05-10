let winston;

try {
  winston = require('winston');
} catch (error) {
  winston = null;
}

function formatMeta(meta) {
  return meta && Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
}

function createConsoleFallback() {
  const write = (level, message, meta = {}) => {
    const timestamp = new Date().toISOString().replace('T', ' ').replace('Z', '');
    const line = `${timestamp} [${level}] ${message}${formatMeta(meta)}`;
    const sink = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
    sink(line);
  };

  return {
    info: (message, meta) => write('info', message, meta),
    warn: (message, meta) => write('warn', message, meta),
    error: (message, meta) => write('error', message, meta),
    debug: (message, meta) => write('debug', message, meta)
  };
}

const logger = winston
  ? winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json()
      ),
      defaultMeta: { service: 'dispatch-app' },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, ...meta }) => {
              return `${timestamp} [${level}] ${message}${formatMeta(meta)}`;
            })
          )
        })
      ]
    })
  : createConsoleFallback();

module.exports = logger;
