import { escapeHtml as e, fmtDate, weekday, MONTHS } from '../lib/helpers.js';
import { CATEGORIES, BOOKING_STATUS } from '../lib/constants.js';
import { avatar } from './layout.js';

function dashnav(active, pendingBadge, user) {
  const item = (href, key, icon, label, badge) =>
    `<a href="${href}" class="${active === key ? 'active' : ''}"><span class="material-symbols-rounded">${icon}</span> ${label}${badge ? `<span class="badge">${badge}</span>` : ''}</a>`;
  let out = `<nav class="side">`;
  out += item('/dashboard', 'home', 'dashboard', 'Overview');
  out += item('/dashboard/profile', 'profile', 'badge', 'My Profile');
  out += item('/dashboard/availability', 'availability', 'calendar_month', 'Availability');
  out += item('/dashboard/bookings', 'bookings', 'event', 'Bookings', pendingBadge > 0 ? pendingBadge : 0);
  out += item('/dashboard/settings', 'settings', 'settings', 'Settings');
  if (user && user.role === 'admin') {
    out += `<div class="divider" style="margin:10px 6px"></div>` + item('/admin', 'admin', 'admin_panel_settings', 'Admin Panel');
  }
  return out + `</nav>`;
}

export function dashHome({ performer, stats, upcoming, pendingBadge, user }) {
  let up;
  if (!upcoming.length) {
    up = `<div class="card card-pad empty"><span class="material-symbols-rounded">event_note</span><p>No upcoming bookings yet.</p></div>`;
  } else {
    up = `<div class="list">` + upcoming.map((b) => {
      const st = BOOKING_STATUS[b.status];
      return `<div class="row-card"><div class="row-main">
        <div class="row-title">${e(b.requester_name)}${b.event_type ? ` · <span class="muted" style="font-weight:500">${e(b.event_type)}</span>` : ''}</div>
        <div class="row-sub"><span><span class="material-symbols-rounded">calendar_today</span> ${fmtDate(b.event_date)} (${weekday(b.event_date)})</span>
          ${b.location ? `<span><span class="material-symbols-rounded">location_on</span> ${e(b.location)}</span>` : ''}</div></div>
        <span class="status ${st.cls}"><span class="material-symbols-rounded">${st.icon}</span> ${st.label}</span></div>`;
    }).join('') + `</div>`;
  }
  const body = `<div>
    <div class="section-head"><h2><span class="material-symbols-rounded">waving_hand</span> Hi, ${e(performer.display_name)}</h2>
      <a href="/p/${performer.id}" class="btn btn-outline btn-sm"><span class="material-symbols-rounded">visibility</span> View my public profile</a></div>
    <div class="stat-row">
      <div class="stat"><div class="ic ic-a"><span class="material-symbols-rounded">schedule</span></div><div><div class="num">${stats.pending}</div><div class="lbl">Pending bookings</div></div></div>
      <div class="stat"><div class="ic ic-s"><span class="material-symbols-rounded">check_circle</span></div><div><div class="num">${stats.accepted}</div><div class="lbl">Confirmed bookings</div></div></div>
      <div class="stat"><div class="ic ic-p"><span class="material-symbols-rounded">event_available</span></div><div><div class="num">${stats.free}</div><div class="lbl">Free days ahead</div></div></div></div>
    <section class="section-gap"><div class="section-head" style="margin-bottom:12px"><h2 style="font-size:1.25rem"><span class="material-symbols-rounded">upcoming</span> Upcoming bookings</h2>
      <a href="/dashboard/bookings" class="btn btn-ghost btn-sm">All <span class="material-symbols-rounded">arrow_forward</span></a></div>${up}</section>
    <section class="section-gap"><div class="card card-pad"><div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap">
      <span class="material-symbols-rounded" style="font-size:40px;color:var(--primary)">tips_and_updates</span>
      <div style="flex:1;min-width:200px"><strong>Complete your profile</strong><div class="muted small">Add a photo, a description and your categories — this helps people find you more easily.</div></div>
      <a href="/dashboard/profile" class="btn btn-tonal"><span class="material-symbols-rounded">edit</span> Edit profile</a></div></div></section>
  </div>`;
  return `<main class="page"><div class="container"><div class="dash">${dashnav('home', pendingBadge, user)}${body}</div></div></main>`;
}

