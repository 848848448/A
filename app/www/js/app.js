/* Music Directory — native app (self-contained screens, talks to the API). */
'use strict';

var API_BASE = 'https://muzik-direktorie.abdeveloping.workers.dev/api';

var CATEGORIES = [
  { key: 'singer', label: 'Singer', icon: 'mic' },
  { key: 'musician', label: 'Musician / Player', icon: 'music_note' },
  { key: 'band', label: 'Band', icon: 'groups' },
  { key: 'chazan', label: 'Cantor', icon: 'volume_up' },
  { key: 'badchen', label: 'Entertainer', icon: 'theater_comedy' },
  { key: 'dj', label: 'DJ', icon: 'graphic_eq' },
  { key: 'keyboard', label: 'Keyboard', icon: 'piano' },
  { key: 'violin', label: 'Violin', icon: 'music_note' },
  { key: 'guitar', label: 'Guitar', icon: 'music_note' },
  { key: 'drums', label: 'Drums', icon: 'album' },
  { key: 'trumpet', label: 'Trumpet / Horn', icon: 'campaign' },
  { key: 'choir', label: 'Choir', icon: 'diversity_3' },
  { key: 'conductor', label: 'Conductor', icon: 'podium' },
  { key: 'producer', label: 'Producer', icon: 'tune' },
  { key: 'arranger', label: 'Arranger', icon: 'queue_music' },
  { key: 'mc', label: 'MC / Host', icon: 'record_voice_over' },
];
var CMAP = {}; CATEGORIES.forEach(function (c) { CMAP[c.key] = c; });
var BSTATUS = {
  pending: { label: 'Awaiting reply', icon: 'schedule', cls: 'is-pending' },
  accepted: { label: 'Confirmed', icon: 'check_circle', cls: 'is-accepted' },
  declined: { label: 'Declined', icon: 'cancel', cls: 'is-declined' },
};
var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
var DOWS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/* ---------- state ---------- */
var state = { token: null, user: null };
try { state.token = localStorage.getItem('md-token'); } catch (e) {}

/* ---------- helpers ---------- */
function e(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
function hue(s) { var h = 0; s = String(s); for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360; return h; }
function initials(n) { var p = String(n || '').trim().split(/\s+/).filter(Boolean); if (!p.length) return '♪'; if (p.length === 1) return p[0].slice(0, 2); return (p[0][0] || '') + (p[1][0] || ''); }
function fmtDate(iso) { if (!iso) return ''; var a = iso.split('-'); if (a.length < 3) return iso; return MONTHS[+a[1] - 1] + ' ' + (+a[2]) + ', ' + a[0]; }
function weekday(iso) { if (!iso) return ''; var d = new Date(iso + 'T00:00:00Z'); return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getUTCDay()]; }
function todayISO() { return new Date().toISOString().slice(0, 10); }
function catObjs(s) { if (!s) return []; return s.split(',').map(function (x) { return CMAP[x.trim()]; }).filter(Boolean); }
function avatar(name, photo, size) { var h = hue(name || ''); var fs = Math.round(size * 0.4); var inner = photo ? '<img src="' + e(photo) + '" alt="" onerror="this.style.display=\'none\'">' : e(initials(name)); return '<div class="avatar" style="width:' + size + 'px;height:' + size + 'px;font-size:' + fs + 'px;background:hsl(' + h + ',55%,55%)">' + inner + '</div>'; }
function waNumber(phone) { var d = String(phone || '').replace(/\D/g, ''); if (!d) return ''; return d.length === 10 ? '1' + d : d; }

function toast(msg, isErr) {
  var host = document.getElementById('toasts');
  var t = document.createElement('div'); t.className = 'toast' + (isErr ? ' err' : ''); t.textContent = msg;
  host.appendChild(t);
  setTimeout(function () { t.style.transition = 'opacity .3s'; t.style.opacity = '0'; setTimeout(function () { t.remove(); }, 300); }, 2400);
}

/* ---------- API ---------- */
function api(path, opts) {
  opts = opts || {};
  var headers = { 'Content-Type': 'application/json' };
  if (state.token) headers['Authorization'] = 'Bearer ' + state.token;
  return fetch(API_BASE + path, {
    method: opts.method || 'GET',
    headers: headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  }).then(function (r) {
    return r.json().catch(function () { return {}; }).then(function (data) {
      if (!r.ok) { var err = new Error(data.error || ('Error ' + r.status)); err.status = r.status; throw err; }
      return data;
    });
  });
}

