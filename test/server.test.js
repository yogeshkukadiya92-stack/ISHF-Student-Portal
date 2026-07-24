const assert = require('assert');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const root = path.resolve(__dirname, '..');
const port = 4300 + Math.floor(Math.random() * 1000);
let server;
let dataDir;

async function waitForHealth() {
  const started = Date.now();
  while (Date.now() - started < 10000) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/api/health`);
      if (res.ok) return;
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  throw new Error('Server did not start');
}

async function request(pathname, options) {
  return fetch(`http://127.0.0.1:${port}${pathname}`, options);
}

(async () => {
  dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ishf-portal-test-'));
  server = spawn(process.execPath, ['server.js'], {
    cwd: root,
    env: { ...process.env, PORT: String(port), PORTAL_DATA_DIR: dataDir },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  await waitForHealth();

  let res = await request('/api/data');
  assert.strictEqual(res.status, 204);

  const portalData = {
    staff: { staffId: 'admin', password: 'admin123', name: 'Admin' },
    student: { studentId: 'STU100', password: 'Portal@Test1', name: 'Test Student' },
    students: [{ studentId: 'STU100', password: 'Portal@Test1', name: 'Test Student' }]
  };

  res = await request('/api/data', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'X-Staff-ID': 'wrong', 'X-Staff-Password': 'bad' },
    body: JSON.stringify(portalData)
  });
  assert.strictEqual(res.status, 401);

  res = await request('/api/data', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'X-Staff-ID': 'admin', 'X-Staff-Password': 'admin123' },
    body: JSON.stringify(portalData)
  });
  assert.strictEqual(res.status, 200);

  res = await request('/api/data');
  assert.strictEqual(res.status, 200);
  const saved = await res.json();
  assert.strictEqual(saved.students[0].studentId, 'STU100');
  assert.strictEqual(saved.students[0].password, 'Portal@Test1');

  res = await request('/ishf-portal.html');
  assert.strictEqual(res.status, 200);
  assert.match(await res.text(), /ISHF Student Portal|Student Portal/);

  console.log('Server tests passed');
})()
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (server) server.kill();
    if (dataDir) await fs.rm(dataDir, { recursive: true, force: true });
  });
