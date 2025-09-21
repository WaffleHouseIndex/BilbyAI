const LEVEL_RANK = { debug: 10, info: 20, warn: 30, error: 40 };
const DEFAULT_LEVEL = process.env.LOG_LEVEL ? process.env.LOG_LEVEL.toLowerCase() : 'info';

const REDACT_PATTERNS = [
  /token/i,
  /secret/i,
  /password/i,
  /authorization/i,
  /api[_-]?key/i,
  /transcript/i,
  /audio/i,
  /payload/i,
  /body$/i,
  /content/i,
];

function shouldRedactKey(keyPath) {
  const key = keyPath[keyPath.length - 1] || '';
  return REDACT_PATTERNS.some((pattern) => pattern.test(key));
}

function sanitizeValue(value, keyPath = [], seen = new WeakSet()) {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') {
    if (shouldRedactKey(keyPath)) return '[REDACTED]';
    if (value.length > 256) return `${value.slice(0, 256)}…`;
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (value instanceof Date) return value.toISOString();
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : value.stack,
      code: value.code,
    };
  }
  if (typeof value === 'bigint') {
    const asNumber = Number(value);
    return Number.isSafeInteger(asNumber) ? asNumber : value.toString();
  }
  if (typeof value === 'function') return value.name || '[function]';

  if (typeof value === 'object') {
    if (seen.has(value)) return '[Circular]';
    seen.add(value);

    if (Array.isArray(value)) {
      return value.slice(0, 20).map((item, index) => sanitizeValue(item, keyPath.concat(index), seen));
    }

    const output = {};
    const entries = Object.entries(value).slice(0, 50);
    for (const [key, val] of entries) {
      const nextPath = keyPath.concat(key);
      output[key] = shouldRedactKey(nextPath) ? '[REDACTED]' : sanitizeValue(val, nextPath, seen);
    }
    return output;
  }

  return String(value);
}

function resolveLevel(levelName) {
  const normalized = (levelName || '').toLowerCase();
  return LEVEL_RANK[normalized] ? normalized : 'info';
}

const globalLevel = resolveLevel(DEFAULT_LEVEL);
const globalRank = LEVEL_RANK[globalLevel];

function createLogger(baseContext = {}) {
  const base = sanitizeValue(baseContext) || {};

  function log(level, message, context) {
    const rank = LEVEL_RANK[level];
    if (rank < globalRank) return;

    const payload = {
      ts: new Date().toISOString(),
      level,
      message,
      ...base,
      ...(context ? sanitizeValue(context) : {}),
    };

    const json = JSON.stringify(payload);
    if (level === 'error') {
      console.error(json);
    } else if (level === 'warn') {
      console.warn(json);
    } else {
      console.log(json);
    }
  }

  return {
    child(extraContext = {}) {
      return createLogger({ ...base, ...sanitizeValue(extraContext) });
    },
    debug(message, context) {
      log('debug', message, context);
    },
    info(message, context) {
      log('info', message, context);
    },
    warn(message, context) {
      log('warn', message, context);
    },
    error(message, context) {
      log('error', message, context);
    },
  };
}

const logger = createLogger({ service: 'bilbyai' });

export { createLogger, logger };
