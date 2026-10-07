import { escapeHtml as e, catObjects, initials, MONTHS, fmtDate, weekday, youtubeId } from '../lib/helpers.js';
import { CATEGORIES, CATEGORY_MAP } from '../lib/constants.js';
import { avatar } from './layout.js';

export function indexPage({ performers, q, cat, total, date = '', sort = 'featured' }) {
  const qs = (ov) => {
    const o = Object.assign({ q, cat, date, sort }, ov);
    const parts = [];
    if (o.q) parts.push('q=' + encodeURIComponent(o.q));
    if (o.cat) parts.push('cat=' + encodeURIComponent(o.cat));
    if (o.date) parts.push('date=' + encodeURIComponent(o.date));
    if (o.sort && o.sort !== 'featured') parts.push('sort=' + encodeURIComponent(o.sort));
    return parts.length ? '/?' + parts.join('&') : '/';
  };
  const chips = [`<a href="${qs({ cat: '' })}" class="chip ${!cat ? 'active' : ''}"><span class="material-symbols-rounded">apps</span> All</a>`]
    .concat(CATEGORIES.map((c) =>
      `<a href="${qs({ cat: c.key })}" class="chip ${cat === c.key ? 'active' : ''}"><span class="material-symbols-rounded">${c.icon}</span> ${c.label}</a>`
    )).join('');

  const hasFilters = !!(date || sort !== 'featured');
  const filterbar = `<section class="section-gap"><form action="/" method="get" class="filterbar">
    ${q ? `<input type="hidden" name="q" value="${e(q)}" />` : ''}
    ${cat ? `<input type="hidden" name="cat" value="${e(cat)}" />` : ''}
    <label class="filter-field"><span class="material-symbols-rounded">event</span>
      <span class="filter-cap">Free on</span><input type="date" name="date" value="${e(date)}" onchange="this.form.submit()" /></label>
    <label class="filter-field"><span class="material-symbols-rounded">sort</span>
      <select name="sort" onchange="this.form.submit()">
        <option value="featured"${sort === 'featured' ? ' selected' : ''}>Featured first</option>
        <option value="available"${sort === 'available' ? ' selected' : ''}>Most availability</option>
        <option value="new"${sort === 'new' ? ' selected' : ''}>Newest</option>
        <option value="name"${sort === 'name' ? ' selected' : ''}>Name (A–Z)</option></select></label>
    <noscript><button class="btn btn-tonal btn-sm" type="submit">Apply</button></noscript>
    ${hasFilters ? `<a href="${qs({ date: '', sort: 'featured' })}" class="btn btn-ghost btn-sm"><span class="material-symbols-rounded">close</span> Clear</a>` : ''}
  </form></section>`;

  const headline = (cat && CATEGORY_MAP[cat]) ? CATEGORY_MAP[cat].label + 's' : 'All music people';

  let results;
  if (!performers.length) {
    results = `<div class="card card-pad empty"><span class="material-symbols-rounded">search_off</span><p>No music people were found.<br>Try a different search or category.</p></div>`;
  } else {
    results = `<div class="grid">` + performers.map((p) => {
      const cats = catObjects(p.categories);
      const cover = p.photo
        ? `<img src="${e(p.photo)}" alt="${e(p.display_name)}" />`
        : `<span class="ph">${e(initials(p.display_name))}</span>`;
      const cTags = (cats.length ? cats.slice(0, 3) : [{ icon: 'music_note', label: 'Music' }])
        .map((c) => `<span class="tag"><span class="material-symbols-rounded">${c.icon}</span> ${c.label}</span>`).join('');
      const free = p.freeCount > 0
        ? `<span class="free-pill"><span class="material-symbols-rounded">event_available</span> ${p.freeCount} day${p.freeCount === 1 ? '' : 's'} open</span>`
        : `<span class="free-pill none"><span class="material-symbols-rounded">calendar_month</span> See calendar</span>`;
      return `<a href="/p/${p.id}" class="perf-card">
        <div class="perf-cover">${cover}
          <button class="fav-btn" data-fav="${p.id}" onclick="toggleFav(event, ${p.id})" title="Save" aria-label="Save"><span class="material-symbols-rounded">favorite</span></button>
          ${p.featured ? `<span class="perf-featured"><span class="material-symbols-rounded fill">star</span> Featured</span>` : ''}</div>
        <div class="perf-body"><h3 class="perf-name">${e(p.display_name)}</h3><div class="perf-cats">${cTags}</div>
          ${p.location ? `<div class="perf-meta"><span class="material-symbols-rounded">location_on</span> ${e(p.location)}</div>` : ''}
          <div class="perf-foot">${free}<span class="btn btn-tonal btn-sm">View <span class="material-symbols-rounded">arrow_forward</span></span></div>
        </div></a>`;
    }).join('') + `</div>`;
  }

  return `<main class="page"><div class="container">
    <section class="hero">
      <div class="hero-note"><span class="material-symbols-rounded">verified</span> ${total} artists on the directory</div>
      <h1>Book the right music for your simcha.</h1>
      <p>Singers, bands, musicians, cantors and entertainers — browse profiles, check who's free on your date, and send a booking request in one place.</p>
      <div class="searchbar"><form action="/" method="get">
        <div class="search-field"><span class="material-symbols-rounded">search</span>
          <input type="text" name="q" value="${e(q)}" placeholder="Search by name, category or city…" />
          ${cat ? `<input type="hidden" name="cat" value="${e(cat)}" />` : ''}
          ${date ? `<input type="hidden" name="date" value="${e(date)}" />` : ''}
          ${sort !== 'featured' ? `<input type="hidden" name="sort" value="${e(sort)}" />` : ''}</div>
        <button class="btn btn-primary" type="submit"><span class="material-symbols-rounded">search</span> Search</button>
      </form></div>
    </section>
    <section class="section-gap"><div class="chips">${chips}</div></section>
    ${filterbar}
    <section class="section-gap">
      <div class="section-head"><h2><span class="material-symbols-rounded">library_music</span> ${headline}</h2>
        <div class="muted">${performers.length} result${performers.length === 1 ? '' : 's'}${q ? ' for "' + e(q) + '"' : ''}${date ? ' · free on ' + e(fmtDate(date)) : ''}</div></div>
      ${results}
    </section>
  </div>
  <section class="band section-gap"><div class="container" style="padding-block:48px">
    <div class="overline">How it works</div>
    <div class="section-head" style="margin-top:8px"><h2>Book in three simple steps</h2></div>
    <div class="steps">
      <div class="step"><div class="n"><span class="material-symbols-rounded">search</span></div>
        <h3>1 · Find an artist</h3><p>Browse by category — singers, bands, musicians, cantors and more — or search by name and city.</p></div>
      <div class="step"><div class="n"><span class="material-symbols-rounded">event_available</span></div>
        <h3>2 · Check the date</h3><p>Each profile shows a live calendar, so you can see exactly which days are open before you reach out.</p></div>
      <div class="step"><div class="n"><span class="material-symbols-rounded">send</span></div>
        <h3>3 · Send a request</h3><p>Send a booking request with your event details, or contact the artist directly by phone or WhatsApp.</p></div>
    </div>
  </div></section>
  </main>`;
}

