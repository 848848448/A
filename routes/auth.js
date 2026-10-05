'use strict';

const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');

const router = express.Router();

router.get('/login', (req, res) => {
  if (req.currentUser) return res.redirect('/dashboard');
  res.render('login', { title: 'Log in', next: req.query.next || '' });
});

router.post('/login', (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const next = req.body.next || '/dashboard';

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    req.session.flash = { type: 'error', msg: 'Email or password is incorrect.' };
    return res.redirect('/auth/login' + (req.body.next ? '?next=' + encodeURIComponent(req.body.next) : ''));
  }

  req.session.userId = user.id;
  req.session.flash = { type: 'success', msg: `Welcome, ${user.name}!` };
  const safeNext = typeof next === 'string' && next.startsWith('/') ? next : '/dashboard';
  res.redirect(safeNext);
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

// Let a logged-in user change their own password
router.post('/password', require('../lib/auth').requireLogin, (req, res) => {
  const current = String(req.body.current || '');
  const next = String(req.body.next_password || '');
  const confirm = String(req.body.confirm || '');

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.currentUser.id);
  if (!bcrypt.compareSync(current, user.password_hash)) {
    req.session.flash = { type: 'error', msg: 'Current password is incorrect.' };
    return res.redirect('/dashboard/settings');
  }
  if (next.length < 6) {
    req.session.flash = { type: 'error', msg: 'The new password must be at least 6 characters.' };
    return res.redirect('/dashboard/settings');
  }
  if (next !== confirm) {
    req.session.flash = { type: 'error', msg: 'The two passwords do not match.' };
    return res.redirect('/dashboard/settings');
  }
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(bcrypt.hashSync(next, 10), user.id);
  req.session.flash = { type: 'success', msg: 'Your password has been changed.' };
  res.redirect('/dashboard/settings');
});

module.exports = router;