/* ---------- routing ---------- */
function go(hash) { location.hash = hash; }
function parseHash() {
  var h = location.hash.replace(/^#/, '') || '/';
  return h;
}

var appEl;
function setView(html) { appEl.innerHTML = '<header class="appbar"><div class="container appbar-inner">' + brandHtml() + themeBtn() + '</div></header><main class="page appview"><div class="container">' + html + '</div></main>' + tabbar(); }
function setLoading() { appEl.innerHTML = '<header class="appbar"><div class="container appbar-inner">' + brandHtml() + themeBtn() + '</div></header><div class="loading"><div class="spinner"></div></div>' + tabbar(); }

function brandHtml() {
  return '<a href="#/" class="brand"><span class="logo"><span class="material-symbols-rounded fill">music_note</span></span><span>Music Directory</span></a>';
}
function themeBtn() { return '<button class="icon-btn" style="margin-inline-start:auto" onclick="toggleTheme()"><span class="material-symbols-rounded" id="theme-icon">dark_mode</span></button>'; }

function tabbar() {
  var cur = parseHash();
  function tab(hash, icon, label, match) {
    var active = match(cur) ? 'active' : '';
    return '<button class="' + active + '" onclick="go(\'' + hash + '\')"><span class="material-symbols-rounded">' + icon + '</span>' + label + '</button>';
  }
  var tabs = tab('/', 'search', 'Browse', function (h) { return h === '/' || h.indexOf('/p/') === 0; });
  if (state.user) {
    tabs += tab('/dashboard', 'dashboard', 'Dashboard', function (h) { return h === '/dashboard' || h.indexOf('/me/') === 0; });
    if (state.user.role === 'admin') tabs += tab('/admin', 'admin_panel_settings', 'Admin', function (h) { return h.indexOf('/admin') === 0; });
    tabs += tab('/me/settings', 'account_circle', 'Account', function (h) { return h === '/me/settings'; });
  } else {
    tabs += tab('/login', 'login', 'Log in', function (h) { return h === '/login'; });
  }
  return '<nav class="tabbar">' + tabs + '</nav>';
}

/* ---------- theme ---------- */
(function () { try { var s = localStorage.getItem('theme'); if (s) document.documentElement.setAttribute('data-theme', s); else if (matchMedia('(prefers-color-scheme: dark)').matches) document.documentElement.setAttribute('data-theme', 'dark'); } catch (e) {} })();
function toggleTheme() { var d = document.documentElement.getAttribute('data-theme'); var dark = d === 'dark' || (!d && matchMedia('(prefers-color-scheme: dark)').matches); var next = dark ? 'light' : 'dark'; document.documentElement.setAttribute('data-theme', next); try { localStorage.setItem('theme', next); } catch (e) {} syncTheme(); }
function syncTheme() { var el = document.getElementById('theme-icon'); if (!el) return; var d = document.documentElement.getAttribute('data-theme'); var dark = d === 'dark' || (!d && matchMedia('(prefers-color-scheme: dark)').matches); el.textContent = dark ? 'light_mode' : 'dark_mode'; }

/* ---------- views ---------- */
var directoryState = { q: '', cat: '' };

function viewDirectory() {
  setLoading();
  var qs = [];
  if (directoryState.q) qs.push('q=' + encodeURIComponent(directoryState.q));
  if (directoryState.cat) qs.push('cat=' + encodeURIComponent(directoryState.cat));
  api('/performers' + (qs.length ? '?' + qs.join('&') : '')).then(function (d) {
    var chips = '<div class="chip ' + (!directoryState.cat ? 'active' : '') + '" onclick="setCat(\'\')"><span class="material-symbols-rounded">apps</span> All</div>';
    CATEGORIES.forEach(function (c) { chips += '<div class="chip ' + (directoryState.cat === c.key ? 'active' : '') + '" onclick="setCat(\'' + c.key + '\')"><span class="material-symbols-rounded">' + c.icon + '</span> ' + c.label + '</div>'; });
    var grid;
    if (!d.performers.length) {
      grid = '<div class="card card-pad empty"><span class="material-symbols-rounded">search_off</span><p>No music people found.</p></div>';
    } else {
      grid = '<div class="grid">' + d.performers.map(function (p) {
        var cats = catObjs(p.categories); var h1 = hue(p.display_name), h2 = (h1 + 40) % 360;
        var cover = p.photo ? '<img src="' + e(p.photo) + '" alt="" onerror="this.parentNode.innerHTML=\'<span class=ph>' + e(initials(p.display_name)) + '</span>\'">' : '<span class="ph">' + e(initials(p.display_name)) + '</span>';
        var tags = (cats.length ? cats.slice(0, 3) : [{ icon: 'music_note', label: 'Music' }]).map(function (c) { return '<span class="tag"><span class="material-symbols-rounded">' + c.icon + '</span> ' + c.label + '</span>'; }).join('');
        var free = p.freeCount > 0 ? '<span class="free-pill"><span class="material-symbols-rounded">event_available</span> ' + p.freeCount + ' free day' + (p.freeCount === 1 ? '' : 's') + '</span>' : '<span class="free-pill none"><span class="material-symbols-rounded">calendar_month</span> See calendar</span>';
        return '<a href="#/p/' + p.id + '" class="perf-card"><div class="perf-cover" style="background:linear-gradient(135deg,hsl(' + h1 + ',60%,58%),hsl(' + h2 + ',60%,48%))">' + cover + (p.featured ? '<span class="perf-featured"><span class="material-symbols-rounded fill">star</span> Featured</span>' : '') + '</div><div class="perf-body"><h3 class="perf-name">' + e(p.display_name) + '</h3><div class="perf-cats">' + tags + '</div>' + (p.location ? '<div class="perf-meta"><span class="material-symbols-rounded">location_on</span> ' + e(p.location) + '</div>' : '') + '<div class="perf-foot">' + free + '<span class="btn btn-tonal btn-sm">View <span class="material-symbols-rounded">arrow_forward</span></span></div></div></a>';
      }).join('') + '</div>';
    }
    setView(
      '<section class="hero" style="padding:26px 22px"><h1 style="font-size:1.5rem;margin:0 0 8px">Find the right music</h1><p style="font-size:.95rem;margin:0 0 16px">Singers, players, bands and all music people — see availability and book them.</p>' +
      '<div class="search-field"><span class="material-symbols-rounded">search</span><input id="q" type="text" placeholder="Search name, category, location…" value="' + e(directoryState.q) + '"></div></section>' +
      '<section class="section-gap"><div class="chips">' + chips + '</div></section>' +
      '<section class="section-gap"><div class="section-head"><h2 style="font-size:1.3rem"><span class="material-symbols-rounded">library_music</span> ' + (directoryState.cat && CMAP[directoryState.cat] ? CMAP[directoryState.cat].label + 's' : 'All music people') + '</h2><div class="muted">' + d.performers.length + ' result' + (d.performers.length === 1 ? '' : 's') + '</div></div>' + grid + '</section>'
    );
    var qi = document.getElementById('q');
    if (qi) { var t; qi.addEventListener('input', function () { clearTimeout(t); t = setTimeout(function () { directoryState.q = qi.value; viewDirectory(); }, 350); }); }
    syncTheme();
  }).catch(showError);
}
function setCat(k) { directoryState.cat = k; viewDirectory(); }

function viewProfile(id) {
  setLoading();
  api('/performers/' + id).then(function (d) {
    var p = d.performer; var cats = catObjs(p.categories);
    var tags = (cats.length ? cats : [{ icon: 'music_note', label: 'Music' }]).map(function (c) { return '<span class="tag"><span class="material-symbols-rounded">' + c.icon + '</span> ' + c.label + '</span>'; }).join('');
    // calendar: 60 days
    var today = d.today; var av = d.availability || {};
    var blocks = []; var cur = null; var start = new Date(today + 'T00:00:00Z');
    for (var i = 0; i < 60; i++) { var dt = new Date(start.getTime() + i * 86400000); var iso = dt.toISOString().slice(0, 10); var m = dt.getUTCMonth(); if (!cur || cur.m !== m) { cur = { m: m, y: dt.getUTCFullYear(), lead: dt.getUTCDay(), days: [] }; blocks.push(cur); } cur.days.push({ iso: iso, dom: dt.getUTCDate(), info: av[iso] }); }
    var cals = blocks.map(function (b) {
      var cells = DOWS.map(function (w) { return '<div class="cal-dow">' + w + '</div>'; }).join('');
      for (var j = 0; j < b.lead; j++) cells += '<div class="cal-cell"></div>';
      b.days.forEach(function (day) { var st = day.info ? day.info.status : null; var cls = st === 'available' ? 's-available' : st === 'booked' ? 's-booked' : st === 'unavailable' ? 's-unavailable' : ''; var click = (st === 'available' || !st) ? ' onclick="pickDate(\'' + day.iso + '\')"' : ''; cells += '<div class="cal-cell"><div class="cal-day ' + cls + '"' + click + '>' + day.dom + '</div></div>'; });
      return '<div class="cal"><h3>' + MONTHS[b.m] + ' ' + b.y + '</h3><div class="cal-grid">' + cells + '</div></div>';
    }).join('');
    var wa = waNumber(p.phone);
    var contact = '';
    if (p.phone) contact += '<a href="tel:' + e(p.phone) + '"><span class="material-symbols-rounded">call</span> ' + e(p.phone) + '</a>';
    if (wa) contact += '<a href="https://wa.me/' + wa + '" target="_blank" rel="noopener"><span class="material-symbols-rounded">chat</span> WhatsApp</a>';
    if (p.public_email) contact += '<a href="mailto:' + e(p.public_email) + '"><span class="material-symbols-rounded">mail</span> ' + e(p.public_email) + '</a>';
    if (p.website) contact += '<a href="' + e(p.website) + '" target="_blank" rel="noopener"><span class="material-symbols-rounded">language</span> Website</a>';
    if (!contact) contact = '<div class="ci muted"><span class="material-symbols-rounded">info</span> Send a booking request below.</div>';

    setView(
      '<a href="#/" class="btn btn-ghost btn-sm back-btn" style="margin-bottom:14px"><span class="material-symbols-rounded">arrow_back</span> Back</a>' +
      '<section class="card card-pad"><div class="profile-head">' + avatar(p.display_name, p.photo, 100) +
      '<div style="flex:1;min-width:200px"><h1 style="font-size:1.6rem">' + e(p.display_name) + '</h1><div class="perf-cats">' + tags + '</div>' +
      '<div style="display:flex;gap:16px;flex-wrap:wrap;margin-top:10px" class="muted">' + (p.location ? '<span style="display:inline-flex;gap:5px;align-items:center"><span class="material-symbols-rounded">location_on</span>' + e(p.location) + '</span>' : '') + (p.price_from ? '<span style="display:inline-flex;gap:5px;align-items:center"><span class="material-symbols-rounded">payments</span>From ' + e(p.price_from) + '</span>' : '') + '</div></div></div></section>' +
      (p.bio ? '<section class="card card-pad section-gap"><div class="section-head" style="margin-bottom:8px"><h2 style="font-size:1.1rem"><span class="material-symbols-rounded">info</span> About</h2></div><p style="margin:0;white-space:pre-line">' + e(p.bio) + '</p></section>' : '') +
      '<section class="card card-pad section-gap"><div class="section-head" style="margin-bottom:8px"><h2 style="font-size:1.1rem"><span class="material-symbols-rounded">contacts</span> Contact</h2></div><div class="contact-list">' + contact + '</div></section>' +
      '<section class="card card-pad section-gap"><div class="section-head" style="margin-bottom:8px"><h2 style="font-size:1.1rem"><span class="material-symbols-rounded">calendar_month</span> Availability</h2></div><div class="legend" style="margin-bottom:14px"><span><span class="sw" style="background:var(--success-bg)"></span> Available</span><span><span class="sw" style="background:var(--info-bg)"></span> Booked</span><span><span class="sw" style="background:var(--danger-bg)"></span> Unavailable</span></div><div class="cal-wrap">' + cals + '</div></section>' +
      '<section class="card card-pad section-gap" id="book"><div class="section-head" style="margin-bottom:8px"><h2 style="font-size:1.1rem"><span class="material-symbols-rounded">event</span> Book / Request</h2></div>' +
      '<div class="field"><label>Your name *</label><input class="input" id="b-name"></div>' +
      '<div class="fieldrow"><div class="field"><label>Phone</label><input class="input" id="b-phone" type="tel"></div><div class="field"><label>Email</label><input class="input" id="b-email" type="email"></div></div>' +
      '<div class="fieldrow"><div class="field"><label>Event date *</label><input class="input" id="b-date" type="date" min="' + today + '"></div><div class="field"><label>Event type</label><input class="input" id="b-type" placeholder="Wedding…"></div></div>' +
      '<div class="field"><label>A note</label><textarea class="textarea" id="b-msg"></textarea></div>' +
      '<button class="btn btn-accent btn-block" onclick="submitBooking(' + p.id + ')"><span class="material-symbols-rounded">send</span> Send request</button></section>'
    );
    syncTheme();
  }).catch(showError);
}
function pickDate(iso) { var i = document.getElementById('b-date'); if (i) { i.value = iso; document.getElementById('book').scrollIntoView({ behavior: 'smooth' }); } }
function submitBooking(id) {
  var body = { requester_name: val('b-name'), requester_phone: val('b-phone'), requester_email: val('b-email'), event_date: val('b-date'), event_type: val('b-type'), message: val('b-msg') };
  api('/performers/' + id + '/book', { method: 'POST', body: body }).then(function (d) { toast(d.message || 'Request sent!'); go('/p/' + id); }).catch(function (err) { toast(err.message, true); });
}
function val(id) { var el = document.getElementById(id); return el ? el.value : ''; }

function viewLogin() {
  setView(
    '<div style="max-width:420px;margin:20px auto 0"><div class="card card-pad"><div class="auth-logo"><span class="material-symbols-rounded fill">music_note</span></div>' +
    '<h1 style="text-align:center;margin:0 0 6px;font-size:1.5rem">Log in</h1><p class="muted" style="text-align:center;margin:0 0 20px">Access your profile, calendar and bookings</p>' +
    '<div class="field"><label>Email</label><input class="input" id="l-email" type="email" autocomplete="username"></div>' +
    '<div class="field"><label>Password</label><input class="input" id="l-pass" type="password" autocomplete="current-password"></div>' +
    '<button class="btn btn-primary btn-block" onclick="doLogin()"><span class="material-symbols-rounded">login</span> Sign in</button>' +
    '<div class="divider"></div><p class="muted small" style="text-align:center;margin:0">No account yet? An administrator opens one for you.</p></div></div>'
  );
  syncTheme();
  var pass = document.getElementById('l-pass');
  if (pass) pass.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') doLogin(); });
}
function doLogin() {
  var email = val('l-email'), password = val('l-pass');
  api('/login', { method: 'POST', body: { email: email, password: password } }).then(function (d) {
    state.token = d.token; state.user = d.user;
    try { localStorage.setItem('md-token', d.token); } catch (e) {}
    toast('Welcome, ' + d.user.name + '!'); go('/dashboard');
  }).catch(function (err) { toast(err.message, true); });
}
function logout() {
  api('/logout', { method: 'POST' }).catch(function () {});
  state.token = null; state.user = null;
  try { localStorage.removeItem('md-token'); } catch (e) {}
  go('/');
}

function viewDashboard() {
  if (!state.user) return go('/login');
  setLoading();
  api('/me').then(function (d) {
    var p = d.performer; var s = d.stats;
    setView(
      dashNav('home') +
      '<div class="section-head"><h2><span class="material-symbols-rounded">waving_hand</span> Hi, ' + e(p.display_name) + '</h2><a href="#/p/' + p.id + '" class="btn btn-outline btn-sm"><span class="material-symbols-rounded">visibility</span> Public</a></div>' +
      '<div class="stat-row"><div class="stat"><div class="ic ic-a"><span class="material-symbols-rounded">schedule</span></div><div><div class="num">' + s.pending + '</div><div class="lbl">Pending</div></div></div>' +
      '<div class="stat"><div class="ic ic-s"><span class="material-symbols-rounded">check_circle</span></div><div><div class="num">' + s.accepted + '</div><div class="lbl">Confirmed</div></div></div>' +
      '<div class="stat"><div class="ic ic-p"><span class="material-symbols-rounded">event_available</span></div><div><div class="num">' + s.free + '</div><div class="lbl">Free days</div></div></div></div>' +
      '<section class="section-gap"><div class="card card-pad"><div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap"><span class="material-symbols-rounded" style="font-size:36px;color:var(--primary)">tips_and_updates</span><div style="flex:1;min-width:160px"><strong>Keep your profile fresh</strong><div class="muted small">Set your availability so people can book you.</div></div><a href="#/me/availability" class="btn btn-tonal"><span class="material-symbols-rounded">calendar_month</span> Availability</a></div></div></section>'
    );
    syncTheme();
  }).catch(showError);
}

function dashNav(active) {
  function i(hash, key, icon, label) { return '<a href="#' + hash + '" class="chip ' + (active === key ? 'active' : '') + '"><span class="material-symbols-rounded">' + icon + '</span> ' + label + '</a>'; }
  return '<div class="chips" style="margin-bottom:18px">' + i('/dashboard', 'home', 'dashboard', 'Overview') + i('/me/profile', 'profile', 'badge', 'Profile') + i('/me/availability', 'avail', 'calendar_month', 'Availability') + i('/me/bookings', 'book', 'event', 'Bookings') + '</div>';
}

function viewMyProfile() {
  if (!state.user) return go('/login');
  setLoading();
  api('/me').then(function (d) {
    var p = d.performer; var myCats = p.categories ? p.categories.split(',') : [];
    var catSel = CATEGORIES.map(function (c) { return '<label><input type="checkbox" value="' + c.key + '" ' + (myCats.indexOf(c.key) !== -1 ? 'checked' : '') + '><span class="material-symbols-rounded">' + c.icon + '</span> ' + c.label + '</label>'; }).join('');
    setView(
      dashNav('profile') +
      '<div class="section-head"><h2><span class="material-symbols-rounded">badge</span> My Profile</h2></div>' +
      '<section class="card card-pad"><div style="display:flex;gap:16px;align-items:center;margin-bottom:14px">' + avatar(p.display_name, p.photo, 72) + '<div style="flex:1"><label class="small" style="font-weight:600">Photo link</label><input class="input" id="p-photo" placeholder="https://…" value="' + e(p.photo || '') + '"></div></div>' +
      '<div class="field" style="background:var(--surface-sunken);padding:12px 14px;border-radius:12px"><label style="display:flex;align-items:center;gap:10px;margin:0;cursor:pointer"><input type="checkbox" id="p-visible" ' + (p.active ? 'checked' : '') + ' style="width:20px;height:20px;accent-color:var(--primary)"><span class="material-symbols-rounded" style="color:var(--primary)">public</span> Show me in the directory</label></div>' +
      '<div class="field"><label>Name *</label><input class="input" id="p-name" value="' + e(p.display_name) + '"></div>' +
      '<div class="field"><label>What do you do?</label><div class="cat-select" id="p-cats">' + catSel + '</div></div>' +
      '<div class="field"><label>About you</label><textarea class="textarea" id="p-bio">' + e(p.bio) + '</textarea></div>' +
      '<div class="fieldrow"><div class="field"><label>Phone</label><input class="input" id="p-phone" value="' + e(p.phone) + '"></div><div class="field"><label>Public email</label><input class="input" id="p-email" value="' + e(p.public_email) + '"></div></div>' +
      '<div class="fieldrow"><div class="field"><label>Website</label><input class="input" id="p-web" value="' + e(p.website) + '"></div><div class="field"><label>Location</label><input class="input" id="p-loc" value="' + e(p.location) + '"></div></div>' +
      '<div class="field"><label>Price from</label><input class="input" id="p-price" value="' + e(p.price_from) + '"></div>' +
      '<button class="btn btn-primary btn-block" onclick="saveProfile()"><span class="material-symbols-rounded">save</span> Save</button></section>'
    );
    syncTheme();
  }).catch(showError);
}
function saveProfile() {
  var cats = [];
  document.querySelectorAll('#p-cats input:checked').forEach(function (i) { cats.push(i.value); });
  var body = { display_name: val('p-name'), categories: cats, bio: val('p-bio'), phone: val('p-phone'), public_email: val('p-email'), website: val('p-web'), location: val('p-loc'), price_from: val('p-price'), photo_url: val('p-photo'), visible: document.getElementById('p-visible').checked };
  api('/me/profile', { method: 'PUT', body: body }).then(function () { toast('Profile saved!'); }).catch(function (err) { toast(err.message, true); });
}

function viewAvailability() {
  if (!state.user) return go('/login');
  setLoading();
  api('/me/availability').then(function (d) {
    var av = d.availability || {}; var today = d.today;
    var months = []; var start = new Date(today + 'T00:00:00Z');
    for (var mi = 0; mi < 3; mi++) { var first = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + mi, 1)); var y = first.getUTCFullYear(), m = first.getUTCMonth(); var dim = new Date(Date.UTC(y, m + 1, 0)).getUTCDate(); var cells = []; for (var dd = 1; dd <= dim; dd++) { var iso = y + '-' + String(m + 1).padStart(2, '0') + '-' + String(dd).padStart(2, '0'); cells.push({ iso: iso, d: dd, past: iso < today, info: av[iso] }); } months.push({ y: y, m: m, cells: cells }); }
    var cals = months.map(function (b) {
      var lead = new Date(Date.UTC(b.y, b.m, 1)).getUTCDay();
      var cells = DOWS.map(function (w) { return '<div class="cal-dow">' + w + '</div>'; }).join('');
      for (var j = 0; j < lead; j++) cells += '<div class="cal-cell"></div>';
      b.cells.forEach(function (cell) { var st = cell.info ? cell.info.status : null; var cls = st ? 's-' + st : ''; var click = cell.past ? '' : ' onclick="dayTap(\'' + cell.iso + '\',\'' + (st || '') + '\')"'; cells += '<div class="cal-cell"><div class="cal-day ' + cls + ' ' + (cell.past ? 'past' : '') + '"' + click + '>' + cell.d + '</div></div>'; });
      return '<div class="cal"><h3>' + MONTHS[b.m] + ' ' + b.y + '</h3><div class="cal-grid">' + cells + '</div></div>';
    }).join('');
    setView(
      dashNav('avail') +
      '<div class="section-head"><h2><span class="material-symbols-rounded">calendar_month</span> My Availability</h2></div>' +
      '<div class="card card-pad" style="margin-bottom:16px"><div class="legend"><span><span class="sw" style="background:var(--success-bg)"></span> Available</span><span><span class="sw" style="background:var(--danger-bg)"></span> Unavailable</span><span><span class="sw" style="background:var(--info-bg)"></span> Booked</span></div><p class="muted small" style="margin:8px 0 0">Tap a day to set it.</p></div>' +
      '<div class="cal-wrap">' + cals + '</div>'
    );
    syncTheme();
  }).catch(showError);
}
function dayTap(iso, st) {
  var next = st === 'available' ? 'unavailable' : st === 'unavailable' ? '' : 'available';
  var body = next ? { date: iso, status: next } : { date: iso, clear: true };
  api('/me/availability', { method: 'POST', body: body }).then(function () { viewAvailability(); }).catch(function (err) { toast(err.message, true); });
}