export function dashProfile({ performer, pendingBadge, user, hasR2 }) {
  const myCats = performer.categories ? performer.categories.split(',') : [];
  const catSelect = CATEGORIES.map((c) =>
    `<label><input type="checkbox" name="categories" value="${c.key}" ${myCats.indexOf(c.key) !== -1 ? 'checked' : ''} /><span class="material-symbols-rounded">${c.icon}</span> ${c.label}</label>`
  ).join('');
  const photoUrlVal = (performer.photo && performer.photo.indexOf('/uploads/') !== 0) ? performer.photo : '';
  const photoField = hasR2
    ? `<div class="field" style="margin-bottom:10px"><label>Upload a photo</label>
         <input class="input" type="file" name="photo_file" accept="image/*" /><div class="hint">Or paste a link to an image:</div></div>
       <input class="input" type="url" name="photo_url" placeholder="https://…" value="${e(photoUrlVal)}" />`
    : `<div class="field" style="margin-bottom:0"><label>Photo link</label>
         <input class="input" type="url" name="photo_url" placeholder="https://…" value="${e(photoUrlVal)}" />
         <div class="hint">Paste a link to an image. (Uploading a photo file will be enabled once storage is set up.)</div></div>`;
  const body = `<div>
    <div class="section-head"><h2><span class="material-symbols-rounded">badge</span> My Profile</h2></div>
    <form action="/dashboard/profile" method="post" enctype="multipart/form-data">
      <section class="card card-pad"><div style="display:flex;gap:20px;align-items:center;flex-wrap:wrap;margin-bottom:8px">
        ${avatar(performer.display_name, performer.photo, 88)}
        <div style="flex:1;min-width:220px">${photoField}</div></div></section>
      <section class="card card-pad section-gap">
        <div class="field" style="background:var(--surface-sunken);padding:14px 16px;border-radius:var(--radius-md);margin-bottom:22px">
          <label style="display:flex;align-items:center;gap:10px;cursor:pointer;margin:0">
            <input type="checkbox" name="visible" value="1" ${performer.active ? 'checked' : ''} style="width:20px;height:20px;accent-color:var(--primary)" />
            <span class="material-symbols-rounded" style="color:var(--primary)">public</span> Show me in the public directory (people can see and book me)</label></div>
        <div class="field"><label>Name (as people see you) *</label><input class="input" type="text" name="display_name" value="${e(performer.display_name)}" required /></div>
        <div class="field"><label>What do you do? (you can pick more than one)</label><div class="cat-select">${catSelect}</div></div>
        <div class="field"><label>A description about you</label><textarea class="textarea" name="bio" placeholder="Tell people about yourself, your style, your experience…">${e(performer.bio)}</textarea></div>
        <div class="form-grid"><div class="field"><label>Phone</label><input class="input" type="tel" name="phone" value="${e(performer.phone)}" /></div>
          <div class="field"><label>Public email</label><input class="input" type="email" name="public_email" value="${e(performer.public_email)}" /></div></div>
        <div class="form-grid"><div class="field"><label>Website</label><input class="input" type="url" name="website" value="${e(performer.website)}" placeholder="https://…" /></div>
          <div class="field"><label>Location / area</label><input class="input" type="text" name="location" value="${e(performer.location)}" placeholder="Brooklyn, Monsey…" /></div></div>
        <div class="form-grid"><div class="field"><label>Price from (optional)</label><input class="input" type="text" name="price_from" value="${e(performer.price_from)}" placeholder="$500" /></div>
          <div class="field"><label>Price to (optional)</label><input class="input" type="text" name="price_to" value="${e(performer.price_to || '')}" placeholder="$1,500" /></div></div>
        <div class="field"><label>Styles / genres</label><input class="input" type="text" name="genres" value="${e(performer.genres || '')}" placeholder="Chassidish, Classic, Freilach…" /><div class="hint">Separate with commas.</div></div>
        <div class="field"><label>Years of experience</label><input class="input" type="text" name="experience" value="${e(performer.experience || '')}" placeholder="15" /></div>
        <div class="divider"></div>
        <div class="field" style="margin-bottom:6px"><label><span class="material-symbols-rounded" style="font-size:18px;vertical-align:-4px;color:var(--accent-ink)">link</span> Media &amp; links</label>
          <div class="hint">No uploads needed — just paste links.</div></div>
        <div class="form-grid"><div class="field"><label>YouTube video</label><input class="input" type="url" name="youtube_url" value="${e(performer.youtube_url || '')}" placeholder="https://youtube.com/watch?v=…" /></div>
          <div class="field"><label>Instagram</label><input class="input" type="url" name="instagram_url" value="${e(performer.instagram_url || '')}" placeholder="https://instagram.com/…" /></div></div>
        <div class="field"><label>Photo gallery (links)</label><textarea class="textarea" name="gallery" placeholder="One image link per line">${e(performer.gallery || '')}</textarea><div class="hint">Paste one image link per line — they show as a gallery on your profile.</div></div>
        <button class="btn btn-primary" type="submit"><span class="material-symbols-rounded">save</span> Save</button>
      </section>
    </form></div>`;
  return `<main class="page"><div class="container"><div class="dash">${dashnav('profile', pendingBadge, user)}${body}</div></div></main>`;
}

