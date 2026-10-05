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

document.addEventListener('DOMContentLoaded', syncThemeIcon);
