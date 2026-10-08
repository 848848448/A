// JSON API for the native app (Capacitor). Token-based auth (Bearer <session id>)
// so it works cross-origin from the app with no cookies. Mounted at /api.

import { Hono } from 'hono';
import { CATEGORIES, CATEGORY_MAP, BOOKING_STATUS } from './lib/constants.js';
import { todayISO } from './lib/helpers.js';
import { hashPassword, verifyPassword, createSession, getSessionUser, destroySession } from './lib/auth.js';

const api = new Hono();

// ---- CORS (token auth, no cookies, so * is fine) ----
api.use('*', async (c, next) => {
  if (c.req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    });
  }
  await next();
  c.header('Access-Control-Allow-Origin', '*');
});

// ---- auth helpers ----
async function currentUser(c) {
  const auth = c.req.header('Authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) return null;
  return await getSessionUser(c.env.DB, token);
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
function need(c, user) {
  if (!user) { c.status(401); return c.json({ error: 'Not logged in' }); }
  return null;
}

// ---- meta ----
api.get('/meta', (c) => c.json({ categories: CATEGORIES, bookingStatus: BOOKING_STATUS }));

// ---- session ----
api.post('/login', async (c) => {
  const b = await c.req.json().catch(() => ({}));
  const email = String(b.email || '').trim().toLowerCase();
  const password = String(b.password || '');
  const user = await c.env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    c.status(401);
    return c.json({ error: 'Email or password is incorrect.' });
  }
  const token = await createSession(c.env.DB, user.id);
  return c.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

api.post('/logout', async (c) => {
  const auth = c.req.header('Authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (token) await destroySession(c.env.DB, token);
  return c.json({ ok: true });
});

api.get('/session', async (c) => {
  const user = await currentUser(c);
  return c.json({ user: user || null });
});

// ---- public: directory ----
api.get('/performers', async (c) => {
  const DB = c.env.DB;
  const q = (c.req.query('q') || '').trim();
  const cat = (c.req.query('cat') || '').trim();
  let sql = 'SELECT id, display_name, categories, bio, phone, public_email, website, location, price_from, price_to, genres, experience, youtube_url, instagram_url, gallery, hide_contact, verified, photo, featured FROM performers WHERE active = 1';
  const params = [];
  if (q) { sql += ' AND (display_name LIKE ? OR bio LIKE ? OR location LIKE ? OR genres LIKE ?)'; const l = `%${q}%`; params.push(l, l, l, l); }
  if (cat && CATEGORY_MAP[cat]) {
    sql += ' AND (categories = ? OR categories LIKE ? OR categories LIKE ? OR categories LIKE ?)';
    params.push(cat, `${cat},%`, `%,${cat},%`, `%,${cat}`);
  }
  sql += ' ORDER BY featured DESC, display_name COLLATE NOCASE ASC';
  const { results } = await DB.prepare(sql).bind(...params).all();
  const today = todayISO();
  const { results: freeRows } = await DB.prepare(
    "SELECT performer_id, COUNT(*) AS c FROM availability WHERE status = 'available' AND date >= ? GROUP BY performer_id"
  ).bind(today).all();
  const freeMap = {};
  for (const r of freeRows) freeMap[r.performer_id] = r.c;
  const { results: rateRows } = await DB.prepare(
    'SELECT performer_id, AVG(rating) AS a, COUNT(*) AS c FROM reviews WHERE approved = 1 GROUP BY performer_id'
  ).all();
  const rateMap = {};
  for (const r of rateRows) rateMap[r.performer_id] = { avg: Math.round(r.a * 10) / 10, count: r.c };
  const performers = results.map((p) => ({
    ...p, freeCount: freeMap[p.id] || 0,
    ratingAvg: rateMap[p.id] ? rateMap[p.id].avg : 0,
    ratingCount: rateMap[p.id] ? rateMap[p.id].count : 0,
  }));
  return c.json({ performers, total: performers.length });
});

api.get('/performers/:id', async (c) => {
  const DB = c.env.DB;
  const performer = await DB.prepare(
    'SELECT id, display_name, categories, bio, phone, public_email, website, location, price_from, price_to, genres, experience, youtube_url, instagram_url, gallery, hide_contact, verified, photo, featured FROM performers WHERE id = ? AND active = 1'
  ).bind(c.req.param('id')).first();
  if (!performer) { c.status(404); return c.json({ error: 'Not found' }); }
  const { results } = await DB.prepare('SELECT date, status, note FROM availability WHERE performer_id = ?').bind(performer.id).all();
  const availability = {};
  for (const r of results) availability[r.date] = { status: r.status, note: r.note };
  const { results: reviews } = await DB.prepare(
    'SELECT author_name, rating, comment, created_at FROM reviews WHERE performer_id = ? AND approved = 1 ORDER BY created_at DESC LIMIT 50'
  ).bind(performer.id).all();
  const agg = await DB.prepare('SELECT COUNT(*) AS c, AVG(rating) AS a FROM reviews WHERE performer_id = ? AND approved = 1').bind(performer.id).first();
  const ratingCount = agg.c || 0;
  const ratingAvg = ratingCount ? Math.round(agg.a * 10) / 10 : 0;
  return c.json({ performer, availability, today: todayISO(), reviews, ratingAvg, ratingCount });
});

api.post('/performers/:id/review', async (c) => {
  const DB = c.env.DB;
  const performer = await DB.prepare('SELECT id FROM performers WHERE id = ? AND active = 1').bind(c.req.param('id')).first();
  if (!performer) { c.status(404); return c.json({ error: 'Not found' }); }
  const b = await c.req.json().catch(() => ({}));
  const name = String(b.author_name || '').trim().slice(0, 80);
  let rating = parseInt(b.rating, 10); if (!(rating >= 1 && rating <= 5)) rating = 5;
  const comment = String(b.comment || '').trim().slice(0, 1000);
  if (!name) { c.status(400); return c.json({ error: 'Please add your name.' }); }
  await DB.prepare('INSERT INTO reviews (performer_id, author_name, rating, comment, approved) VALUES (?, ?, ?, ?, 0)')
    .bind(performer.id, name, rating, comment).run();
  return c.json({ ok: true, message: 'Thank you! Your review will show after a quick check.' });
});

api.post('/performers/:id/book', async (c) => {
  const DB = c.env.DB;
  const performer = await DB.prepare('SELECT id, display_name FROM performers WHERE id = ? AND active = 1').bind(c.req.param('id')).first();
  if (!performer) { c.status(404); return c.json({ error: 'Not found' }); }
  const b = await c.req.json().catch(() => ({}));
  const name = String(b.requester_name || '').trim();
  const phone = String(b.requester_phone || '').trim();
  const email = String(b.requester_email || '').trim();
  const eventDate = String(b.event_date || '').trim();
  if (!name || !eventDate || (!phone && !email)) {
    c.status(400);
    return c.json({ error: 'Please provide your name, a date, and a phone or email.' });
  }
  await DB.prepare(`INSERT INTO bookings (performer_id, requester_name, requester_phone, requester_email, event_date, event_type, location, message)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).bind(
    performer.id, name, phone, email, eventDate,
    String(b.event_type || '').trim(), String(b.location || '').trim(), String(b.message || '').trim()
  ).run();
  return c.json({ ok: true, message: `Your request was sent to ${performer.display_name}.` });
});

// ---- performer dashboard ----
api.get('/me', async (c) => {
  const user = await currentUser(c); const e = need(c, user); if (e) return e;
  const DB = c.env.DB; const p = await myPerformer(DB, user);
  const today = todayISO();
  const stats = {
    pending: (await DB.prepare("SELECT COUNT(*) AS c FROM bookings WHERE performer_id = ? AND status = 'pending'").bind(p.id).first()).c,
    accepted: (await DB.prepare("SELECT COUNT(*) AS c FROM bookings WHERE performer_id = ? AND status = 'accepted'").bind(p.id).first()).c,
    free: (await DB.prepare("SELECT COUNT(*) AS c FROM availability WHERE performer_id = ? AND status = 'available' AND date >= ?").bind(p.id, today).first()).c,
  };
  return c.json({ user, performer: p, stats });
});

api.put('/me/profile', async (c) => {
  const user = await currentUser(c); const e = need(c, user); if (e) return e;
  const DB = c.env.DB; const p = await myPerformer(DB, user);
  const b = await c.req.json().catch(() => ({}));
  let cats = Array.isArray(b.categories) ? b.categories : [];
  cats = cats.filter((x) => CATEGORY_MAP[x]);
  const s = (v) => String(v == null ? '' : v).trim();
  const photo = s(b.photo_url) || p.photo;
  const visible = b.visible ? 1 : 0;
  const hideContact = b.hide_contact ? 1 : 0;
  const gallery = s(b.gallery).split(/[\r\n,]+/).map((x) => x.trim())
    .filter((x) => /^https?:\/\//i.test(x)).slice(0, 12).join('\n');
  await DB.prepare(`UPDATE performers SET display_name=?, categories=?, bio=?, phone=?, public_email=?, website=?, location=?, price_from=?, price_to=?, genres=?, experience=?, youtube_url=?, instagram_url=?, gallery=?, hide_contact=?, photo=?, active=? WHERE id=?`)
    .bind(s(b.display_name) || user.name, cats.join(','), s(b.bio), s(b.phone), s(b.public_email), s(b.website), s(b.location),
      s(b.price_from), s(b.price_to), s(b.genres), s(b.experience), s(b.youtube_url), s(b.instagram_url), gallery,
      hideContact, photo, visible, p.id).run();
  return c.json({ ok: true });
});

api.get('/me/availability', async (c) => {
  const user = await currentUser(c); const e = need(c, user); if (e) return e;
  const DB = c.env.DB; const p = await myPerformer(DB, user);
  const { results } = await DB.prepare('SELECT date, status, note FROM availability WHERE performer_id = ?').bind(p.id).all();
  const map = {};
  for (const r of results) map[r.date] = { status: r.status, note: r.note };
  return c.json({ availability: map, today: todayISO() });
});

api.post('/me/availability', async (c) => {
  const user = await currentUser(c); const e = need(c, user); if (e) return e;
  const DB = c.env.DB; const p = await myPerformer(DB, user);
  const b = await c.req.json().catch(() => ({}));
  const date = String(b.date || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { c.status(400); return c.json({ error: 'Invalid date.' }); }
  if (b.clear) {
    await DB.prepare('DELETE FROM availability WHERE performer_id = ? AND date = ?').bind(p.id, date).run();
  } else {
    const status = ['available', 'unavailable', 'booked'].includes(b.status) ? b.status : 'available';
    await DB.prepare(`INSERT INTO availability (performer_id, date, status, note) VALUES (?, ?, ?, ?)
      ON CONFLICT(performer_id, date) DO UPDATE SET status = excluded.status, note = excluded.note`)
      .bind(p.id, date, status, String(b.note || '').trim()).run();
  }
  return c.json({ ok: true });
});

api.post('/me/availability/bulk', async (c) => {
  const user = await currentUser(c); const e = need(c, user); if (e) return e;
  const DB = c.env.DB; const p = await myPerformer(DB, user);
  const b = await c.req.json().catch(() => ({}));
  const from = String(b.from || '').trim(), to = String(b.to || '').trim();
  const status = ['available', 'unavailable'].includes(b.status) ? b.status : 'available';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to) || to < from) {
    c.status(400); return c.json({ error: 'Invalid date range.' });
  }
  const stmt = DB.prepare(`INSERT INTO availability (performer_id, date, status) VALUES (?, ?, ?)
    ON CONFLICT(performer_id, date) DO UPDATE SET status = excluded.status`);
  const batch = [];
  let cur = new Date(from + 'T00:00:00Z'); const end = new Date(to + 'T00:00:00Z');
  while (cur <= end) { batch.push(stmt.bind(p.id, cur.toISOString().slice(0, 10), status)); cur = new Date(cur.getTime() + 86400000); }
  if (batch.length) await DB.batch(batch);
  return c.json({ ok: true });
});

api.get('/me/bookings', async (c) => {
  const user = await currentUser(c); const e = need(c, user); if (e) return e;
  const DB = c.env.DB; const p = await myPerformer(DB, user);
  const filter = ['pending', 'accepted', 'declined'].includes(c.req.query('status')) ? c.req.query('status') : 'all';
  let sql = 'SELECT * FROM bookings WHERE performer_id = ?'; const params = [p.id];
  if (filter !== 'all') { sql += ' AND status = ?'; params.push(filter); }
  sql += " ORDER BY CASE status WHEN 'pending' THEN 0 WHEN 'accepted' THEN 1 ELSE 2 END, event_date ASC";
  const { results } = await DB.prepare(sql).bind(...params).all();
  return c.json({ bookings: results });
});

api.post('/me/bookings/:id', async (c) => {
  const user = await currentUser(c); const e = need(c, user); if (e) return e;
  const DB = c.env.DB; const p = await myPerformer(DB, user);
  const booking = await DB.prepare('SELECT * FROM bookings WHERE id = ? AND performer_id = ?').bind(c.req.param('id'), p.id).first();
  if (!booking) { c.status(404); return c.json({ error: 'Not found' }); }
  const b = await c.req.json().catch(() => ({}));
  if (b.action === 'accept') {
    await DB.prepare("UPDATE bookings SET status = 'accepted' WHERE id = ?").bind(booking.id).run();
    await DB.prepare(`INSERT INTO availability (performer_id, date, status, note) VALUES (?, ?, 'booked', ?)
      ON CONFLICT(performer_id, date) DO UPDATE SET status = 'booked'`).bind(p.id, booking.event_date, booking.event_type || '').run();
  } else if (b.action === 'decline') {
    await DB.prepare("UPDATE bookings SET status = 'declined' WHERE id = ?").bind(booking.id).run();
  } else if (b.action === 'delete') {
    await DB.prepare('DELETE FROM bookings WHERE id = ?').bind(booking.id).run();
  }
  return c.json({ ok: true });
});

api.post('/me/password', async (c) => {
  const user = await currentUser(c); const e = need(c, user); if (e) return e;
  const DB = c.env.DB;
  const b = await c.req.json().catch(() => ({}));
  const row = await DB.prepare('SELECT * FROM users WHERE id = ?').bind(user.id).first();
  if (!(await verifyPassword(String(b.current || ''), row.password_hash))) { c.status(400); return c.json({ error: 'Current password is incorrect.' }); }
  const next = String(b.next_password || '');
  if (next.length < 6) { c.status(400); return c.json({ error: 'New password must be at least 6 characters.' }); }
  await DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?').bind(await hashPassword(next), user.id).run();
  return c.json({ ok: true });
});

// ---- admin ----
async function needAdmin(c) {
  const user = await currentUser(c);
  if (!user) { c.status(401); return { resp: c.json({ error: 'Not logged in' }) }; }
  if (user.role !== 'admin') { c.status(403); return { resp: c.json({ error: 'Admins only' }) }; }
  return { user };
}

api.get('/admin/people', async (c) => {
  const g = await needAdmin(c); if (g.resp) return g.resp;
  const DB = c.env.DB;
  const { results: people } = await DB.prepare(`SELECT p.*, u.name AS user_name, u.email AS user_email, u.role AS user_role
    FROM performers p JOIN users u ON u.id = p.user_id ORDER BY p.featured DESC, p.display_name COLLATE NOCASE ASC`).all();
  const { results: admins } = await DB.prepare("SELECT id FROM users WHERE role = 'admin'").all();
  const stats = {
    people: people.length,
    pending: (await DB.prepare("SELECT COUNT(*) AS c FROM bookings WHERE status = 'pending'").first()).c,
    bookings: (await DB.prepare('SELECT COUNT(*) AS c FROM bookings').first()).c,
    reviewsPending: (await DB.prepare('SELECT COUNT(*) AS c FROM reviews WHERE approved = 0').first()).c,
  };
  return c.json({ people, adminCount: admins.length, stats });
});

api.get('/admin/reviews', async (c) => {
  const g = await needAdmin(c); if (g.resp) return g.resp;
  const { results } = await c.env.DB.prepare(`SELECT r.*, p.display_name AS performer_name
    FROM reviews r JOIN performers p ON p.id = r.performer_id
    ORDER BY r.approved ASC, r.created_at DESC`).all();
  return c.json({ reviews: results });
});

api.post('/admin/review/:id', async (c) => {
  const g = await needAdmin(c); if (g.resp) return g.resp;
  const DB = c.env.DB;
  const b = await c.req.json().catch(() => ({}));
  const id = c.req.param('id');
  if (b.action === 'approve') await DB.prepare('UPDATE reviews SET approved = 1 WHERE id = ?').bind(id).run();
  else if (b.action === 'hide') await DB.prepare('UPDATE reviews SET approved = 0 WHERE id = ?').bind(id).run();
  else if (b.action === 'delete') await DB.prepare('DELETE FROM reviews WHERE id = ?').bind(id).run();
  return c.json({ ok: true });
});

api.post('/admin/accounts', async (c) => {
  const g = await needAdmin(c); if (g.resp) return g.resp;
  const DB = c.env.DB;
  const b = await c.req.json().catch(() => ({}));
  const name = String(b.name || '').trim();
  const email = String(b.email || '').trim().toLowerCase();
  const password = String(b.password || '');
  const role = b.role === 'admin' ? 'admin' : 'performer';
  const displayName = String(b.display_name || name).trim() || name;
  let cats = Array.isArray(b.categories) ? b.categories.filter(Boolean) : [];
  if (!name || !email || password.length < 6) { c.status(400); return c.json({ error: 'Name, email and a password (6+ chars) are required.' }); }
  if (await DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first()) { c.status(409); return c.json({ error: 'An account with that email already exists.' }); }
  const r = await DB.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)')
    .bind(name, email, await hashPassword(password), role).run();
  await DB.prepare('INSERT INTO performers (user_id, display_name, categories, phone, location) VALUES (?, ?, ?, ?, ?)')
    .bind(r.meta.last_row_id, displayName, cats.join(','), String(b.phone || '').trim(), String(b.location || '').trim()).run();
  return c.json({ ok: true, email, password });
});

api.post('/admin/performer/:id/flag', async (c) => {
  const g = await needAdmin(c); if (g.resp) return g.resp;
  const DB = c.env.DB;
  const p = await DB.prepare('SELECT * FROM performers WHERE id = ?').bind(c.req.param('id')).first();
  if (!p) { c.status(404); return c.json({ error: 'Not found' }); }
  const b = await c.req.json().catch(() => ({}));
  if (b.field === 'active') await DB.prepare('UPDATE performers SET active = ? WHERE id = ?').bind(p.active ? 0 : 1, p.id).run();
  if (b.field === 'featured') await DB.prepare('UPDATE performers SET featured = ? WHERE id = ?').bind(p.featured ? 0 : 1, p.id).run();
  return c.json({ ok: true });
});

api.post('/admin/user/:id/password', async (c) => {
  const g = await needAdmin(c); if (g.resp) return g.resp;
  const DB = c.env.DB;
  const u = await DB.prepare('SELECT * FROM users WHERE id = ?').bind(c.req.param('id')).first();
  if (!u) { c.status(404); return c.json({ error: 'Not found' }); }
  const b = await c.req.json().catch(() => ({}));
  const pw = String(b.password || '').trim();
  if (pw.length < 6) { c.status(400); return c.json({ error: 'Password must be at least 6 characters.' }); }
  await DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?').bind(await hashPassword(pw), u.id).run();
  return c.json({ ok: true });
});

api.delete('/admin/user/:id', async (c) => {
  const g = await needAdmin(c); if (g.resp) return g.resp;
  const DB = c.env.DB;
  const u = await DB.prepare('SELECT * FROM users WHERE id = ?').bind(c.req.param('id')).first();
  if (!u) { c.status(404); return c.json({ error: 'Not found' }); }
  if (u.id === g.user.id) { c.status(400); return c.json({ error: 'You cannot delete your own account.' }); }
  await DB.prepare('DELETE FROM users WHERE id = ?').bind(u.id).run();
  return c.json({ ok: true });
});

api.get('/admin/bookings', async (c) => {
  const g = await needAdmin(c); if (g.resp) return g.resp;
  const { results } = await c.env.DB.prepare(`SELECT b.*, p.display_name AS performer_name
    FROM bookings b JOIN performers p ON p.id = b.performer_id
    ORDER BY CASE b.status WHEN 'pending' THEN 0 WHEN 'accepted' THEN 1 ELSE 2 END, b.event_date ASC`).all();
  return c.json({ bookings: results });
});

export default api;
