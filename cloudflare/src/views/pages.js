import { escapeHtml as e, catObjects, colorFromString, initials, MONTHS, fmtDate, weekday } from '../lib/helpers.js';
import { CATEGORIES, CATEGORY_MAP } from '../lib/constants.js';
import { avatar } from './layout.js';

export function indexPage({ performers, q, cat, total }) {
  const chips = [`<a href="/${q ? '?q=' + encodeURIComponent(q) : ''}" class="chip ${!cat ? 'active' : ''}"><span class="material-symbols-rounded">apps</span> All</a>`]
    .concat(CATEGORIES.map((c) =>
      `<a href="/?cat=${c.key}${q ? '&q=' + encodeURIComponent(q) : ''}" class="chip ${cat === c.key ? 'active' : ''}"><span class="material-symbols-rounded">${c.icon}</span> ${c.label}</a>`
    )).join('');

  const headline = (cat && CATEGORY_MAP[cat]) ? CATEGORY_MAP[cat].label + 's' : 'All music people';

  let results;
  if (!performers.length) {
    results = `<div class="card card-pad empty"><span class="material-symbols-rounded">search_off</span><p>No music people were found.<br>Try a different search or category.</p></div>`;
  } else {
    results = `<div class="grid">` + performers.map((p) => {
      const cats = catObjects(p.categories);
      const h1 = colorFromString(p.display_name), h2 = (h1 + 40) % 360;
      const cover = p.photo
        ? `<img src="${e(p.photo)}" alt="${e(p.display_name)}" />`
        : `<span class="ph">${e(initials(p.display_name))}</span>`;
      const cTags = (cats.length ? cats.slice(0, 3) : [{ icon: 'music_note', label: 'Music' }])
        .map((c) => `<span class="tag"><span class="material-symbols-rounded">${c.icon}</span> ${c.label}</span>`).join('');
      const free = p.freeCount > 0
        ? `<span class="free-pill"><span class="material-symbols-rounded">event_available</span> ${p.freeCount} free day${p.freeCount === 1 ? '' : 's'}</span>`
        : `<span class="free-pill none"><span class="material-symbols-rounded">calendar_month</span> See calendar</span>`;
      return `<a href="/p/${p.id}" class="perf-card">
        <div class="perf-cover" style="background:linear-gradient(135deg,hsl(${h1},60%,58%),hsl(${h2},60%,48%))">${cover}
          ${p.featured ? `<span class="perf-featured"><span class="material-symbols-rounded fill">star</span> Featured</span>` : ''}</div>
        <div class="perf-body"><h3 class="perf-name">${e(p.display_name)}</h3><div class="perf-cats">${cTags}</div>
          ${p.location ? `<div class="perf-meta"><span class="material-symbols-rounded">location_on</span> ${e(p.location)}</div>` : ''}
          <div class="perf-foot">${free}<span class="btn btn-tonal btn-sm">Profile <span class="material-symbols-rounded">arrow_forward</span></span></div>
        </div></a>`;
    }).join('') + `</div>`;
  }

  return `<main class="page"><div class="container">
    <section class="hero">
      <span class="material-symbols-rounded hero-deco fill">graphic_eq</span>
      <div class="hero-note"><span class="material-symbols-rounded">verified</span> ${total} music people ready for you</div>
      <h1>Find the right music for your event</h1>
      <p>Singers, players, bands, cantors, entertainers and all music people — see when they are available, and book them right here in one place.</p>
      <div class="searchbar"><form action="/" method="get">
        <div class="search-field"><span class="material-symbols-rounded">search</span>
          <input type="text" name="q" value="${e(q)}" placeholder="Search a name, a category, or a location…" />
          ${cat ? `<input type="hidden" name="cat" value="${e(cat)}" />` : ''}</div>
        <button class="btn btn-accent" type="submit"><span class="material-symbols-rounded">search</span> Search</button>
      </form></div>
    </section>
    <section class="section-gap"><div class="chips">${chips}</div></section>
    <section class="section-gap">
      <div class="section-head"><h2><span class="material-symbols-rounded">library_music</span> ${headline}</h2>
        <div class="muted">${performers.length} result${performers.length === 1 ? '' : 's'}${q ? ' for "' + e(q) + '"' : ''}</div></div>
      ${results}
    </section>
  </div></main>`;
}