function viewBookings() {
  if (!state.user) return go('/login');
  setLoading();
  api('/me/bookings').then(function (d) {
    var list;
    if (!d.bookings.length) list = '<div class="card card-pad empty"><span class="material-symbols-rounded">inbox</span><p>No bookings yet.</p></div>';
    else list = '<div class="list">' + d.bookings.map(function (b) {
      var st = BSTATUS[b.status];
      var actions = '<div class="row-actions">';
      if (b.status !== 'accepted') actions += '<button class="btn btn-primary btn-sm" onclick="bookAction(' + b.id + ',\'accept\')"><span class="material-symbols-rounded">check</span> Confirm</button>';
      if (b.status !== 'declined') actions += '<button class="btn btn-ghost btn-sm" onclick="bookAction(' + b.id + ',\'decline\')"><span class="material-symbols-rounded">block</span> Decline</button>';
      actions += '<button class="btn btn-danger btn-sm" onclick="bookAction(' + b.id + ',\'delete\')"><span class="material-symbols-rounded">delete</span></button></div>';
      return '<div class="row-card"><div class="row-main"><div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap"><span class="row-title">' + e(b.requester_name) + '</span><span class="status ' + st.cls + '"><span class="material-symbols-rounded">' + st.icon + '</span> ' + st.label + '</span></div>' +
        '<div class="row-sub"><span><span class="material-symbols-rounded">calendar_today</span> ' + fmtDate(b.event_date) + ' (' + weekday(b.event_date) + ')</span>' + (b.event_type ? '<span><span class="material-symbols-rounded">celebration</span> ' + e(b.event_type) + '</span>' : '') + (b.location ? '<span><span class="material-symbols-rounded">location_on</span> ' + e(b.location) + '</span>' : '') + '</div>' +
        '<div class="row-sub">' + (b.requester_phone ? '<span><a href="tel:' + e(b.requester_phone) + '" style="color:var(--primary)"><span class="material-symbols-rounded">call</span> ' + e(b.requester_phone) + '</a></span>' : '') + (b.requester_phone ? '<span><a href="https://wa.me/' + waNumber(b.requester_phone) + '" target="_blank" style="color:var(--primary)"><span class="material-symbols-rounded">chat</span> WhatsApp</a></span>' : '') + (b.requester_email ? '<span><a href="mailto:' + e(b.requester_email) + '" style="color:var(--primary)"><span class="material-symbols-rounded">mail</span> ' + e(b.requester_email) + '</a></span>' : '') + '</div>' +
        (b.message ? '<div class="muted small" style="margin-top:6px;padding:8px 10px;background:var(--surface-sunken);border-radius:10px">' + e(b.message) + '</div>' : '') + '</div>' + actions + '</div>';
    }).join('') + '</div>';
    setView(dashNav('book') + '<div class="section-head"><h2><span class="material-symbols-rounded">event</span> Bookings</h2></div>' + list);
    syncTheme();
  }).catch(showError);
}
function bookAction(id, action) {
  if (action === 'delete' && !confirmBox('Delete this booking?')) return;
  api('/me/bookings/' + id, { method: 'POST', body: { action: action } }).then(function () { toast('Done'); viewBookings(); }).catch(function (err) { toast(err.message, true); });
}
function confirmBox(msg) { return window.confirm(msg); }