export function performerPage({ performer, days, today, reviews = [], ratingAvg = 0, ratingCount = 0 }) {
  const cats = catObjects(performer.categories);
  const splitList = (v) => String(v || '').split(',').map((x) => x.trim()).filter(Boolean);
  const genres = splitList(performer.genres);
  const languages = splitList(performer.languages);
  const ytId = youtubeId(performer.youtube_url);
  const gallery = String(performer.gallery || '').split(/[\r\n,]+/).map((x) => x.trim()).filter((x) => /^https?:\/\//i.test(x));
  const priceText = performer.price_from && performer.price_to
    ? `${performer.price_from} – ${performer.price_to}`
    : (performer.price_from || performer.price_to || '');
  const stars = (n) => { let o = ''; for (let i = 1; i <= 5; i++) o += `<span class="material-symbols-rounded${i <= Math.round(n) ? ' fill' : ''}">star</span>`; return o; };
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

  // WhatsApp link derived from the phone number (US numbers get a leading 1).
  const waDigits = (performer.phone || '').replace(/\D/g, '');
  const wa = waDigits ? (waDigits.length === 10 ? '1' + waDigits : waDigits) : '';
  const contact = [
    performer.phone ? `<a href="tel:${e(performer.phone)}"><span class="material-symbols-rounded">call</span> ${e(performer.phone)}</a>` : '',
    wa ? `<a href="https://wa.me/${wa}" target="_blank" rel="noopener"><span class="material-symbols-rounded">chat</span> WhatsApp</a>` : '',
    performer.public_email ? `<a href="mailto:${e(performer.public_email)}"><span class="material-symbols-rounded">mail</span> ${e(performer.public_email)}</a>` : '',
    performer.website ? `<a href="${e(performer.website)}" target="_blank" rel="noopener"><span class="material-symbols-rounded">language</span> Website</a>` : '',
    performer.instagram_url ? `<a href="${e(performer.instagram_url)}" target="_blank" rel="noopener"><span class="material-symbols-rounded">photo_camera</span> Instagram</a>` : '',
  ].join('');
  const contactBlock = contact || `<div class="ci muted"><span class="material-symbols-rounded">info</span> Send a booking request below to get in touch.</div>`;

  return `<main class="page"><div class="container">
    <a href="/" class="btn btn-ghost btn-sm" style="margin-bottom:16px"><span class="material-symbols-rounded">arrow_back</span> Back to the directory</a>
    <section class="card card-pad"><div class="profile-head">
      ${avatar(performer.display_name, performer.photo, 120)}
      <div style="flex:1;min-width:240px"><h1>${e(performer.display_name)}</h1>
        <div class="perf-cats">${catTags}</div>
        ${(genres.length || languages.length) ? `<div class="perf-cats" style="margin-top:8px">
          ${genres.map((g) => `<span class="tag"><span class="material-symbols-rounded">music_note</span> ${e(g)}</span>`).join('')}
          ${languages.map((l) => `<span class="tag"><span class="material-symbols-rounded">translate</span> ${e(l)}</span>`).join('')}
        </div>` : ''}
        <div style="display:flex;gap:18px;flex-wrap:wrap;margin-top:12px" class="muted">
          ${ratingCount ? `<span class="rating-inline" title="${ratingAvg} out of 5">${stars(ratingAvg)} <strong style="color:var(--on-surface);margin-inline-start:4px">${ratingAvg}</strong> (${ratingCount})</span>` : ''}
          ${performer.location ? `<span style="display:inline-flex;gap:6px;align-items:center"><span class="material-symbols-rounded">location_on</span>${e(performer.location)}</span>` : ''}
          ${priceText ? `<span style="display:inline-flex;gap:6px;align-items:center"><span class="material-symbols-rounded">payments</span>${e(priceText)}</span>` : ''}
          ${performer.experience ? `<span style="display:inline-flex;gap:6px;align-items:center"><span class="material-symbols-rounded">workspace_premium</span>${e(performer.experience)} yrs experience</span>` : ''}
        </div></div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <a href="#book" class="btn btn-accent"><span class="material-symbols-rounded">event</span> Book now</a>
        <button type="button" class="fav-btn fav-btn-inline" data-fav="${performer.id}" onclick="toggleFav(event, ${performer.id})"><span class="material-symbols-rounded">favorite</span> <span class="fav-label">Save</span></button>
        <button type="button" class="btn btn-outline" onclick="shareProfile()"><span class="material-symbols-rounded">share</span> Share</button>
      </div>
    </div></section>
    <div class="two-col section-gap"><div>
      ${performer.bio ? `<section class="card card-pad"><div class="section-head" style="margin-bottom:10px"><h2 style="font-size:1.2rem"><span class="material-symbols-rounded">info</span> About</h2></div><p style="margin:0;white-space:pre-line">${e(performer.bio)}</p></section>` : ''}
      ${(ytId || gallery.length) ? `<section class="card card-pad section-gap"><div class="section-head" style="margin-bottom:14px"><h2 style="font-size:1.2rem"><span class="material-symbols-rounded">play_circle</span> Media</h2></div>
        ${ytId ? `<div class="video-embed"><iframe src="https://www.youtube-nocookie.com/embed/${e(ytId)}" title="Video" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>` : ''}
        ${gallery.length ? `<div class="gallery"${ytId ? ' style="margin-top:16px"' : ''}>${gallery.map((g) => `<a href="${e(g)}" target="_blank" rel="noopener" class="gallery-item"><img src="${e(g)}" loading="lazy" alt="Photo of ${e(performer.display_name)}" /></a>`).join('')}</div>` : ''}
      </section>` : ''}
      <section class="card card-pad section-gap">
        <div class="section-head" style="margin-bottom:10px"><h2 style="font-size:1.2rem"><span class="material-symbols-rounded">calendar_month</span> Availability</h2></div>
        <div class="legend" style="margin-bottom:16px">
          <span><span class="sw" style="background:var(--success-bg)"></span> Available</span>
          <span><span class="sw" style="background:var(--info-bg)"></span> Booked</span>
          <span><span class="sw" style="background:var(--danger-bg)"></span> Unavailable</span></div>
        <div class="cal-wrap">${cals}</div>
        <p class="hint muted small" style="margin-top:14px"><span class="material-symbols-rounded" style="font-size:16px;vertical-align:-3px">touch_app</span> Click a green day to add it to your booking request.</p>
      </section>
      <section class="card card-pad section-gap">
        <div class="section-head" style="margin-bottom:14px"><h2 style="font-size:1.2rem"><span class="material-symbols-rounded">reviews</span> Reviews</h2>
          ${ratingCount ? `<span class="rating-inline">${stars(ratingAvg)} <strong style="color:var(--on-surface)">${ratingAvg}</strong> · ${ratingCount} review${ratingCount === 1 ? '' : 's'}</span>` : ''}</div>
        ${reviews.length ? `<div class="list">${reviews.map((r) => `<div class="review"><div style="display:flex;align-items:center;justify-content:space-between;gap:10px"><strong>${e(r.author_name)}</strong><span class="rating-inline sm">${stars(r.rating)}</span></div>${r.comment ? `<p class="muted" style="margin:6px 0 0;white-space:pre-line">${e(r.comment)}</p>` : ''}<div class="small muted" style="margin-top:4px">${fmtDate((r.created_at || '').slice(0, 10))}</div></div>`).join('')}</div>` : `<p class="muted small" style="margin:0 0 4px">No reviews yet — be the first to leave one.</p>`}
        <details style="margin-top:16px"><summary style="cursor:pointer;font-weight:700"><span class="material-symbols-rounded" style="vertical-align:-5px;color:var(--accent-ink)">rate_review</span> Leave a review</summary>
          <form action="/p/${performer.id}/review" method="post" style="margin-top:14px">
            <div class="form-grid"><div class="field"><label>Your name *</label><input class="input" name="author_name" required /></div>
              <div class="field"><label>Rating</label><select class="input" name="rating">
                <option value="5">★★★★★ — Excellent</option><option value="4">★★★★ — Very good</option><option value="3">★★★ — Good</option><option value="2">★★ — Fair</option><option value="1">★ — Poor</option></select></div></div>
            <div class="field"><label>Your review</label><textarea class="textarea" name="comment" placeholder="How was it working with them?"></textarea></div>
            <button class="btn btn-primary" type="submit"><span class="material-symbols-rounded">send</span> Submit review</button>
            <p class="hint muted small" style="margin-top:8px">Reviews are shown after a quick check.</p>
          </form></details>
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

const INFO = {
  about: {
    title: 'About', icon: 'info',
    html: `
      <p>Music Directory is one place to find and book the music people who make a simcha special — singers, bands, musicians, cantors, choirs, DJs, entertainers and more.</p>
      <h2>For people booking</h2>
      <p>Browse by category, search by name or city, and see each artist's live calendar so you know who's available on your date before you reach out. Send a booking request or contact the artist directly by phone or WhatsApp — it's completely free to use.</p>
      <h2>For artists</h2>
      <p>Every artist gets their own profile with a photo, a description, genres, media and a calendar they manage themselves. Keep your availability up to date so people can find you and book you. Accounts are opened by an administrator — <a href="/contact" style="color:var(--accent-ink);font-weight:700">get in touch</a> to be listed.</p>
      <h2>How booking works</h2>
      <p>Find an artist → check their open dates → send a request with your event details. The artist replies and confirms. Simple.</p>`,
  },
  terms: {
    title: 'Terms of Use', icon: 'gavel',
    html: `
      <p class="muted small">Last updated: ${fmtDate(new Date().toISOString().slice(0, 10))}</p>
      <p>Music Directory is a listing service that helps people discover and contact music artists. By using the site you agree to the following.</p>
      <h2>The service</h2>
      <p>We provide the directory and booking-request tool. Any booking, price, agreement or payment is strictly between you and the artist. We are not a party to those arrangements and do not guarantee any booking, performance, price or outcome.</p>
      <h2>Your content</h2>
      <p>Artists are responsible for the accuracy of their own profiles. Reviews and messages must be honest and respectful. We may remove any content that is false, abusive or inappropriate.</p>
      <h2>Acceptable use</h2>
      <p>Don't misuse the site, submit false information, spam artists, or use the contact details for anything other than a genuine booking enquiry.</p>
      <h2>No warranty</h2>
      <p>The service is provided "as is". We do our best to keep it running and accurate, but we can't guarantee it will be error-free or always available.</p>`,
  },
  privacy: {
    title: 'Privacy', icon: 'shield',
    html: `
      <p class="muted small">Last updated: ${fmtDate(new Date().toISOString().slice(0, 10))}</p>
      <p>We keep data collection to the minimum needed to run the directory.</p>
      <h2>What we store</h2>
      <p><strong>Artist profiles:</strong> the details an artist chooses to publish (name, categories, description, contact, media, availability). Artists control and can change these at any time.</p>
      <p><strong>Booking requests &amp; messages:</strong> the name and contact details you enter, so the artist (or the admin) can reply.</p>
      <p><strong>Login:</strong> a secure session cookie so artists stay logged in. Passwords are stored only as a salted hash — never in plain text.</p>
      <h2>What we don't do</h2>
      <p>We don't sell your data, and we don't send marketing. Contact details on a public profile are there because the artist chose to publish them.</p>
      <h2>Your choices</h2>
      <p>Artists can edit or hide their profile anytime. To have your information removed, <a href="/contact" style="color:var(--accent-ink);font-weight:700">contact us</a>.</p>`,
  },
};