export function performerPage({ performer, days, today }) {
  const cats = catObjects(performer.categories);
  // group days into month blocks
  const blocks = [];
  let cur = null;
  for (const d of days) {
    if (!cur || cur.month !== d.month) { cur = { month: d.month, year: Number(d.iso.slice(0, 4)), lead: d.dow, days: [] }; blocks.push(cur); }
    cur.days.push(d);
  }
  const DOWS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const cals = blocks.map((b) => {
    let cells = DOWS.map((w) => `<div class="cal-dow">${w}</div>`).join('');
    for (let i = 0; i < b.lead; i++) cells += `<div class="cal-cell"></div>`;
    for (const d of b.days) {
      const st = d.info ? d.info.status : null;
      let day;
      if (st === 'available') day = `<div class="cal-day s-available" onclick="pickBookDate('${d.iso}')" title="Available — ready to book">${d.dom}</div>`;
      else if (st === 'booked') day = `<div class="cal-day s-booked" title="Booked">${d.dom}</div>`;
      else if (st === 'unavailable') day = `<div class="cal-day s-unavailable" title="Unavailable">${d.dom}</div>`;
      else day = `<div class="cal-day" onclick="pickBookDate('${d.iso}')">${d.dom}</div>`;
      cells += `<div class="cal-cell">${day}</div>`;
    }
    return `<div class="cal"><h3>${MONTHS[b.month]} ${b.year}</h3><div class="cal-grid">${cells}</div></div>`;
  }).join('');

  const catTags = (cats.length ? cats : [{ icon: 'music_note', label: 'Music' }])
    .map((c) => `<span class="tag"><span class="material-symbols-rounded">${c.icon}</span> ${c.label}</span>`).join('');

  const contact = [
    performer.phone ? `<a href="tel:${e(performer.phone)}"><span class="material-symbols-rounded">call</span> ${e(performer.phone)}</a>` : '',
    performer.public_email ? `<a href="mailto:${e(performer.public_email)}"><span class="material-symbols-rounded">mail</span> ${e(performer.public_email)}</a>` : '',
    performer.website ? `<a href="${e(performer.website)}" target="_blank" rel="noopener"><span class="material-symbols-rounded">language</span> Website</a>` : '',
  ].join('');
  const contactBlock = contact || `<div class="ci muted"><span class="material-symbols-rounded">info</span> Send a booking request below to get in touch.</div>`;

  return `<main class="page"><div class="container">
    <a href="/" class="btn btn-ghost btn-sm" style="margin-bottom:16px"><span class="material-symbols-rounded">arrow_back</span> Back to the directory</a>
    <section class="card card-pad"><div class="profile-head">
      ${avatar(performer.display_name, performer.photo, 120)}
      <div style="flex:1;min-width:240px"><h1>${e(performer.display_name)}</h1>
        <div class="perf-cats">${catTags}</div>
        <div style="display:flex;gap:18px;flex-wrap:wrap;margin-top:12px" class="muted">
          ${performer.location ? `<span style="display:inline-flex;gap:6px;align-items:center"><span class="material-symbols-rounded">location_on</span>${e(performer.location)}</span>` : ''}
          ${performer.price_from ? `<span style="display:inline-flex;gap:6px;align-items:center"><span class="material-symbols-rounded">payments</span>From ${e(performer.price_from)}</span>` : ''}
        </div></div>
      <a href="#book" class="btn btn-accent"><span class="material-symbols-rounded">event</span> Book now</a>
    </div></section>
    <div class="two-col section-gap"><div>
      ${performer.bio ? `<section class="card card-pad"><div class="section-head" style="margin-bottom:10px"><h2 style="font-size:1.2rem"><span class="material-symbols-rounded">info</span> About</h2></div><p style="margin:0;white-space:pre-line">${e(performer.bio)}</p></section>` : ''}
      <section class="card card-pad section-gap">
        <div class="section-head" style="margin-bottom:10px"><h2 style="font-size:1.2rem"><span class="material-symbols-rounded">calendar_month</span> Availability</h2></div>
        <div class="legend" style="margin-bottom:16px">
          <span><span class="sw" style="background:var(--success-bg)"></span> Available</span>
          <span><span class="sw" style="background:var(--info-bg)"></span> Booked</span>
          <span><span class="sw" style="background:var(--danger-bg)"></span> Unavailable</span></div>
        <div class="cal-wrap">${cals}</div>
        <p class="hint muted small" style="margin-top:14px"><span class="material-symbols-rounded" style="font-size:16px;vertical-align:-3px">touch_app</span> Click a green day to add it to your booking request.</p>
      </section>
    </div>
    <aside>
      <section class="card card-pad"><div class="section-head" style="margin-bottom:10px"><h2 style="font-size:1.2rem"><span class="material-symbols-rounded">contacts</span> Get in touch</h2></div>
        <div class="contact-list">${contactBlock}</div></section>
      <section class="card card-pad section-gap" id="book"><div class="section-head" style="margin-bottom:10px"><h2 style="font-size:1.2rem"><span class="material-symbols-rounded">event</span> Book / Request</h2></div>
        <form action="/p/${performer.id}/book" method="post">
          <div class="field"><label>Your name *</label><input class="input" type="text" name="requester_name" required /></div>
          <div class="form-grid"><div class="field"><label>Phone</label><input class="input" type="tel" name="requester_phone" /></div>
            <div class="field"><label>Email</label><input class="input" type="email" name="requester_email" /></div></div>
          <div class="form-grid"><div class="field"><label>Event date *</label><input class="input" type="date" id="event_date" name="event_date" min="${today}" required /></div>
            <div class="field"><label>Event type</label><input class="input" type="text" name="event_type" placeholder="Wedding, party…" /></div></div>
          <div class="field"><label>Location</label><input class="input" type="text" name="location" placeholder="Venue / city" /></div>
          <div class="field"><label>A note</label><textarea class="textarea" name="message" placeholder="Tell them what you need…"></textarea></div>
          <button class="btn btn-accent btn-block" type="submit"><span class="material-symbols-rounded">send</span> Send request</button>
          <p class="hint muted small" style="margin-top:10px">You must provide a name, a date, and a phone or email.</p>
        </form></section>
    </aside></div>
  </div></main>`;
}

