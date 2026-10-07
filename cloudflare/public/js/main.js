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

// ---- PWA: register the service worker + "new update" banner ----
function showUpdateBanner(worker) {
  if (document.getElementById('md-update')) return;
  const bar = document.createElement('div');
  bar.id = 'md-update';
  bar.style.cssText = 'position:fixed;left:16px;right:16px;bottom:16px;max-width:520px;margin:0 auto;z-index:300;' +
    'background:var(--primary,#17181c);color:var(--on-primary,#fff);border-radius:14px;padding:12px 16px;display:flex;align-items:center;gap:12px;' +
    'box-shadow:0 10px 30px rgba(0,0,0,.3);font-family:inherit';
  bar.innerHTML = '<span class="material-symbols-rounded">rocket_launch</span>' +
    '<span style="flex:1;font-weight:600">A new update is available</span>' +
    '<button id="md-update-btn" style="border:none;cursor:pointer;background:var(--on-primary,#fff);color:var(--primary,#17181c);font-weight:700;padding:8px 16px;border-radius:10px;font-family:inherit">Update</button>';
  document.body.appendChild(bar);
  document.getElementById('md-update-btn').addEventListener('click', () => {
    if (worker) worker.postMessage('SKIP_WAITING');
    bar.querySelector('#md-update-btn').textContent = 'Updating…';
  });
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((reg) => {
      // A worker already waiting (update downloaded on a previous visit).
      if (reg.waiting && navigator.serviceWorker.controller) showUpdateBanner(reg.waiting);
      // A new worker is being installed now.
      reg.addEventListener('updatefound', () => {
        const nw = reg.installing;
        if (!nw) return;
        nw.addEventListener('statechange', () => {
          if (nw.state === 'installed' && navigator.serviceWorker.controller) showUpdateBanner(nw);
        });
      });
    }).catch(() => {});

    // When the new worker takes control, reload once to get the fresh version.
    let reloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloaded) return;
      reloaded = true;
      window.location.reload();
    });
  });
}

document.addEventListener('DOMContentLoaded', syncThemeIcon);