function viewSettings() {
  if (!state.user) return go('/login');
  setView(
    '<div class="section-head"><h2><span class="material-symbols-rounded">account_circle</span> Account</h2></div>' +
    '<section class="card card-pad" style="margin-bottom:16px"><div class="row-sub" style="font-size:1rem"><span><span class="material-symbols-rounded">person</span> ' + e(state.user.name) + '</span><span><span class="material-symbols-rounded">mail</span> ' + e(state.user.email) + '</span><span><span class="material-symbols-rounded">shield</span> ' + (state.user.role === 'admin' ? 'Administrator' : 'Music person') + '</span></div></section>' +
    '<section class="card card-pad" style="margin-bottom:16px"><div class="section-head" style="margin-bottom:10px"><h2 style="font-size:1.1rem"><span class="material-symbols-rounded">password</span> Change password</h2></div>' +
    '<div class="field"><label>Current password</label><input class="input" id="s-cur" type="password"></div>' +
    '<div class="fieldrow"><div class="field"><label>New</label><input class="input" id="s-new" type="password"></div><div class="field"><label>Confirm</label><input class="input" id="s-conf" type="password"></div></div>' +
    '<button class="btn btn-primary" onclick="changePass()"><span class="material-symbols-rounded">save</span> Change password</button></section>' +
    '<button class="btn btn-danger btn-block" onclick="logout()"><span class="material-symbols-rounded">logout</span> Log out</button>'
  );
  syncTheme();
}
function changePass() {
  if (val('s-new') !== val('s-conf')) return toast('The two passwords do not match.', true);
  api('/me/password', { method: 'POST', body: { current: val('s-cur'), next_password: val('s-new') } }).then(function () { toast('Password changed.'); go('/me/settings'); }).catch(function (err) { toast(err.message, true); });
}

