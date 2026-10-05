// Password hashing (PBKDF2 via Web Crypto) and D1-backed sessions.

const PBKDF2_ITERATIONS = 100000;

function bufToB64(buf) {
  const bytes = new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}
function b64ToBuf(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function derive(password, salt, iterations) {
  const keyMaterial = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' }, keyMaterial, 256
  );
  return new Uint8Array(bits);
}

export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derive(password, salt, PBKDF2_ITERATIONS);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${bufToB64(salt)}$${bufToB64(hash)}`;
}

export async function verifyPassword(password, stored) {
  try {
    const [scheme, iterStr, saltB64, hashB64] = String(stored).split('$');
    if (scheme !== 'pbkdf2') return false;
    const iterations = parseInt(iterStr, 10);
    const salt = b64ToBuf(saltB64);
    const expected = b64ToBuf(hashB64);
    const actual = await derive(password, salt, iterations);
    if (actual.length !== expected.length) return false;
    let diff = 0;
    for (let i = 0; i < actual.length; i++) diff |= actual[i] ^ expected[i];
    return diff === 0;
  } catch (e) {
    return false;
  }
}

export function newToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

const SESSION_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

export async function createSession(DB, userId) {
  const id = newToken();
  const expires = Date.now() + SESSION_MS;
  await DB.prepare('INSERT INTO sessions (id, user_id, expires) VALUES (?, ?, ?)')
    .bind(id, userId, expires).run();
  return id;
}

export async function getSessionUser(DB, sid) {
  if (!sid) return null;
  const row = await DB.prepare(
    `SELECT u.id, u.name, u.email, u.role, s.expires
     FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id = ?`
  ).bind(sid).first();
  if (!row) return null;
  if (row.expires < Date.now()) {
    await DB.prepare('DELETE FROM sessions WHERE id = ?').bind(sid).run();
    return null;
  }
  return { id: row.id, name: row.name, email: row.email, role: row.role };
}

export async function destroySession(DB, sid) {
  if (sid) await DB.prepare('DELETE FROM sessions WHERE id = ?').bind(sid).run();
}
