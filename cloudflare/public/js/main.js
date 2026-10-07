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

// ---- favorites (saved artists), stored on this device ----
function getFavs() { try { return JSON.parse(localStorage.getItem('md-favs') || '[]'); } catch (e) { return []; } }
function setFavs(a) { try { localStorage.setItem('md-favs', JSON.stringify(a)); } catch (e) {} }
function isFav(id) { return getFavs().indexOf(Number(id)) !== -1; }
function toggleFav(ev, id) {
  if (ev) { ev.preventDefault(); ev.stopPropagation(); }
  id = Number(id);
  var favs = getFavs(); var i = favs.indexOf(id);
  if (i === -1) { favs.push(id); toast('Saved'); } else { favs.splice(i, 1); toast('Removed'); }
  setFavs(favs); markFavs();
  if (location.pathname === '/saved') renderSaved();
}
function markFavs() {
  var favs = getFavs();
  document.querySelectorAll('[data-fav]').forEach(function (el) {
    var on = favs.indexOf(Number(el.getAttribute('data-fav'))) !== -1;
    el.classList.toggle('on', on);
    var lbl = el.querySelector('.fav-label');
    if (lbl) lbl.textContent = on ? 'Saved' : 'Save';
  });
}

// ---- saved page: load saved artists from the public API ----
var _catMap = null;
function catMap() {
  if (_catMap) return Promise.resolve(_catMap);
  return fetch('/api/meta').then(function (r) { return r.json(); }).then(function (d) {
    _catMap = {}; (d.categories || []).forEach(function (c) { _catMap[c.key] = c; }); return _catMap;
  }).catch(function () { _catMap = {}; return _catMap; });
}
function initialsOf(name) { var p = String(name || '').trim().split(/\s+/).filter(Boolean); if (!p.length) return '♪'; return p.length === 1 ? p[0].slice(0, 2) : (p[0][0] + p[1][0]); }
function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function renderSaved() {
  var host = document.getElementById('savedGrid');
  if (!host) return;
  var favs = getFavs();
  if (!favs.length) {
    host.innerHTML = '<div class="card card-pad empty"><span class="material-symbols-rounded">favorite</span><p>You haven\'t saved any artists yet.<br>Tap the heart on an artist to save them here.</p></div>';
    return;
  }
  catMap().then(function (cm) {
    Promise.all(favs.map(function (id) {
      return fetch('/api/performers/' + id).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
    })).then(function (list) {
      var today = new Date().toISOString().slice(0, 10);
      var cards = list.filter(Boolean).map(function (d) {
        var p = d.performer; var av = d.availability || {};
        var free = 0; for (var k in av) { if (av[k] && av[k].status === 'available' && k >= today) free++; }
        var cats = String(p.categories || '').split(',').map(function (x) { return x.trim(); }).filter(Boolean).slice(0, 3);
        var tags = (cats.length ? cats : ['music']).map(function (key) { var c = cm[key] || { icon: 'music_note', label: 'Music' }; return '<span class="tag"><span class="material-symbols-rounded">' + c.icon + '</span> ' + esc(c.label) + '</span>'; }).join('');
        var cover = p.photo ? '<img src="' + esc(p.photo) + '" alt="">' : '<span class="ph">' + esc(initialsOf(p.display_name)) + '</span>';
        var freeHtml = free > 0 ? '<span class="free-pill"><span class="material-symbols-rounded">event_available</span> ' + free + ' day' + (free === 1 ? '' : 's') + ' open</span>' : '<span class="free-pill none"><span class="material-symbols-rounded">calendar_month</span> See calendar</span>';
        return '<a href="/p/' + p.id + '" class="perf-card"><div class="perf-cover">' + cover +
          '<button class="fav-btn on" data-fav="' + p.id + '" onclick="toggleFav(event,' + p.id + ')" title="Remove"><span class="material-symbols-rounded">favorite</span></button></div>' +
          '<div class="perf-body"><h3 class="perf-name">' + esc(p.display_name) + '</h3><div class="perf-cats">' + tags + '</div>' +
          (p.location ? '<div class="perf-meta"><span class="material-symbols-rounded">location_on</span> ' + esc(p.location) + '</div>' : '') +
          '<div class="perf-foot">' + freeHtml + '<span class="btn btn-tonal btn-sm">View <span class="material-symbols-rounded">arrow_forward</span></span></div></div></a>';
      });
      host.innerHTML = cards.length ? '<div class="grid">' + cards.join('') + '</div>' : '<div class="card card-pad empty"><span class="material-symbols-rounded">favorite</span><p>Your saved artists are no longer available.</p></div>';
    });
  });
}

// ---- PWA install ("add to home screen") ----
var deferredPrompt = null;
window.addEventListener('beforeinstallprompt', function (e) {
  e.preventDefault(); deferredPrompt = e;
  var b = document.getElementById('installBtn'); if (b) b.style.display = 'grid';
});
function installApp() {
  if (!deferredPrompt) { toast('Open your browser menu and choose "Add to Home screen".'); return; }
  deferredPrompt.prompt();
  deferredPrompt.userChoice.then(function () { deferredPrompt = null; var b = document.getElementById('installBtn'); if (b) b.style.display = 'none'; });
}
window.addEventListener('appinstalled', function () { var b = document.getElementById('installBtn'); if (b) b.style.display = 'none'; });

document.addEventListener('DOMContentLoaded', function () {
  syncThemeIcon();
  markFavs();
  if (location.pathname === '/saved') renderSaved();
});
