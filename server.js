'use strict';

const path = require('path');
const fs = require('fs');
const express = require('express');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const methodOverride = require('method-override');

const db = require('./db');
const constants = require('./lib/constants');
const helpers = require('./lib/helpers');

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure upload dir exists
const UPLOAD_DIR = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Views
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static
app.use(express.static(path.join(__dirname, 'public')));

// Body parsing + method override (for PUT/DELETE/PATCH via forms)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));

// Sessions (persisted to sqlite so logins survive restarts)
app.use(
  session({
    store: new SQLiteStore({ db: 'sessions.db', dir: path.join(__dirname, 'data') }),
    secret: process.env.SESSION_SECRET || 'muzik-direktorie-local-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 14 }, // 14 days
  })
);

// Simple flash messages
app.use((req, res, next) => {
  res.locals.flash = req.session.flash || null;
  delete req.session.flash;
  next();
});

// Expose current user + shared helpers to all templates
app.use((req, res, next) => {
  let user = null;
  if (req.session.userId) {
    user = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(req.session.userId);
  }
  req.currentUser = user;
  res.locals.currentUser = user;
  res.locals.constants = constants;
  res.locals.h = helpers;
  res.locals.path = req.path;
  res.locals.query = req.query;
  next();
});

// Routes
app.use('/', require('./routes/public'));
app.use('/auth', require('./routes/auth'));
app.use('/dashboard', require('./routes/dashboard'));
app.use('/admin', require('./routes/admin'));

// 404
app.use((req, res) => {
  res.status(404).render('error', { title: 'נישט געפֿונען', code: 404, message: 'די זײַטל איז נישט געפֿונען געוואָרן.' });
});

// Error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render('error', { title: 'אַ טעות', code: 500, message: 'עפּעס איז שיעף געגאַנגען. פּרוביר נאָכאַמאָל.' });
});

app.listen(PORT, () => {
  console.log(`\n  ♪  מוזיק־דירעקטאריע לויפֿט אויף  http://localhost:${PORT}\n`);
});
