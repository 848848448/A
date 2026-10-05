'use strict';

const crypto = require('crypto');
const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { requireLogin, requireAdmin } = require('../lib/auth');
const { CATEGORIES } = require('../lib/constants');

const router = express.Router();
router.use(requireLogin, requireAdmin);

// Admin overview — all people + all bookings
router.get('/', (req, res) => {
  const people = db
    .prepare(
      `SELECT p.*, u.name AS user_name, u.email AS user_email, u.role AS user_role
       FROM performers p JOIN users u ON u.id = p.user_id
       ORDER BY p.featured DESC, p.display_name COLLATE NOCASE ASC`
    )
    .all();
  const admins = db.prepare("SELECT id, name, email FROM users WHERE role = 'admin' ORDER BY name").all();
  const stats = {
    people: people.length,
    pending: db.prepare("SELECT COUNT(*) AS c FROM bookings WHERE status = 'pending'").get().c,
    bookings: db.prepare('SELECT COUNT(*) AS c FROM bookings').get().c,
  };
  res.render('admin/home', { title: 'אַדמין', people, admins, stats });
});

// New account form
router.get('/new', (req, res) => {
  res.render('admin/new', { title: 'נײַער אַקאונט', categories: CATEGORIES, generated: crypto.randomBytes(5).toString('hex') });
});

// Create account (a user + a performer profile)
router.post('/new', (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const role = req.body.role === 'admin' ? 'admin' : 'performer';
  const displayName = String(req.body.display_name || name).trim() || name;

  let cats = req.body.categories || [];
  if (!Array.isArray(cats)) cats = [cats];
  cats = cats.filter(Boolean);

  if (!name || !email || password.length < 6) {
    req.session.flash = { type: 'error', msg: 'דאַרפֿסט אָנגעבן אַ נאָמען, אַ בליץ-פּאָסט, און אַ פּאַסווערד (כאָטש 6 אותיות).' };
    return res.redirect('/admin/new');
  }
  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (exists) {
    req.session.flash = { type: 'error', msg: 'עס איז שוין דאָ אַן אַקאונט מיט דעם בליץ-פּאָסט.' };
    return res.redirect('/admin/new');
  }

  const tx = db.transaction(() => {
    const info = db
      .prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)')
      .run(name, email, bcrypt.hashSync(password, 10), role);
    db.prepare(
      'INSERT INTO performers (user_id, display_name, categories, phone, location) VALUES (?, ?, ?, ?, ?)'
    ).run(
      info.lastInsertRowid,
      displayName,
      cats.join(','),
      String(req.body.phone || '').trim(),
      String(req.body.location || '').trim()
    );
  });
  tx();

  req.session.flash = {
    type: 'success',
    msg: `דער אַקאונט פֿאַר ${name} איז געעפֿנט געוואָרן. בליץ-פּאָסט: ${email} · פּאַסווערד: ${password}`,
  };
  res.redirect('/admin');
});

// Toggle active / featured
router.post('/performer/:id/flag', (req, res) => {
  const p = db.prepare('SELECT * FROM performers WHERE id = ?').get(req.params.id);
  if (!p) return res.redirect('/admin');
  if (req.body.field === 'active') db.prepare('UPDATE performers SET active = ? WHERE id = ?').run(p.active ? 0 : 1, p.id);
  if (req.body.field === 'featured') db.prepare('UPDATE performers SET featured = ? WHERE id = ?').run(p.featured ? 0 : 1, p.id);
  res.redirect('/admin');
});

// Reset a user's password
router.post('/user/:id/password', (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.redirect('/admin');
  const pw = String(req.body.password || '').trim() || crypto.randomBytes(5).toString('hex');
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(bcrypt.hashSync(pw, 10), user.id);
  req.session.flash = { type: 'success', msg: `נײַער פּאַסווערד פֿאַר ${user.name}: ${pw}` };
  res.redirect('/admin');
});

// Delete an account entirely
router.post('/user/:id/delete', (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.redirect('/admin');
  if (user.id === req.currentUser.id) {
    req.session.flash = { type: 'error', msg: 'מ\'קען נישט אויסמעקן זיך אַליין.' };
    return res.redirect('/admin');
  }
  db.prepare('DELETE FROM users WHERE id = ?').run(user.id); // cascades to performer/availability/bookings
  req.session.flash = { type: 'success', msg: `דער אַקאונט פֿון ${user.name} איז אויסגעמעקט געוואָרן.` };
  res.redirect('/admin');
});

// All bookings across the platform
router.get('/bookings', (req, res) => {
  const bookings = db
    .prepare(
      `SELECT b.*, p.display_name AS performer_name
       FROM bookings b JOIN performers p ON p.id = b.performer_id
       ORDER BY CASE b.status WHEN 'pending' THEN 0 WHEN 'accepted' THEN 1 ELSE 2 END, b.event_date ASC`
    )
    .all();
  res.render('admin/bookings', { title: 'אַלע באַשטעלונגען', bookings });
});

module.exports = router;
