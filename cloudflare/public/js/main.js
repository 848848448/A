// ---- mobile menu ----
function toggleMenu() {
  document.querySelector('.nav')?.classList.toggle('open');
}

// ---- theme toggle (light / dark) ----
(function () {
  const saved = localStorage.getItem('theme');
  if (saved) document.documentElement.setAttribute('data-theme', saved);
  else if (window.matchMedia('(prefers-color-scheme: dark)').matches)
    document.documentElement.setAttribute('data-theme', 'dark');
})();

function toggleTheme() {
  const cur = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  const next = cur === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  syncThemeIcon();
}
function syncThemeIcon() {
  const el = document.getElementById('theme-icon');
  if (!el) return;
  const dark = document.documentElement.getAttribute('data-theme') === 'dark';
  el.textContent = dark ? 'light_mode' : 'dark_mode';
}

// ---- availability day editor dialog (dashboard) ----
function openDay(iso, status, note) {
  const dlg = document.getElementById('dayDialog');
  if (!dlg) return;
  dlg.querySelector('#dlg-date').value = iso;
  dlg.querySelector('#dlg-date-label').textContent = iso;
  dlg.querySelector('#dlg-note').value = note || '';
  const sel = dlg.querySelector('#dlg-status');
  if (sel) sel.value = status || 'available';
  dlg.showModal();
}
function closeDay() { document.getElementById('dayDialog')?.close(); }

// ---- booking: prefill date from the public calendar ----
function pickBookDate(iso) {
  const input = document.getElementById('event_date');
  if (input) {
    input.value = iso;
    document.getElementById('book')?.scrollIntoView({ behavior: 'smooth' });
    input.classList.add('input');
  }
}

// ---- share a performer profile ----
function toast(msg) {
  let t = document.getElementById('md-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'md-toast';
    t.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:var(--on-surface,#1c1b1f);color:var(--surface,#fff);padding:11px 18px;border-radius:999px;font-weight:600;font-size:.9rem;box-shadow:0 8px 24px rgba(0,0,0,.25);z-index:200;opacity:0;transition:opacity .2s';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  requestAnimationFrame(() => { t.style.opacity = '1'; });
  clearTimeout(t._h);
  t._h = setTimeout(() => { t.style.opacity = '0'; }, 2200);
}
function shareProfile() {
  const url = location.href;
  const title = document.title;
  if (navigator.share) {
    navigator.share({ title, url }).catch(() => {});
  } else if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(() => toast('Link copied!')).catch(() => toast(url));
  } else {
    toast('Copy this link: ' + url);
  }
}

// ---- PWA: register the service worker so the site is installable as an app ----
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

document.addEventListener('DOMContentLoaded', syncThemeIcon);
