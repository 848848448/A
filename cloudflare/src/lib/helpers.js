import { CATEGORY_MAP } from './constants.js';

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function fmtDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

export function weekday(iso) {
  if (!iso) return '';
  const dt = new Date(iso + 'T00:00:00Z');
  return WEEKDAYS[dt.getUTCDay()] || '';
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function catObjects(stored) {
  if (!stored) return [];
  return stored.split(',').map((s) => s.trim()).filter(Boolean)
    .map((k) => CATEGORY_MAP[k]).filter(Boolean);
}

export function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export function colorFromString(s) {
  let h = 0;
  s = String(s);
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
  return h;
}

// Extract an 11-char YouTube video id from the common URL shapes.
export function youtubeId(url) {
  if (!url) return '';
  const m = String(url).match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/))([A-Za-z0-9_-]{11})/);
  return m ? m[1] : '';
}

export function initials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '♪';
  if (parts.length === 1) return parts[0].slice(0, 2);
  return (parts[0][0] || '') + (parts[1][0] || '');
}
