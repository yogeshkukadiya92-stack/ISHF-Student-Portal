const http = require('http');
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const rootDir = __dirname;
const dataDir = process.env.PORTAL_DATA_DIR || path.join(rootDir, 'data');
const dataFile = path.join(dataDir, 'portal-data.json');
const port = Number(process.env.PORT || 80);

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, {
    'X-Content-Type-Options': 'nosniff',
    ...headers
  });
  res.end(body);
}

function timingSafeEqualText(a, b) {
  const left = Buffer.from(String(a || ''));
  const right = Buffer.from(String(b || ''));
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

async function readJsonBody(req, limit = 2 * 1024 * 1024) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) throw new Error('Payload too large');
    chunks.push(chunk);
  }
  const text = Buffer.concat(chunks).toString('utf8');
  if (!text.trim()) throw new Error('Empty body');
  return JSON.parse(text);
}

async function readPortalData() {
  try {
    const text = await fs.readFile(dataFile, 'utf8');
    return JSON.parse(text);
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

async function writePortalData(data) {
  await fs.mkdir(dataDir, { recursive: true });
  const tmp = path.join(dataDir, `portal-data.${process.pid}.${Date.now()}.tmp`);
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), 'utf8');
  await fs.rename(tmp, dataFile);
}

async function isAdminRequest(req, existingData) {
  const staff = existingData && existingData.staff ? existingData.staff : { staffId: 'admin', password: 'admin123' };
  return timingSafeEqualText(req.headers['x-staff-id'], staff.staffId)
    && timingSafeEqualText(req.headers['x-staff-password'], staff.password);
}

async function handleApi(req, res) {
  if (req.url === '/api/health') {
    send(res, 200, JSON.stringify({ ok: true }), { 'Content-Type': mimeTypes['.json'], 'Cache-Control': 'no-store' });
    return;
  }

  if (req.url === '/api/data' && req.method === 'GET') {
    const data = await readPortalData();
    if (!data) {
      send(res, 204, '', { 'Cache-Control': 'no-store' });
      return;
    }
    send(res, 200, JSON.stringify(data), { 'Content-Type': mimeTypes['.json'], 'Cache-Control': 'no-store' });
    return;
  }

  if (req.url === '/api/data' && req.method === 'PUT') {
    const incoming = await readJsonBody(req);
    const existing = await readPortalData();
    if (!(await isAdminRequest(req, existing))) {
      send(res, 401, JSON.stringify({ error: 'Unauthorized' }), { 'Content-Type': mimeTypes['.json'] });
      return;
    }
    if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming)) {
      send(res, 400, JSON.stringify({ error: 'Invalid portal data' }), { 'Content-Type': mimeTypes['.json'] });
      return;
    }
    incoming.meta = { ...(incoming.meta || {}), savedAt: new Date().toISOString() };
    await writePortalData(incoming);
    send(res, 200, JSON.stringify({ ok: true }), { 'Content-Type': mimeTypes['.json'], 'Cache-Control': 'no-store' });
    return;
  }

  send(res, 404, JSON.stringify({ error: 'Not found' }), { 'Content-Type': mimeTypes['.json'] });
}

async function serveStatic(req, res) {
  const urlPath = decodeURIComponent(new URL(req.url, `http://${req.headers.host}`).pathname);
  const cleanPath = urlPath === '/' ? '/ishf-portal.html' : urlPath;
  const filePath = path.normalize(path.join(rootDir, cleanPath));
  if (!filePath.startsWith(rootDir)) {
    send(res, 403, 'Forbidden', { 'Content-Type': 'text/plain; charset=utf-8' });
    return;
  }

  try {
    const data = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const cache = ext === '.html' ? 'no-store' : 'public, max-age=604800';
    send(res, 200, data, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream', 'Cache-Control': cache });
  } catch (error) {
    if (error.code === 'ENOENT') {
      const fallback = await fs.readFile(path.join(rootDir, 'ishf-portal.html'));
      send(res, 200, fallback, { 'Content-Type': mimeTypes['.html'], 'Cache-Control': 'no-store' });
      return;
    }
    throw error;
  }
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.url.startsWith('/api/')) await handleApi(req, res);
    else await serveStatic(req, res);
  } catch (error) {
    console.error(error);
    send(res, 500, JSON.stringify({ error: 'Server error' }), { 'Content-Type': mimeTypes['.json'] });
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`ISHF Student Portal running on port ${port}`);
});
