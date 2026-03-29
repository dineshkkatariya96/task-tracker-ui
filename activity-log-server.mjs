import { createServer } from 'node:http';
import { appendFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = 8091;
const MAX_BODY_BYTES = 128 * 1024;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logsDirectory = path.join(__dirname, 'logs');
const allowedOrigins = new Set([
  'http://localhost:4200',
  'http://127.0.0.1:4200'
]);

await mkdir(logsDirectory, { recursive: true });
await writeStartupEntry();

const server = createServer(async (req, res) => {
  const requestOrigin = req.headers.origin;
  setCorsHeaders(res, requestOrigin);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method !== 'POST' || req.url !== '/internal/activity-logs') {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
    return;
  }

  try {
    const rawBody = await readRequestBody(req);
    const parsedEntry = JSON.parse(rawBody);
    const safeEntry = sanitizeEntry(parsedEntry);
    const logFile = path.join(logsDirectory, `activity-log-${safeEntry.date}.jsonl`);

    await appendFile(logFile, `${JSON.stringify(safeEntry)}\n`, 'utf8');

    res.writeHead(201, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: message }));
  }
});

server.listen(PORT, () => {
  console.log(`Activity log server listening on http://localhost:${PORT}`);
  console.log(`Log files will be written to ${logsDirectory}`);
});

function setCorsHeaders(res, requestOrigin) {
  if (requestOrigin && allowedOrigins.has(requestOrigin)) {
    res.setHeader('Access-Control-Allow-Origin', requestOrigin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Vary', 'Origin');
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:4200');
  }

  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    let receivedBytes = 0;

    req.setEncoding('utf8');

    req.on('data', (chunk) => {
      receivedBytes += Buffer.byteLength(chunk);
      if (receivedBytes > MAX_BODY_BYTES) {
        reject(new Error('Request body too large'));
        req.destroy();
        return;
      }

      body += chunk;
    });

    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function sanitizeEntry(entry) {
  const normalizedEntry = typeof entry === 'object' && entry !== null ? entry : {};
  const timestamp = normalizeTimestamp(normalizedEntry.timestamp);
  const date = typeof normalizedEntry.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(normalizedEntry.date)
    ? normalizedEntry.date
    : timestamp.slice(0, 10);

  return {
    id: toSafeString(normalizedEntry.id, 80),
    timestamp,
    date,
    sessionId: toSafeString(normalizedEntry.sessionId, 80),
    actor: maskEmail(toSafeString(normalizedEntry.actor, 120)) || 'anonymous',
    role: normalizedEntry.role == null ? null : toSafeString(normalizedEntry.role, 40),
    source: toSafeString(normalizedEntry.source, 40),
    action: toSafeString(normalizedEntry.action, 160),
    level: toSafeString(normalizedEntry.level, 20),
    status: toSafeString(normalizedEntry.status, 20),
    details: sanitizeValue(normalizedEntry.details, '', 0)
  };
}

function sanitizeValue(value, key, depth) {
  if (depth > 4) {
    return '[TRUNCATED]';
  }

  if (value === null || value === undefined) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.slice(0, 10).map((item) => sanitizeValue(item, key, depth + 1));
  }

  switch (typeof value) {
    case 'string':
      return sanitizeString(key, value);
    case 'number':
    case 'boolean':
      return value;
    case 'object': {
      const result = {};

      for (const [childKey, childValue] of Object.entries(value)) {
        result[childKey] = sanitizeValue(childValue, childKey, depth + 1);
      }

      return result;
    }
    default:
      return toSafeString(String(value), 160);
  }
}

function sanitizeString(key, value) {
  const trimmed = value.trim();

  if (!trimmed) {
    return trimmed;
  }

  if (/(password|token|authorization|secret|cookie|session)/i.test(key)) {
    return '[REDACTED]';
  }

  if (/email/i.test(key)) {
    return maskEmail(trimmed);
  }

  if (/(title|description|name|note|comment)/i.test(key)) {
    return `[OMITTED:${trimmed.length} chars]`;
  }

  if (/(url|path)/i.test(key)) {
    return sanitizeUrl(trimmed);
  }

  return toSafeString(trimmed, 160);
}

function sanitizeUrl(value) {
  try {
    const parsed = new URL(value, 'http://localhost');
    const params = [];

    parsed.searchParams.forEach((paramValue, paramKey) => {
      params.push(
        `${paramKey}=${/(password|token|authorization|secret|cookie|session)/i.test(paramKey) ? '[REDACTED]' : toSafeString(paramValue, 40)}`
      );
    });

    return params.length ? `${parsed.pathname}?${params.join('&')}` : parsed.pathname;
  } catch {
    return toSafeString(value, 160);
  }
}

function toSafeString(value, maxLength) {
  const normalized = typeof value === 'string' ? value : String(value ?? '');
  return normalized.length <= maxLength ? normalized : `${normalized.slice(0, maxLength - 3)}...`;
}

function maskEmail(value) {
  const [localPart, domain] = value.split('@');

  if (!domain || localPart.length < 2) {
    return toSafeString(value, 120);
  }

  return `${localPart[0]}***${localPart[localPart.length - 1]}@${domain}`;
}

function normalizeTimestamp(value) {
  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  return new Date().toISOString();
}

async function writeStartupEntry() {
  const timestamp = new Date().toISOString();
  const date = timestamp.slice(0, 10);
  const logFile = path.join(logsDirectory, `activity-log-${date}.jsonl`);
  const startupEntry = {
    id: `server-start-${timestamp}`,
    timestamp,
    date,
    sessionId: 'activity-log-writer',
    actor: 'system',
    role: null,
    source: 'system',
    action: 'Activity log writer started',
    level: 'info',
    status: 'success',
    details: {
      path: logFile
    }
  };

  await appendFile(logFile, `${JSON.stringify(startupEntry)}\n`, 'utf8');
}