export function dashAvailability({ performer, months, pendingBadge, user }) {
  const DOWS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const cals = months.map((m) => {
    const lead = new Date(Date.UTC(m.year, m.month, 1)).getUTCDay();
    let cells = DOWS.map((w) => `<div class="cal-dow">${w}</div>`).join('');
    for (const cell of m.cells) {
      if (!cell) { cells += `<div class="cal-cell"></div>`; continue; }
      const st = cell.info ? cell.info.status : null;
      const note = cell.info ? (cell.info.note || '') : '';
      const cls = st ? 's-' + st : '';
      const onclick = cell.past ? '' : `onclick="openDay('${cell.iso}','${st || ''}','${note.replace(/'/g, "\\'").replace(/"/g, '')}')"`;
      cells += `<div class="cal-cell"><div class="cal-day ${cls} ${cell.past ? 'past' : ''}" ${onclick}>${cell.d}</div></div>`;
    }
    return `<div class="cal"><h3>${MONTHS[m.month]} ${m.year}</h3><div class="cal-grid">${cells}</div></div>`;
  }).join('');

  const body = `<div>
    <div class="section-head"><h2><span class="material-symbols-rounded">calendar_month</span> My Availability</h2></div>
    <div class="card card-pad" style="margin-bottom:20px">
      <div class="legend" style="margin-bottom:14px">
        <span><span class="sw" style="background:var(--success-bg)"></span> Available</span>
        <span><span class="sw" style="background:var(--danger-bg)"></span> Unavailable</span>
        <span><span class="sw" style="background:var(--info-bg)"></span> Booked</span>
        <span><span class="sw" style="background:var(--surface-2);border:1px solid var(--outline)"></span> Not marked</span></div>
      <p class="muted small" style="margin:0"><span class="material-symbols-rounded" style="font-size:16px;vertical-align:-3px">touch_app</span> Click a day to mark it as available or unavailable.</p></div>
    <details class="card card-pad" style="margin-bottom:20px">
      <summary style="cursor:pointer;font-weight:600"><span class="material-symbols-rounded" style="vertical-align:-5px;color:var(--primary)">date_range</span> Mark a whole date range at once</summary>
      <form action="/dashboard/availability/bulk" method="post" style="margin-top:16px">
        <div class="form-grid"><div class="field"><label>From</label><input class="input" type="date" name="from" required /></div>
          <div class="field"><label>To</label><input class="input" type="date" name="to" required /></div></div>
        <div class="field"><label>Mark as</label><select class="input" name="status"><option value="available">Available</option><option value="unavailable">Unavailable</option></select></div>
        <div class="field"><label>Only on these days (optional)</label>
          <div class="cat-select">
            ${[['0', 'Sun'], ['1', 'Mon'], ['2', 'Tue'], ['3', 'Wed'], ['4', 'Thu'], ['5', 'Fri'], ['6', 'Sat']].map((d) => `<label><input type="checkbox" name="dow" value="${d[0]}" /> ${d[1]}</label>`).join('')}
          </div>
          <div class="hint">Leave all unchecked to mark every day in the range — or pick, e.g., every Friday.</div></div>
        <button class="btn btn-tonal" type="submit"><span class="material-symbols-rounded">done_all</span> Mark</button></form></details>
    <div class="cal-wrap">${cals}</div></div>
    <dialog id="dayDialog"><form action="/dashboard/availability" method="post">
      <div class="dialog-head"><strong>Day: <span id="dlg-date-label"></span></strong>
        <button type="button" class="icon-btn" onclick="closeDay()"><span class="material-symbols-rounded">close</span></button></div>
      <div class="dialog-body"><input type="hidden" name="date" id="dlg-date" />
        <div class="field"><label>Status</label><select class="input" name="status" id="dlg-status">
          <option value="available">Available — ready to book</option><option value="unavailable">Unavailable</option><option value="booked">Booked</option></select></div>
        <div class="field"><label>A note (optional)</label><input class="input" type="text" name="note" id="dlg-note" placeholder="Wedding at…, free after 9…" /></div></div>
      <div class="dialog-foot"><button class="btn btn-primary" type="submit"><span class="material-symbols-rounded">save</span> Save</button>
        <button class="btn btn-danger" type="submit" name="clear" value="1"><span class="material-symbols-rounded">delete</span> Clear</button></div>
    </form></dialog>`;
  return `<main class="page"><div class="container"><div class="dash">${dashnav('availability', pendingBadge, user)}${body}</div></div></main>`;
}

