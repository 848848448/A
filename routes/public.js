'use strict';

const express = require('express');
const db = require('../db');
const { CATEGORY_MAP } = require('../lib/constants');
const { todayISO } = require('../lib/helpers');

const router = express.Router();

// Build an availability lookup {date: status} for a performer
function availabilityMap(performerId) {
  const rows = db.prepare('SELECT date, status, note FROM availability WHERE performer_id = ?').all(performerId);
  const map = {};
  for (const r of rows) map[r.date] = { status: r.status, note: r.note };
  return map;
}

// Home / directory with search + category filter
router.get('/', (req, res) => {
  const q = String(req.query.q || '').trim();
  const cat = String(req.query.cat || '').trim();

  let sql = 'SELECT * FROM performers WHERE active = 1';
  const params = [];
  if (q) {
    sql += ' AND (display_name LIKE ? OR bio LIKE ? OR location LIKE ?)';
    const like = `%${q}%`;
    params.push(like, like, like);
  }
  if (cat && CATEGORY_MAP[cat]) {
    sql += ' AND (categories = ? OR categories LIKE ? OR categories LIKE ? OR categories LIKE ?)';
    params.push(cat, `${cat},%`, `%,${cat},%`, `%,${cat}`);
  }
  sql += ' ORDER BY featured DESC, display_name COLLATE NOCASE ASC';

  const performers = db.prepare(sql).all(...params);
  const today = todayISO();

  // Attach a quick "next free day" count for the next 30 days for a lively directory
  const enriched = performers.map((p) => {
    const free = db
      .prepare(
        "SELECT COUNT(*) AS c FROM availability WHERE performer_id = ? AND status = 'available' AND date >= ?"
      )
      .get(p.id, today).c;
    return { ...p, freeCount: free };
  });

  res.render('index', {
    title: 'מוזיק־דירעקטאריע',
    performers: enriched,
    q,
    cat,
    total: db.prepare('SELECT COUNT(*) AS c FROM performers WHERE active = 1').get().c,
  });
});

// Performer public profile
router.get('/p/:id', (req, res, next) => {
  const performer = db.prepare('SELECT * FROM performers WHERE id = ? AND active = 1').get(req.params.id);
  if (!performer) return next();

  const today = todayISO();
  const avail = availabilityMap(performer.id);

  // Build a 60-day window for the public calendar
  const days = [];
  const start = new Date(today + 'T00:00:00');
  for (let i = 0; i < 60; i++) {
    const d = new Date(start.getTime() + i * 86400000);
    const iso = d.toISOString().slice(0, 10);
    days.push({ iso, info: avail[iso] || null, dow: d.getDay(), dom: d.getDate(), month: d.getMonth() });
  }

  res.render('performer', {
    title: performer.display_name,
    performer,
    days,
    today,
  });
});

// Submit a booking request (public)
router.post('/p/:id/book', (req, res, next) => {
  const performer = db.prepare('SELECT * FROM performers WHERE id = ? AND active = 1').get(req.params.id);
  if (!performer) return next();

  const name = String(req.body.requester_name || '').trim();
  const phone = String(req.body.requester_phone || '').trim();
  const email = String(req.body.requester_email || '').trim();
  const eventDate = String(req.body.event_date || '').trim();
  const eventType = String(req.body.event_type || '').trim();
  const location = String(req.body.location || '').trim();
  const message = String(req.body.message || '').trim();

  if (!name || !eventDate || (!phone && !email)) {
    req.session.flash = { type: 'error', msg: 'דאַרפֿסט אָנגעבן דעם נאָמען, אַ טאָג, און אַ וועג זיך צו פֿאַרבינדן (טעלעפֿאָן אָדער בליץ-פּאָסט).' };
    return res.redirect('/p/' + performer.id + '#book');
  }

  db.prepare(
    `INSERT INTO bookings (performer_id, requester_name, requester_phone, requester_email, event_date, event_type, location, message)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(performer.id, name, phone, email, eventDate, eventType, location, message);

  req.session.flash = {
    type: 'success',
    msg: `דײַן באַשטעלונג איז אַוועקגעשיקט געוואָרן צו ${performer.display_name}. מ'וועט זיך פֿאַרבינדן מיט דיר.`,
  };
  res.redirect('/p/' + performer.id);
});

module.exports = router;
