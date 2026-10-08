'use strict';

// Seeds the database with an admin account and a handful of sample music people.
// Safe to run repeatedly — it only inserts what is missing.

const bcrypt = require('bcryptjs');
const db = require('./db');
const { todayISO } = require('./lib/helpers');

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'avrumypolatsek@gmail.com').toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin1234';
const ADMIN_NAME = process.env.ADMIN_NAME || 'Administrator';

function ensureUser(name, email, password, role) {
  email = email.toLowerCase();
  let u = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!u) {
    const info = db
      .prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)')
      .run(name, email, bcrypt.hashSync(password, 10), role);
    u = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
  }
  return u;
}

function ensurePerformer(user, data) {
  let p = db.prepare('SELECT * FROM performers WHERE user_id = ?').get(user.id);
  if (!p) {
    const info = db
      .prepare(
        `INSERT INTO performers (user_id, display_name, categories, bio, phone, public_email, location, price_from, featured)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        user.id,
        data.display_name,
        data.categories,
        data.bio || '',
        data.phone || '',
        data.public_email || '',
        data.location || '',
        data.price_from || '',
        data.featured ? 1 : 0
      );
    p = db.prepare('SELECT * FROM performers WHERE id = ?').get(info.lastInsertRowid);
  }
  return p;
}

function addFutureAvailability(performerId, offsets, status = 'available') {
  const stmt = db.prepare(
    `INSERT INTO availability (performer_id, date, status) VALUES (?, ?, ?)
     ON CONFLICT(performer_id, date) DO NOTHING`
  );
  const base = new Date(todayISO() + 'T00:00:00');
  for (const off of offsets) {
    const d = new Date(base.getTime() + off * 86400000).toISOString().slice(0, 10);
    stmt.run(performerId, d, status);
  }
}

// --- admin ---
const admin = ensureUser(ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD, 'admin');

// --- sample music people ---
const samples = [
  {
    name: 'Michael Weiss', email: 'meir@example.com',
    display_name: 'Michael Weiss', categories: 'singer,chazan',
    bio: 'A well-known singer and cantor for weddings and celebrations. Sings in a warm, heartfelt style.',
    phone: '718-555-0101', location: 'Brooklyn, NY', price_from: '$800', featured: true,
    avail: [2, 3, 5, 9, 12, 16, 20, 23, 27, 30, 34, 40],
  },
  {
    name: 'The Harmony Band', email: 'freilach@example.com',
    display_name: 'The Harmony Band', categories: 'band,musician,keyboard',
    bio: 'A full band with keyboard, violin, drums and horns. For every kind of event.',
    phone: '845-555-0147', location: 'Monsey, NY', price_from: '$2,500', featured: true,
    avail: [1, 4, 6, 7, 11, 14, 18, 22, 25, 29, 33],
  },
  {
    name: 'Jake Black', email: 'yanky@example.com',
    display_name: 'DJ Jake Black', categories: 'dj,producer',
    bio: 'DJ and producer for modern events, with full lighting and sound.',
    phone: '347-555-0199', location: 'Williamsburg, NY', price_from: '$1,200',
    avail: [3, 8, 10, 15, 19, 24, 28, 31, 38],
  },
  {
    name: 'Sam Green', email: 'shloime@example.com',
    display_name: 'Sam Green', categories: 'violin,musician',
    bio: 'Violinist with over 15 years of experience. Solo or with a band.',
    phone: '718-555-0170', location: 'Flatbush, NY', price_from: '$600',
    avail: [2, 5, 13, 17, 21, 26, 35, 42],
  },
  {
    name: 'Barry Fried', email: 'berl@example.com',
    display_name: 'Barry Fried', categories: 'badchen,mc',
    bio: 'A lively entertainer and master of ceremonies. Brings energy to every celebration.',
    phone: '845-555-0122', location: 'Kiryas Joel, NY', price_from: '$1,000',
    avail: [1, 6, 9, 14, 20, 27, 33, 41],
  },
];

for (const s of samples) {
  const u = ensureUser(s.name, s.email, 'muzik123', 'performer');
  const p = ensurePerformer(u, s);
  addFutureAvailability(p.id, s.avail, 'available');
}

console.log('\n  ✓  Database seeded.\n');
console.log('  Admin login:');
console.log('    email:    ' + ADMIN_EMAIL);
console.log('    password: ' + ADMIN_PASSWORD);
console.log('\n  Sample performer logins (password: muzik123):');
for (const s of samples) console.log('    ' + s.email);
console.log('');
