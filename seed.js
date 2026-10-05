'use strict';

// Seeds the database with an admin account and a handful of sample music people.
// Safe to run repeatedly — it only inserts what is missing.

const bcrypt = require('bcryptjs');
const db = require('./db');
const { todayISO } = require('./lib/helpers');

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'avrumypolatsek@gmail.com').toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin1234';
const ADMIN_NAME = process.env.ADMIN_NAME || 'אַדמיניסטראַטאָר';

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
    name: 'מאיר ווייס', email: 'meir@example.com',
    display_name: 'מאיר ווייס', categories: 'singer,chazan',
    bio: 'אַ באַקאַנטער זינגער און חזן פֿאַר חתונות, שבע ברכות און גרויסע שׂמחות. זינגט אויף אַ וואַרעמען, הארציקן סטיל.',
    phone: '718-555-0101', location: 'בארא פארק', price_from: '$800', featured: true,
    avail: [2, 3, 5, 9, 12, 16, 20, 23, 27, 30, 34, 40],
  },
  {
    name: 'קאפעליע פריילעך', email: 'freilach@example.com',
    display_name: 'קאַפּעליע פֿריילעך', categories: 'band,musician,keyboard',
    bio: 'אַ פֿולע קאַפּעליע מיט קלאַוויר, פֿידל, דראַמס און בלאָזערס. פֿאַר יעדע סארט שׂמחה.',
    phone: '845-555-0147', location: 'מאנסי', price_from: '$2,500', featured: true,
    avail: [1, 4, 6, 7, 11, 14, 18, 22, 25, 29, 33],
  },
  {
    name: 'יענקי שווארץ', email: 'yanky@example.com',
    display_name: 'יענקי שוואַרץ', categories: 'dj,producer',
    bio: 'די-דזשעי און פּראָדוצירער פֿאַר מאָדערנע שׂמחות. מיט ליכט און סאַונד.',
    phone: '347-555-0199', location: 'וויליאמסבורג', price_from: '$1,200',
    avail: [3, 8, 10, 15, 19, 24, 28, 31, 38],
  },
  {
    name: 'שלמה גרין', email: 'shloime@example.com',
    display_name: 'שלמה גרין', categories: 'violin,musician',
    bio: 'פֿידלער מיט איבער 15 יאָר דערפֿאַרונג. סאָלאָ אָדער מיט אַ קאַפּעליע.',
    phone: '718-555-0170', location: 'פלעטבוש', price_from: '$600',
    avail: [2, 5, 13, 17, 21, 26, 35, 42],
  },
  {
    name: 'בערל פריעד', email: 'berl@example.com',
    display_name: 'בערל פֿריעד — בדחן', categories: 'badchen,mc',
    bio: 'אַ פֿרײלעכער בדחן און צערעמאָניע-מײַסטער. מאַכט יעדע שׂמחה לעבעדיק.',
    phone: '845-555-0122', location: 'קרית יואל', price_from: '$1,000',
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