function viewAdmin() {
  if (!state.user || state.user.role !== 'admin') return go('/');
  setLoading();
  api('/admin/people').then(function (d) {
    var list = d.people.map(function (p) {
      var cats = catObjs(p.categories);
      var badges = (p.featured ? '<span class="status is-booked"><span class="material-symbols-rounded">star</span> Featured</span>' : '') + (!p.active ? '<span class="status is-declined"><span class="material-symbols-rounded">visibility_off</span> Hidden</span>' : '') + (p.user_role === 'admin' ? '<span class="status is-accepted"><span class="material-symbols-rounded">shield</span> Admin</span>' : '');
      var canDelete = p.user_role !== 'admin' || d.adminCount > 1;
      return '<div class="row-card">' + avatar(p.display_name, p.photo, 48) + '<div class="row-main"><div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap"><span class="row-title">' + e(p.display_name) + '</span>' + badges + '</div><div class="row-sub"><span><span class="material-symbols-rounded">mail</span> ' + e(p.user_email) + '</span>' + cats.slice(0, 2).map(function (c) { return '<span><span class="material-symbols-rounded">' + c.icon + '</span> ' + c.label + '</span>'; }).join('') + '</div></div>' +
        '<div class="row-actions"><a href="#/p/' + p.id + '" class="btn btn-ghost btn-sm"><span class="material-symbols-rounded">visibility</span></a>' +
        '<button class="btn btn-ghost btn-sm" onclick="flagPerf(' + p.id + ',\'featured\')"><span class="material-symbols-rounded ' + (p.featured ? 'fill' : '') + '">star</span></button>' +
        '<button class="btn btn-ghost btn-sm" onclick="flagPerf(' + p.id + ',\'active\')"><span class="material-symbols-rounded">' + (p.active ? 'visibility' : 'visibility_off') + '</span></button>' +
        '<button class="btn btn-ghost btn-sm" onclick="resetPass(' + p.user_id + ',\'' + e(p.display_name).replace(/'/g, '') + '\')"><span class="material-symbols-rounded">key</span></button>' +
        (canDelete ? '<button class="btn btn-danger btn-sm" onclick="delUser(' + p.user_id + ',\'' + e(p.display_name).replace(/'/g, '') + '\')"><span class="material-symbols-rounded">delete</span></button>' : '') + '</div></div>';
    }).join('');
    setView(
      '<div class="section-head"><h2><span class="material-symbols-rounded">admin_panel_settings</span> Admin</h2><a href="#/admin/new" class="btn btn-primary btn-sm"><span class="material-symbols-rounded">person_add</span> New account</a></div>' +
      '<div class="stat-row" style="margin-bottom:20px"><div class="stat"><div class="ic ic-p"><span class="material-symbols-rounded">group</span></div><div><div class="num">' + d.stats.people + '</div><div class="lbl">People</div></div></div><div class="stat"><div class="ic ic-a"><span class="material-symbols-rounded">schedule</span></div><div><div class="num">' + d.stats.pending + '</div><div class="lbl">Pending</div></div></div><div class="stat"><div class="ic ic-s"><span class="material-symbols-rounded">event</span></div><div><div class="num">' + d.stats.bookings + '</div><div class="lbl">Bookings</div></div></div></div>' +
      '<a href="#/admin/bookings" class="btn btn-outline btn-block" style="margin-bottom:18px"><span class="material-symbols-rounded">event</span> All bookings</a>' +
      '<div class="list">' + list + '</div>'
    );
    syncTheme();
  }).catch(showError);
}
function flagPerf(id, field) { api('/admin/performer/' + id + '/flag', { method: 'POST', body: { field: field } }).then(function () { viewAdmin(); }).catch(function (err) { toast(err.message, true); }); }
function resetPass(uid, name) { var pw = prompt('New password for ' + name + ' (6+ chars):'); if (!pw) return; api('/admin/user/' + uid + '/password', { method: 'POST', body: { password: pw } }).then(function () { toast('Password set: ' + pw); }).catch(function (err) { toast(err.message, true); }); }
function delUser(uid, name) { if (!confirmBox('Delete the account for ' + name + '? This cannot be undone.')) return; api('/admin/user/' + uid, { method: 'DELETE' }).then(function () { toast('Account deleted.'); viewAdmin(); }).catch(function (err) { toast(err.message, true); }); }

function viewAdminNew() {
  if (!state.user || state.user.role !== 'admin') return go('/');
  var gen = Math.random().toString(16).slice(2, 12);
  var catSel = CATEGORIES.map(function (c) { return '<label><input type="checkbox" value="' + c.key + '"><span class="material-symbols-rounded">' + c.icon + '</span> ' + c.label + '</label>'; }).join('');
  setView(
    '<a href="#/admin" class="btn btn-ghost btn-sm back-btn" style="margin-bottom:12px"><span class="material-symbols-rounded">arrow_back</span> Back</a>' +
    '<div class="section-head"><h2><span class="material-symbols-rounded">person_add</span> New account</h2></div>' +
    '<section class="card card-pad"><div class="field"><label>Full name *</label><input class="input" id="n-name"></div>' +
    '<div class="field"><label>Email (to log in) *</label><input class="input" id="n-email" type="email"></div>' +
    '<div class="field"><label>Starting password *</label><input class="input" id="n-pass" value="' + gen + '"><div class="hint">Give this to the person; they can change it later.</div></div>' +
    '<div class="fieldrow"><div class="field"><label>Phone</label><input class="input" id="n-phone"></div><div class="field"><label>Location</label><input class="input" id="n-loc"></div></div>' +
    '<div class="field"><label>What do they do?</label><div class="cat-select" id="n-cats">' + catSel + '</div></div>' +
    '<div class="field"><label>Account type</label><select class="input" id="n-role"><option value="performer">Music person</option><option value="admin">Administrator</option></select></div>' +
    '<button class="btn btn-primary btn-block" onclick="createAccount()"><span class="material-symbols-rounded">check</span> Create account</button></section>'
  );
  syncTheme();
}
function createAccount() {
  var cats = []; document.querySelectorAll('#n-cats input:checked').forEach(function (i) { cats.push(i.value); });
  var body = { name: val('n-name'), email: val('n-email'), password: val('n-pass'), phone: val('n-phone'), location: val('n-loc'), categories: cats, role: val('n-role') };
  api('/admin/accounts', { method: 'POST', body: body }).then(function (d) { toast('Account created — ' + d.email + ' / ' + d.password); go('/admin'); }).catch(function (err) { toast(err.message, true); });
}

function viewAdminBookings() {
  if (!state.user || state.user.role !== 'admin') return go('/');
  setLoading();
  api('/admin/bookings').then(function (d) {
    var list;
    if (!d.bookings.length) list = '<div class="card card-pad empty"><span class="material-symbols-rounded">inbox</span><p>No bookings yet.</p></div>';
    else list = '<div class="list">' + d.bookings.map(function (b) {
      var st = BSTATUS[b.status];
      return '<div class="row-card"><div class="row-main"><div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap"><span class="row-title">' + e(b.requester_name) + '</span><span class="muted">→</span><a href="#/p/' + b.performer_id + '" style="color:var(--primary);font-weight:600">' + e(b.performer_name) + '</a><span class="status ' + st.cls + '"><span class="material-symbols-rounded">' + st.icon + '</span> ' + st.label + '</span></div>' +
        '<div class="row-sub"><span><span class="material-symbols-rounded">calendar_today</span> ' + fmtDate(b.event_date) + '</span>' + (b.event_type ? '<span><span class="material-symbols-rounded">celebration</span> ' + e(b.event_type) + '</span>' : '') + (b.requester_phone ? '<span><span class="material-symbols-rounded">call</span> ' + e(b.requester_phone) + '</span>' : '') + '</div></div></div>';
    }).join('') + '</div>';
    setView('<a href="#/admin" class="btn btn-ghost btn-sm back-btn" style="margin-bottom:12px"><span class="material-symbols-rounded">arrow_back</span> Back</a><div class="section-head"><h2><span class="material-symbols-rounded">event</span> All bookings</h2></div>' + list);
    syncTheme();
  }).catch(showError);
}

function showError(err) {
  if (err && err.status === 401) { state.user = null; state.token = null; try { localStorage.removeItem('md-token'); } catch (e) {} return go('/login'); }
  setView('<div class="card card-pad empty"><span class="material-symbols-rounded">cloud_off</span><h2 style="margin:8px 0">Can\'t connect</h2><p>' + e(err && err.message || 'Something went wrong') + '</p><button class="btn btn-primary" onclick="router()" style="margin-top:10px"><span class="material-symbols-rounded">refresh</span> Try again</button></div>');
  syncTheme();
}

/* ---------- router ---------- */
function router() {
  var h = parseHash();
  var m;
  if (h === '/' ) return viewDirectory();
  if ((m = h.match(/^\/p\/(\d+)$/))) return viewProfile(m[1]);
  if (h === '/login') return viewLogin();
  if (h === '/dashboard') return viewDashboard();
  if (h === '/me/profile') return viewMyProfile();
  if (h === '/me/availability') return viewAvailability();
  if (h === '/me/bookings') return viewBookings();
  if (h === '/me/settings') return viewSettings();
  if (h === '/admin') return viewAdmin();
  if (h === '/admin/new') return viewAdminNew();
  if (h === '/admin/bookings') return viewAdminBookings();
  viewDirectory();
}

window.addEventListener('hashchange', router);

/* ---------- boot ---------- */
(function boot() {
  appEl = document.getElementById('app');
  if (state.token) {
    api('/session').then(function (d) { state.user = d.user; if (!d.user) { state.token = null; try { localStorage.removeItem('md-token'); } catch (e) {} } router(); }).catch(function () { router(); });
  } else {
    router();
  }
})();
