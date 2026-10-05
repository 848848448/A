'use strict';

const path = require('path');
const crypto = require('crypto');
const express = require('express');
const multer = require('multer');
const db = require('../db');
const { requireLogin } = require('../lib/auth');
const { CATEGORIES, CATEGORY_MAP } = require('../lib/constants');
const { todayISO } = require('../lib/helpers');

const router = express.Router();

// ---- photo upload setup ----
const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', 'public', 'uploads'),
  filename: (req, file, cb) => {
    const ext = (path.extname(file.originalname) || '.jpg').toLowerCase().slice(0, 5);
    cb(null, crypto.randomBytes(12).toString('hex') + ext);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 4 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\/(jpe?g|png|webp|gif)$/.test(file.mimetype)) cb(null, true);
    else cb(null, false);
  },
});

router.use(requireLogin);

// Expose pending-booking count to the dashboard sidebar badge
router.use((req, res, next) => {
  const p = db.prepare('SELECT id FROM performers WHERE user_id = ?').get(req.currentUser.id);
  res.locals.pendingBadge = p
    ? db.prepare("SELECT COUNT(*) AS c FROM bookings WHERE performer_id = ? AND status = 'pending'").get(p.id).c
    : 0;
  next();
});

// Resolve the performer profile for the current user (create a stub if missing)
function myPerformer(user) {
  let p = db.prepare('SELECT * FROM performers WHERE user_id = ?').get(user.id);
  if (!p) {
    // Lazily-created profiles start hidden (active = 0) so empty / admin
    // profiles never show up in the public directory until published.
    const info = db
      .prepare('INSERT INTO performers (user_id, display_name, active) VALUES (?, ?, 0)')
      .run(user.id, user.name);
    p = db.prepare('SELECT * FROM performers WHERE id = ?').get(info.lastInsertRowid);
  }
  return p;
}

// Dashboard home
router.get('/', (req, res) => {
  const p = myPerformer(req.currentUser);
  const today = todayISO();
  const stats = {
    pending: db.prepare("SELECT COUNT(*) AS c FROM bookings WHERE performer_id = ? AND status = 'pending'").get(p.id).c,
    accepted: db.prepare("SELECT COUNT(*) AS c FROM bookings WHERE performer_id = ? AND status = 'accepted'").get(p.id).c,
    free: db.prepare("SELECT COUNT(*) AS c FROM availability WHERE performer_id = ? AND status = 'available' AND date >= ?").get(p.id, today).c,
  };
  const upcoming = db
    .prepare("SELECT * FROM bookings WHERE performer_id = ? AND event_date >= ? ORDER BY event_date ASC LIMIT 5")
    .all(p.id, today);
  res.render('dashboard/home', { title: 'דאַשבאָרד', performer: p, stats, upcoming });
});

// Profile edit form
router.get('/profile', (req, res) => {
  const p = myPerformer(req.currentUser);
  res.render('dashboard/profile', { title: 'מײַן פּראָפֿיל', performer: p, categories: CATEGORIES });
});

router.post('/profile', upload.single('photo_file'), (req, res) => {
  const p = myPerformer(req.currentUser);
  const b = req.body;

  // categories can arrive as array or single
  let cats = b.categories || [];
  if (!Array.isArray(cats)) cats = [cats];
  cats = cats.filter((c) => CATEGORY_MAP[c]);

  let photo = p.photo;
  if (req.file) photo = '/uploads/' + req.file.filename;
  else if (typeof b.photo_url === 'string' && b.photo_url.trim()) photo = b.photo_url.trim();

  const visible = b.visible ? 1 : 0;

  db.prepare(
    `UPDATE performers SET
      display_name = ?, categories = ?, bio = ?, phone = ?, public_email = ?,
      website = ?, location = ?, price_from = ?, photo = ?, active = ?
     WHERE id = ?`
  ).run(
    String(b.display_name || p.display_name).trim() || req.currentUser.name,
    cats.join(','),
    String(b.bio || '').trim(),
    String(b.phone || '').trim(),
    String(b.public_email || '').trim(),
    String(b.website || '').trim(),
    String(b.location || '').trim(),
    String(b.price_from || '').trim(),
    photo,
    visible,
    p.id
  );

  req.session.flash = { type: 'success', msg: 'דײַן פּראָפֿיל איז אָפּגעהיט געוואָרן.' };
  res.redirect('/dashboard/profile');
});

// Availability management
router.get('/availability', (req, res) => {
  const p = myPerformer(req.currentUser);
  const today = todayISO();
  const rows = db.prepare('SELECT date, status, note FROM availability WHERE performer_id = ?').all(p.id);
  const map = {};
  for (const r of rows) map[r.date] = r;

  // Build 3 months of calendar (today's month + next 2)
  const months = [];
  const start = new Date(today + 'T00:00:00');
  for (let mi = 0; mi < 3; mi++) {
    const first = new Date(start.getFullYear(), start.getMonth() + mi, 1);
    const year = first.getFullYear();
    const month = first.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const leading = first.getDay(); // 0=Sunday
    const cells = [];
    for (let i = 0; i < leading; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ iso, d, past: iso < today, info: map[iso] || null });
    }
    months.push({ year, month, cells });
  }

  res.render('dashboard/availability', { title: 'ווען בין איך פֿריי', performer: p, months });
});

