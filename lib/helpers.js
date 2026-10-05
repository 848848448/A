'use strict';

const { CATEGORY_MAP } = require('./constants');

// Convert YYYY-MM-DD to a readable Yiddish-ish date (day + month name + year)
const MONTHS = [
  'יאַנואַר', 'פֿעברואַר', 'מערץ', 'אַפּריל', 'מײַ', 'יוני',
  'יולי', 'אויגוסט', 'סעפּטעמבער', 'אָקטאָבער', 'נאָוועמבער', 'דעצעמבער',
];

const WEEKDAYS = ['זונטאָג', 'מאָנטאָג', 'דינסטאָג', 'מיטוואָך', 'דאָנערשטאָג', 'פֿרײַטאָג', 'שבת'];

function fmtDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

function weekday(iso) {
  if (!iso) return '';
  const dt = new Date(iso + 'T00:00:00');
  return WEEKDAYS[dt.getDay()] || '';
}

function todayISO() {
  const d = new Date();
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60000);
  return local.toISOString().slice(0, 10);
}

// list of category objects from stored comma string
function catObjects(stored) {
  if (!stored) return [];
  return stored
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((k) => CATEGORY_MAP[k])
    .filter(Boolean);
}

function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Deterministic pleasant color from a string (for avatar placeholders)
function colorFromString(s) {
  let h = 0;
  for (let i = 0; i < String(s).length; i++) h = (h * 31 + String(s).charCodeAt(i)) % 360;
  return h;
}

function initials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '♪';
  if (parts.length === 1) return parts[0].slice(0, 2);
  return (parts[0][0] || '') + (parts[1][0] || '');
}

module.exports = { fmtDate, weekday, todayISO, catObjects, escapeHtml, colorFromString, initials, MONTHS, WEEKDAYS };
