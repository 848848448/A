import { Hono } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';

import { CATEGORY_MAP } from './lib/constants.js';
import { todayISO } from './lib/helpers.js';
import { hashPassword, verifyPassword, createSession, getSessionUser, destroySession } from './lib/auth.js';
import { layout } from './views/layout.js';
import { indexPage, performerPage, loginPage, errorPage } from './views/pages.js';
import { dashHome, dashProfile, dashAvailability, dashBookings, dashSettings } from './views/dashboard.js';
import { adminHome, adminNew, adminBookings } from './views/admin.js';

const app = new Hono();

/* ---------------- helpers ---------------- */
const isSecure = (c) => new URL(c.req.url).protocol === 'https:';

function flash(c, type, msg) {
  setCookie(c, 'flash', encodeURIComponent(JSON.stringify({ type, msg })), {
    path: '/', httpOnly: true, sameSite: 'Lax', secure: isSecure(c), maxAge: 120,
  });
}

function render(c, title, body) {
  return c.html(layout({ title, user: c.get('user'), path: new URL(c.req.url).pathname, flash: c.get('flash'), body }));
}

function randomHex(n) {
  const b = crypto.getRandomValues(new Uint8Array(n));
  return Array.from(b).map((x) => x.toString(16).padStart(2, '0')).join('');
}

async function myPerformer(DB, user) {
  let p = await DB.prepare('SELECT * FROM performers WHERE user_id = ?').bind(user.id).first();
  if (!p) {
    const r = await DB.prepare('INSERT INTO performers (user_id, display_name, active) VALUES (?, ?, 0)')
      .bind(user.id, user.name).run();
    p = await DB.prepare('SELECT * FROM performers WHERE id = ?').bind(r.meta.last_row_id).first();
  }
  return p;
}

/* ---------------- global middleware: session + flash ---------------- */
app.use('*', async (c, next) => {
  // flash
  const fc = getCookie(c, 'flash');
  let fl = null;
  if (fc) {
    try { fl = JSON.parse(decodeURIComponent(fc)); } catch (e) { fl = null; }
    deleteCookie(c, 'flash', { path: '/' });
  }
  c.set('flash', fl);
  // user
  const sid = getCookie(c, 'sid');
  const user = sid ? await getSessionUser(c.env.DB, sid) : null;
  c.set('user', user);
  await next();
});

function requireLogin(c) {
  if (!c.get('user')) {
    flash(c, 'error', 'Please log in first.');
    return c.redirect('/auth/login?next=' + encodeURIComponent(new URL(c.req.url).pathname));
  }
  return null;
}
function requireAdmin(c) {
  const u = c.get('user');
  if (!u || u.role !== 'admin') {
    return c.html(layout({ title: 'Not allowed', user: u, path: '/admin', flash: null,
      body: errorPage({ code: 403, message: 'Only an administrator can access this page.' }) }), 403);
  }
  return null;
}

/* ================= PUBLIC ================= */
app.get('/', async (c) => {
  const DB = c.env.DB;
  const q = (c.req.query('q') || '').trim();
  const cat = (c.req.query('cat') || '').trim();
  let sql = 'SELECT * FROM performers WHERE active = 1';
  const params = [];
  if (q) { sql += ' AND (display_name LIKE ? OR bio LIKE ? OR location LIKE ?)'; const l = `%${q}%`; params.push(l, l, l); }
  if (cat && CATEGORY_MAP[cat]) {
    sql += ' AND (categories = ? OR categories LIKE ? OR categories LIKE ? OR categories LIKE ?)';
    params.push(cat, `${cat},%`, `%,${cat},%`, `%,${cat}`);
  }
  sql += ' ORDER BY featured DESC, display_name COLLATE NOCASE ASC';
  const { results } = await DB.prepare(sql).bind(...params).all();
  const today = todayISO();
  // One aggregated query for free-day counts instead of one per performer.
  const { results: freeRows } = await DB.prepare(
    "SELECT performer_id, COUNT(*) AS c FROM availability WHERE status = 'available' AND date >= ? GROUP BY performer_id"
  ).bind(today).all();
  const freeMap = {};
  for (const r of freeRows) freeMap[r.performer_id] = r.c;
  const performers = results.map((p) => ({ ...p, freeCount: freeMap[p.id] || 0 }));
  const total = (await DB.prepare('SELECT COUNT(*) AS c FROM performers WHERE active = 1').first()).c;
  return render(c, 'Music Directory', indexPage({ performers, q, cat, total }));
});