export function loginPage({ next }) {
  return `<main class="auth-wrap"><div class="auth-card card card-pad">
    <div class="auth-logo"><span class="material-symbols-rounded fill">music_note</span></div>
    <h1 style="text-align:center;margin:0 0 6px;font-size:1.6rem">Log in</h1>
    <p class="muted" style="text-align:center;margin:0 0 20px">Access your profile, calendar and bookings</p>
    <form action="/auth/login" method="post">
      ${next ? `<input type="hidden" name="next" value="${e(next)}" />` : ''}
      <div class="field"><label>Email</label><input class="input" type="email" name="email" required autofocus placeholder="name@example.com" /></div>
      <div class="field"><label>Password</label><input class="input" type="password" name="password" required /></div>
      <button class="btn btn-primary btn-block" type="submit"><span class="material-symbols-rounded">login</span> Sign in</button>
    </form>
    <div class="divider"></div>
    <p class="muted small" style="text-align:center;margin:0"><span class="material-symbols-rounded" style="font-size:16px;vertical-align:-3px">info</span> Don't have an account yet? An administrator will open one for you.</p>
  </div></main>`;
}

export function errorPage({ code, message }) {
  const icon = code === 404 ? 'search_off' : (code === 403 ? 'lock' : 'error');
  return `<main class="page"><div class="container"><div class="card card-pad empty" style="max-width:520px;margin-inline:auto">
    <span class="material-symbols-rounded" style="font-size:72px">${icon}</span>
    <h1 style="margin:10px 0 6px;font-size:2rem">${code}</h1><p>${e(message)}</p>
    <a href="/" class="btn btn-primary" style="margin-top:12px"><span class="material-symbols-rounded">home</span> Back home</a>
  </div></div></main>`;
}