export function infoPage(kind) {
  const d = INFO[kind] || INFO.about;
  return `<main class="page"><div class="container" style="max-width:740px">
    <div class="section-head"><h2><span class="material-symbols-rounded">${d.icon}</span> ${e(d.title)}</h2></div>
    <section class="card card-pad prose">${d.html}</section>
  </div></main>`;
}

export function contactPage() {
  return `<main class="page"><div class="container" style="max-width:640px">
    <div class="section-head"><h2><span class="material-symbols-rounded">mail</span> Contact us</h2></div>
    <p class="muted" style="margin:-8px 0 20px">Questions, or want to be listed as an artist? Send a message and we'll get back to you.</p>
    <section class="card card-pad"><form action="/contact" method="post">
      <div class="form-grid"><div class="field"><label>Your name *</label><input class="input" type="text" name="name" required /></div>
        <div class="field"><label>Phone</label><input class="input" type="tel" name="phone" /></div></div>
      <div class="form-grid"><div class="field"><label>Email</label><input class="input" type="email" name="email" /></div>
        <div class="field"><label>Subject</label><input class="input" type="text" name="subject" placeholder="e.g. List me as an artist" /></div></div>
      <div class="field"><label>Message *</label><textarea class="textarea" name="body" required placeholder="How can we help?"></textarea></div>
      <button class="btn btn-primary" type="submit"><span class="material-symbols-rounded">send</span> Send message</button>
    </form></section>
  </div></main>`;
}

export function savedPage() {
  return `<main class="page"><div class="container">
    <div class="section-head"><h2><span class="material-symbols-rounded">favorite</span> Saved artists</h2>
      <a href="/" class="btn btn-ghost btn-sm"><span class="material-symbols-rounded">search</span> Browse all</a></div>
    <div id="savedGrid"><div class="loading-saved muted" style="padding:20px 0">Loading…</div></div>
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