function googleCalUrl(b) {
  const d = (b.event_date || '').replace(/-/g, '');
  const end = new Date((b.event_date || '') + 'T00:00:00Z'); end.setUTCDate(end.getUTCDate() + 1);
  const dEnd = end.toISOString().slice(0, 10).replace(/-/g, '');
  const text = encodeURIComponent((b.event_type ? b.event_type + ' — ' : 'Booking — ') + b.requester_name);
  const details = encodeURIComponent([b.requester_phone ? 'Phone: ' + b.requester_phone : '', b.requester_email ? 'Email: ' + b.requester_email : '', b.message || ''].filter(Boolean).join('\n'));
  const loc = encodeURIComponent(b.location || '');
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${d}/${dEnd}&details=${details}&location=${loc}`;
}

export function dashBookings({ performer, bookings, filter, pendingBadge, user }) {
  const filters = [['all', 'All', 'list'], ['pending', 'Pending', 'schedule'], ['accepted', 'Confirmed', 'check_circle'], ['declined', 'Declined', 'cancel']];
  const chips = filters.map((f) =>
    `<a href="/dashboard/bookings${f[0] === 'all' ? '' : '?status=' + f[0]}" class="chip ${filter === f[0] ? 'active' : ''}"><span class="material-symbols-rounded">${f[2]}</span> ${f[1]}</a>`
  ).join('');
  let list;
  if (!bookings.length) {
    list = `<div class="card card-pad empty"><span class="material-symbols-rounded">inbox</span><p>No bookings here.</p></div>`;
  } else {
    list = `<div class="list">` + bookings.map((b) => {
      const st = BOOKING_STATUS[b.status];
      return `<div class="row-card"><div class="row-main">
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap"><span class="row-title">${e(b.requester_name)}</span>
          <span class="status ${st.cls}"><span class="material-symbols-rounded">${st.icon}</span> ${st.label}</span></div>
        <div class="row-sub"><span><span class="material-symbols-rounded">calendar_today</span> ${fmtDate(b.event_date)} (${weekday(b.event_date)})</span>
          ${b.event_type ? `<span><span class="material-symbols-rounded">celebration</span> ${e(b.event_type)}</span>` : ''}
          ${b.location ? `<span><span class="material-symbols-rounded">location_on</span> ${e(b.location)}</span>` : ''}</div>
        <div class="row-sub">${b.requester_phone ? `<span><a href="tel:${e(b.requester_phone)}" style="color:var(--primary)"><span class="material-symbols-rounded">call</span> ${e(b.requester_phone)}</a></span>` : ''}
          ${b.requester_email ? `<span><a href="mailto:${e(b.requester_email)}" style="color:var(--primary)"><span class="material-symbols-rounded">mail</span> ${e(b.requester_email)}</a></span>` : ''}</div>
        ${b.message ? `<div class="muted small" style="margin-top:8px;padding:10px 12px;background:var(--surface-sunken);border-radius:10px">${e(b.message)}</div>` : ''}</div>
        <div class="row-actions"><form action="/dashboard/bookings/${b.id}" method="post" style="display:flex;gap:8px;flex-wrap:wrap">
          ${b.status !== 'accepted' ? `<button class="btn btn-primary btn-sm" name="action" value="accept"><span class="material-symbols-rounded">check</span> Confirm</button>` : ''}
          ${b.status !== 'declined' ? `<button class="btn btn-ghost btn-sm" name="action" value="decline"><span class="material-symbols-rounded">block</span> Decline</button>` : ''}
          <button class="btn btn-danger btn-sm" name="action" value="delete" onclick="return confirm('Delete this booking?')"><span class="material-symbols-rounded">delete</span></button>
        </form>${b.status === 'accepted' ? `<div style="display:flex;gap:8px;flex-wrap:wrap;width:100%"><a class="btn btn-ghost btn-sm" href="/dashboard/bookings/${b.id}/ics"><span class="material-symbols-rounded">calendar_add_on</span> Add to calendar</a><a class="btn btn-ghost btn-sm" href="${googleCalUrl(b)}" target="_blank" rel="noopener"><span class="material-symbols-rounded">event</span> Google Calendar</a></div>` : ''}</div></div>`;
    }).join('') + `</div>`;
  }
  const body = `<div><div class="section-head"><h2><span class="material-symbols-rounded">event</span> Bookings</h2></div>
    <div class="chips" style="margin-bottom:20px">${chips}</div>${list}</div>`;
  return `<main class="page"><div class="container"><div class="dash">${dashnav('bookings', pendingBadge, user)}${body}</div></div></main>`;
}

export function dashSettings({ user, pendingBadge }) {
  const body = `<div><div class="section-head"><h2><span class="material-symbols-rounded">settings</span> Settings</h2></div>
    <section class="card card-pad" style="margin-bottom:20px"><div class="row-sub" style="font-size:1rem">
      <span><span class="material-symbols-rounded">person</span> ${e(user.name)}</span>
      <span><span class="material-symbols-rounded">mail</span> ${e(user.email)}</span>
      <span><span class="material-symbols-rounded">shield</span> ${user.role === 'admin' ? 'Administrator' : 'Music person'}</span></div></section>
    <section class="card card-pad"><div class="section-head" style="margin-bottom:12px"><h2 style="font-size:1.2rem"><span class="material-symbols-rounded">password</span> Change password</h2></div>
      <form action="/auth/password" method="post">
        <div class="field"><label>Current password</label><input class="input" type="password" name="current" required /></div>
        <div class="form-grid"><div class="field"><label>New password</label><input class="input" type="password" name="next_password" required /></div>
          <div class="field"><label>Confirm new password</label><input class="input" type="password" name="confirm" required /></div></div>
        <button class="btn btn-primary" type="submit"><span class="material-symbols-rounded">save</span> Change password</button></form></section></div>`;
  return `<main class="page"><div class="container"><div class="dash">${dashnav('settings', pendingBadge, user)}${body}</div></div></main>`;
}