// Toggle / set a single day's status (used by inline form)
router.post('/availability', (req, res) => {
  const p = myPerformer(req.currentUser);
  const date = String(req.body.date || '').trim();
  const status = ['available', 'unavailable', 'booked'].includes(req.body.status) ? req.body.status : 'available';
  const note = String(req.body.note || '').trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    req.session.flash = { type: 'error', msg: 'אומלעקסיקער טאָג.' };
    return res.redirect('/dashboard/availability');
  }

  if (req.body.clear === '1') {
    db.prepare('DELETE FROM availability WHERE performer_id = ? AND date = ?').run(p.id, date);
  } else {
    db.prepare(
      `INSERT INTO availability (performer_id, date, status, note) VALUES (?, ?, ?, ?)
       ON CONFLICT(performer_id, date) DO UPDATE SET status = excluded.status, note = excluded.note`
    ).run(p.id, date, status, note);
  }
  res.redirect('/dashboard/availability');
});

// Bulk mark a range or weekday pattern
router.post('/availability/bulk', (req, res) => {
  const p = myPerformer(req.currentUser);
  const from = String(req.body.from || '').trim();
  const to = String(req.body.to || '').trim();
  const status = ['available', 'unavailable'].includes(req.body.status) ? req.body.status : 'available';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to) || to < from) {
    req.session.flash = { type: 'error', msg: 'אומלעקסיקער טאָג-געגנט.' };
    return res.redirect('/dashboard/availability');
  }
  const stmt = db.prepare(
    `INSERT INTO availability (performer_id, date, status) VALUES (?, ?, ?)
     ON CONFLICT(performer_id, date) DO UPDATE SET status = excluded.status`
  );
  const tx = db.transaction(() => {
    let cur = new Date(from + 'T00:00:00');
    const end = new Date(to + 'T00:00:00');
    while (cur <= end) {
      stmt.run(p.id, cur.toISOString().slice(0, 10), status);
      cur = new Date(cur.getTime() + 86400000);
    }
  });
  tx();
  req.session.flash = { type: 'success', msg: 'די טעג זענען געמאַרקירט געוואָרן.' };
  res.redirect('/dashboard/availability');
});

// Bookings for this performer
router.get('/bookings', (req, res) => {
  const p = myPerformer(req.currentUser);
  const filter = ['pending', 'accepted', 'declined'].includes(req.query.status) ? req.query.status : 'all';
  let sql = 'SELECT * FROM bookings WHERE performer_id = ?';
  const params = [p.id];
  if (filter !== 'all') {
    sql += ' AND status = ?';
    params.push(filter);
  }
  sql += " ORDER BY CASE status WHEN 'pending' THEN 0 WHEN 'accepted' THEN 1 ELSE 2 END, event_date ASC";
  const bookings = db.prepare(sql).all(...params);
  res.render('dashboard/bookings', { title: 'באַשטעלונגען', performer: p, bookings, filter });
});

router.post('/bookings/:id', (req, res) => {
  const p = myPerformer(req.currentUser);
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ? AND performer_id = ?').get(req.params.id, p.id);
  if (!booking) {
    req.session.flash = { type: 'error', msg: 'די באַשטעלונג איז נישט געפֿונען געוואָרן.' };
    return res.redirect('/dashboard/bookings');
  }
  const action = req.body.action;
  if (action === 'accept') {
    db.prepare("UPDATE bookings SET status = 'accepted' WHERE id = ?").run(booking.id);
    // Mark the event date as booked on the calendar
    db.prepare(
      `INSERT INTO availability (performer_id, date, status, note) VALUES (?, ?, 'booked', ?)
       ON CONFLICT(performer_id, date) DO UPDATE SET status = 'booked'`
    ).run(p.id, booking.event_date, booking.event_type || '');
    req.session.flash = { type: 'success', msg: 'די באַשטעלונג איז באַשטעטיקט געוואָרן.' };
  } else if (action === 'decline') {
    db.prepare("UPDATE bookings SET status = 'declined' WHERE id = ?").run(booking.id);
    req.session.flash = { type: 'success', msg: 'די באַשטעלונג איז אָפּגעזאָגט געוואָרן.' };
  } else if (action === 'delete') {
    db.prepare('DELETE FROM bookings WHERE id = ?').run(booking.id);
    req.session.flash = { type: 'success', msg: 'די באַשטעלונג איז אויסגעמעקט געוואָרן.' };
  }
  res.redirect('/dashboard/bookings');
});

// Settings (password)
router.get('/settings', (req, res) => {
  res.render('dashboard/settings', { title: 'אײַנשטעלונגען' });
});

module.exports = router;