app.get('/p/:id', async (c) => {
  const DB = c.env.DB;
  const performer = await DB.prepare('SELECT * FROM performers WHERE id = ? AND active = 1').bind(c.req.param('id')).first();
  if (!performer) return notFound(c);
  const today = todayISO();
  const { results } = await DB.prepare('SELECT date, status, note FROM availability WHERE performer_id = ?').bind(performer.id).all();
  const map = {};
  for (const r of results) map[r.date] = { status: r.status, note: r.note };
  const days = [];
  const start = new Date(today + 'T00:00:00Z');
  for (let i = 0; i < 60; i++) {
    const d = new Date(start.getTime() + i * 86400000);
    const iso = d.toISOString().slice(0, 10);
    days.push({ iso, info: map[iso] || null, dow: d.getUTCDay(), dom: d.getUTCDate(), month: d.getUTCMonth() });
  }
  return render(c, performer.display_name, performerPage({ performer, days, today }));
});

app.post('/p/:id/book', async (c) => {
  const DB = c.env.DB;
  const performer = await DB.prepare('SELECT * FROM performers WHERE id = ? AND active = 1').bind(c.req.param('id')).first();
  if (!performer) return notFound(c);
  const b = await c.req.parseBody();
  const name = String(b.requester_name || '').trim();
  const phone = String(b.requester_phone || '').trim();
  const email = String(b.requester_email || '').trim();
  const eventDate = String(b.event_date || '').trim();
  if (!name || !eventDate || (!phone && !email)) {
    flash(c, 'error', 'Please provide your name, a date, and a way to reach you (phone or email).');
    return c.redirect('/p/' + performer.id + '#book');
  }
  await DB.prepare(`INSERT INTO bookings (performer_id, requester_name, requester_phone, requester_email, event_date, event_type, location, message)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).bind(
    performer.id, name, phone, email, eventDate,
    String(b.event_type || '').trim(), String(b.location || '').trim(), String(b.message || '').trim()
  ).run();
  flash(c, 'success', `Your booking request was sent to ${performer.display_name}. They will get back to you.`);
  return c.redirect('/p/' + performer.id);
});

/* ================= AUTH ================= */
app.get('/auth/login', (c) => {
  if (c.get('user')) return c.redirect('/dashboard');
  return render(c, 'Log in', loginPage({ next: c.req.query('next') || '' }));
});

app.post('/auth/login', async (c) => {
  const DB = c.env.DB;
  const b = await c.req.parseBody();
  const email = String(b.email || '').trim().toLowerCase();
  const password = String(b.password || '');
  const next = typeof b.next === 'string' && b.next.startsWith('/') ? b.next : '/dashboard';
  const user = await DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    flash(c, 'error', 'Email or password is incorrect.');
    return c.redirect('/auth/login' + (b.next ? '?next=' + encodeURIComponent(String(b.next)) : ''));
  }
  const sid = await createSession(DB, user.id);
  setCookie(c, 'sid', sid, { path: '/', httpOnly: true, sameSite: 'Lax', secure: isSecure(c), maxAge: 60 * 60 * 24 * 14 });
  flash(c, 'success', `Welcome, ${user.name}!`);
  return c.redirect(next);
});

app.post('/auth/logout', async (c) => {
  const sid = getCookie(c, 'sid');
  if (sid) await destroySession(c.env.DB, sid);
  deleteCookie(c, 'sid', { path: '/' });
  return c.redirect('/');
});

app.post('/auth/password', async (c) => {
  const redir = requireLogin(c); if (redir) return redir;
  const DB = c.env.DB;
  const b = await c.req.parseBody();
  const user = await DB.prepare('SELECT * FROM users WHERE id = ?').bind(c.get('user').id).first();
  if (!(await verifyPassword(String(b.current || ''), user.password_hash))) {
    flash(c, 'error', 'Current password is incorrect.'); return c.redirect('/dashboard/settings');
  }
  const next = String(b.next_password || '');
  if (next.length < 6) { flash(c, 'error', 'The new password must be at least 6 characters.'); return c.redirect('/dashboard/settings'); }
  if (next !== String(b.confirm || '')) { flash(c, 'error', 'The two passwords do not match.'); return c.redirect('/dashboard/settings'); }
  await DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?').bind(await hashPassword(next), user.id).run();
  flash(c, 'success', 'Your password has been changed.');
  return c.redirect('/dashboard/settings');
});

/* ================= DASHBOARD ================= */
async function pendingCount(DB, performerId) {
  return (await DB.prepare("SELECT COUNT(*) AS c FROM bookings WHERE performer_id = ? AND status = 'pending'").bind(performerId).first()).c;
}

app.get('/dashboard', async (c) => {
  const redir = requireLogin(c); if (redir) return redir;
  const DB = c.env.DB; const user = c.get('user');
  const p = await myPerformer(DB, user);
  const today = todayISO();
  const stats = {
    pending: await pendingCount(DB, p.id),
    accepted: (await DB.prepare("SELECT COUNT(*) AS c FROM bookings WHERE performer_id = ? AND status = 'accepted'").bind(p.id).first()).c,
    free: (await DB.prepare("SELECT COUNT(*) AS c FROM availability WHERE performer_id = ? AND status = 'available' AND date >= ?").bind(p.id, today).first()).c,
  };
  const { results: upcoming } = await DB.prepare('SELECT * FROM bookings WHERE performer_id = ? AND event_date >= ? ORDER BY event_date ASC LIMIT 5').bind(p.id, today).all();
  return render(c, 'Dashboard', dashHome({ performer: p, stats, upcoming, pendingBadge: stats.pending, user }));
});

app.get('/dashboard/profile', async (c) => {
  const redir = requireLogin(c); if (redir) return redir;
  const DB = c.env.DB; const user = c.get('user');
  const p = await myPerformer(DB, user);
  return render(c, 'My Profile', dashProfile({ performer: p, pendingBadge: await pendingCount(DB, p.id), user, hasR2: !!c.env.BUCKET }));
});

app.post('/dashboard/profile', async (c) => {
  const redir = requireLogin(c); if (redir) return redir;
  const DB = c.env.DB; const user = c.get('user');
  const p = await myPerformer(DB, user);
  const b = await c.req.parseBody({ all: true });
  let cats = b.categories || [];
  if (!Array.isArray(cats)) cats = [cats];
  cats = cats.filter((x) => CATEGORY_MAP[x]);

  let photo = p.photo;
  const file = b.photo_file;
  // Photo file upload needs R2. When R2 isn't configured yet, fall back to the URL field.
  if (c.env.BUCKET && file && typeof file === 'object' && file.size > 0 && /^image\//.test(file.type || '')) {
    const ext = (file.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg').slice(0, 4);
    const key = randomHex(12) + '.' + ext;
    await c.env.BUCKET.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });
    photo = '/uploads/' + key;
  } else if (typeof b.photo_url === 'string' && b.photo_url.trim()) {
    photo = b.photo_url.trim();
  }
  const visible = b.visible ? 1 : 0;
  const s = (v) => String(v || '').trim();
  await DB.prepare(`UPDATE performers SET display_name=?, categories=?, bio=?, phone=?, public_email=?, website=?, location=?, price_from=?, photo=?, active=? WHERE id=?`)
    .bind(s(b.display_name) || user.name, cats.join(','), s(b.bio), s(b.phone), s(b.public_email), s(b.website), s(b.location), s(b.price_from), photo, visible, p.id).run();
  flash(c, 'success', 'Your profile has been saved.');
  return c.redirect('/dashboard/profile');
});

app.get('/dashboard/availability', async (c) => {
  const redir = requireLogin(c); if (redir) return redir;
  const DB = c.env.DB; const user = c.get('user');
  const p = await myPerformer(DB, user);
  const today = todayISO();
  const { results } = await DB.prepare('SELECT date, status, note FROM availability WHERE performer_id = ?').bind(p.id).all();
  const map = {};
  for (const r of results) map[r.date] = r;
  const months = [];
  const start = new Date(today + 'T00:00:00Z');
  for (let mi = 0; mi < 3; mi++) {
    const first = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + mi, 1));
    const year = first.getUTCFullYear(), month = first.getUTCMonth();
    const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    const cells = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ iso, d, past: iso < today, info: map[iso] || null });
    }
    months.push({ year, month, cells });
  }
  return render(c, 'Availability', dashAvailability({ performer: p, months, pendingBadge: await pendingCount(DB, p.id), user }));
});

app.post('/dashboard/availability', async (c) => {
  const redir = requireLogin(c); if (redir) return redir;
  const DB = c.env.DB; const p = await myPerformer(DB, c.get('user'));
  const b = await c.req.parseBody();
  const date = String(b.date || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { flash(c, 'error', 'Invalid date.'); return c.redirect('/dashboard/availability'); }
  if (b.clear === '1') {
    await DB.prepare('DELETE FROM availability WHERE performer_id = ? AND date = ?').bind(p.id, date).run();
  } else {
    const status = ['available', 'unavailable', 'booked'].includes(b.status) ? b.status : 'available';
    await DB.prepare(`INSERT INTO availability (performer_id, date, status, note) VALUES (?, ?, ?, ?)
      ON CONFLICT(performer_id, date) DO UPDATE SET status = excluded.status, note = excluded.note`)
      .bind(p.id, date, status, String(b.note || '').trim()).run();
  }
  return c.redirect('/dashboard/availability');
});

app.post('/dashboard/availability/bulk', async (c) => {
  const redir = requireLogin(c); if (redir) return redir;
  const DB = c.env.DB; const p = await myPerformer(DB, c.get('user'));
  const b = await c.req.parseBody();
  const from = String(b.from || '').trim(), to = String(b.to || '').trim();
  const status = ['available', 'unavailable'].includes(b.status) ? b.status : 'available';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to) || to < from) {
    flash(c, 'error', 'Invalid date range.'); return c.redirect('/dashboard/availability');
  }
  const stmt = DB.prepare(`INSERT INTO availability (performer_id, date, status) VALUES (?, ?, ?)
    ON CONFLICT(performer_id, date) DO UPDATE SET status = excluded.status`);
  const batch = [];
  let cur = new Date(from + 'T00:00:00Z'); const end = new Date(to + 'T00:00:00Z');
  while (cur <= end) { batch.push(stmt.bind(p.id, cur.toISOString().slice(0, 10), status)); cur = new Date(cur.getTime() + 86400000); }
  if (batch.length) await DB.batch(batch);
  flash(c, 'success', 'The days have been marked.');
  return c.redirect('/dashboard/availability');
});

app.get('/dashboard/bookings', async (c) => {
  const redir = requireLogin(c); if (redir) return redir;
  const DB = c.env.DB; const p = await myPerformer(DB, c.get('user'));
  const filter = ['pending', 'accepted', 'declined'].includes(c.req.query('status')) ? c.req.query('status') : 'all';
  let sql = 'SELECT * FROM bookings WHERE performer_id = ?'; const params = [p.id];
  if (filter !== 'all') { sql += ' AND status = ?'; params.push(filter); }
  sql += " ORDER BY CASE status WHEN 'pending' THEN 0 WHEN 'accepted' THEN 1 ELSE 2 END, event_date ASC";
  const { results: bookings } = await DB.prepare(sql).bind(...params).all();
  return render(c, 'Bookings', dashBookings({ performer: p, bookings, filter, pendingBadge: await pendingCount(DB, p.id), user: c.get('user') }));
});

app.post('/dashboard/bookings/:id', async (c) => {
  const redir = requireLogin(c); if (redir) return redir;
  const DB = c.env.DB; const p = await myPerformer(DB, c.get('user'));
  const booking = await DB.prepare('SELECT * FROM bookings WHERE id = ? AND performer_id = ?').bind(c.req.param('id'), p.id).first();
  if (!booking) { flash(c, 'error', 'Booking not found.'); return c.redirect('/dashboard/bookings'); }
  const b = await c.req.parseBody();
  if (b.action === 'accept') {
    await DB.prepare("UPDATE bookings SET status = 'accepted' WHERE id = ?").bind(booking.id).run();
    await DB.prepare(`INSERT INTO availability (performer_id, date, status, note) VALUES (?, ?, 'booked', ?)
      ON CONFLICT(performer_id, date) DO UPDATE SET status = 'booked'`).bind(p.id, booking.event_date, booking.event_type || '').run();
    flash(c, 'success', 'The booking has been confirmed.');
  } else if (b.action === 'decline') {
    await DB.prepare("UPDATE bookings SET status = 'declined' WHERE id = ?").bind(booking.id).run();
    flash(c, 'success', 'The booking has been declined.');
  } else if (b.action === 'delete') {
    await DB.prepare('DELETE FROM bookings WHERE id = ?').bind(booking.id).run();
    flash(c, 'success', 'The booking has been deleted.');
  }
  return c.redirect('/dashboard/bookings');
});

app.get('/dashboard/settings', async (c) => {
  const redir = requireLogin(c); if (redir) return redir;
  const p = await myPerformer(c.env.DB, c.get('user'));
  return render(c, 'Settings', dashSettings({ user: c.get('user'), pendingBadge: await pendingCount(c.env.DB, p.id) }));
});

/* ================= ADMIN ================= */
app.get('/admin', async (c) => {
  const redir = requireAdmin(c); if (redir) return redir;
  const DB = c.env.DB;
  const { results: people } = await DB.prepare(`SELECT p.*, u.name AS user_name, u.email AS user_email, u.role AS user_role
    FROM performers p JOIN users u ON u.id = p.user_id ORDER BY p.featured DESC, p.display_name COLLATE NOCASE ASC`).all();
  const { results: admins } = await DB.prepare("SELECT id FROM users WHERE role = 'admin'").all();
  const stats = {
    people: people.length,
    pending: (await DB.prepare("SELECT COUNT(*) AS c FROM bookings WHERE status = 'pending'").first()).c,
    bookings: (await DB.prepare('SELECT COUNT(*) AS c FROM bookings').first()).c,
  };
  return render(c, 'Admin', adminHome({ people, admins, stats }));
});

app.get('/admin/new', async (c) => {
  const redir = requireAdmin(c); if (redir) return redir;
  return render(c, 'New Account', adminNew({ generated: randomHex(5) }));
});

app.post('/admin/new', async (c) => {
  const redir = requireAdmin(c); if (redir) return redir;
  const DB = c.env.DB;
  const b = await c.req.parseBody({ all: true });
  const name = String(b.name || '').trim();
  const email = String(b.email || '').trim().toLowerCase();
  const password = String(b.password || '');
  const role = b.role === 'admin' ? 'admin' : 'performer';
  const displayName = String(b.display_name || name).trim() || name;
  let cats = b.categories || []; if (!Array.isArray(cats)) cats = [cats]; cats = cats.filter(Boolean);
  if (!name || !email || password.length < 6) {
    flash(c, 'error', 'Please provide a name, an email, and a password (at least 6 characters).'); return c.redirect('/admin/new');
  }
  const exists = await DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
  if (exists) { flash(c, 'error', 'An account with that email already exists.'); return c.redirect('/admin/new'); }
  const r = await DB.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)')
    .bind(name, email, await hashPassword(password), role).run();
  await DB.prepare('INSERT INTO performers (user_id, display_name, categories, phone, location) VALUES (?, ?, ?, ?, ?)')
    .bind(r.meta.last_row_id, displayName, cats.join(','), String(b.phone || '').trim(), String(b.location || '').trim()).run();
  flash(c, 'success', `The account for ${name} has been created. Email: ${email} · Password: ${password}`);
  return c.redirect('/admin');
});

app.post('/admin/performer/:id/flag', async (c) => {
  const redir = requireAdmin(c); if (redir) return redir;
  const DB = c.env.DB;
  const p = await DB.prepare('SELECT * FROM performers WHERE id = ?').bind(c.req.param('id')).first();
  if (!p) return c.redirect('/admin');
  const b = await c.req.parseBody();
  if (b.field === 'active') await DB.prepare('UPDATE performers SET active = ? WHERE id = ?').bind(p.active ? 0 : 1, p.id).run();
  if (b.field === 'featured') await DB.prepare('UPDATE performers SET featured = ? WHERE id = ?').bind(p.featured ? 0 : 1, p.id).run();
  return c.redirect('/admin');
});

app.post('/admin/user/:id/password', async (c) => {
  const redir = requireAdmin(c); if (redir) return redir;
  const DB = c.env.DB;
  const user = await DB.prepare('SELECT * FROM users WHERE id = ?').bind(c.req.param('id')).first();
  if (!user) return c.redirect('/admin');
  const b = await c.req.parseBody();
  const pw = String(b.password || '').trim() || randomHex(5);
  await DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?').bind(await hashPassword(pw), user.id).run();
  flash(c, 'success', `New password for ${user.name}: ${pw}`);
  return c.redirect('/admin');
});

app.post('/admin/user/:id/delete', async (c) => {
  const redir = requireAdmin(c); if (redir) return redir;
  const DB = c.env.DB;
  const user = await DB.prepare('SELECT * FROM users WHERE id = ?').bind(c.req.param('id')).first();
  if (!user) return c.redirect('/admin');
  if (user.id === c.get('user').id) { flash(c, 'error', 'You cannot delete your own account.'); return c.redirect('/admin'); }
  await DB.prepare('DELETE FROM users WHERE id = ?').bind(user.id).run();
  flash(c, 'success', `The account for ${user.name} has been deleted.`);
  return c.redirect('/admin');
});

app.get('/admin/bookings', async (c) => {
  const redir = requireAdmin(c); if (redir) return redir;
  const { results: bookings } = await c.env.DB.prepare(`SELECT b.*, p.display_name AS performer_name
    FROM bookings b JOIN performers p ON p.id = b.performer_id
    ORDER BY CASE b.status WHEN 'pending' THEN 0 WHEN 'accepted' THEN 1 ELSE 2 END, b.event_date ASC`).all();
  return render(c, 'All Bookings', adminBookings({ bookings }));
});

/* ================= uploads (R2) ================= */
app.get('/uploads/:key', async (c) => {
  if (!c.env.BUCKET) return notFound(c);
  const obj = await c.env.BUCKET.get(c.req.param('key'));
  if (!obj) return notFound(c);
  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set('etag', obj.httpEtag);
  headers.set('cache-control', 'public, max-age=86400');
  return new Response(obj.body, { headers });
});

/* ================= fallback ================= */
function notFound(c) {
  return c.html(layout({ title: 'Not found', user: c.get('user'), path: new URL(c.req.url).pathname, flash: null,
    body: errorPage({ code: 404, message: 'This page could not be found.' }) }), 404);
}
app.notFound((c) => notFound(c));

app.onError((err, c) => {
  console.error(err);
  return c.html(layout({ title: 'Error', user: c.get('user') || null, path: '/', flash: null,
    body: errorPage({ code: 500, message: 'Something went wrong. Please try again.' }) }), 500);
});

export default app;
