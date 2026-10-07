import { escapeHtml as e, catObjects, fmtDate } from '../lib/helpers.js';
import { CATEGORIES, BOOKING_STATUS } from '../lib/constants.js';
import { avatar } from './layout.js';

export function adminHome({ people, admins, stats }) {
  let list;
  if (!people.length) {
    list = `<div class="card card-pad empty"><span class="material-symbols-rounded">group_off</span><p>No accounts yet. <a href="/admin/new" style="color:var(--primary)">Open the first one</a>.</p></div>`;
  } else {
    list = `<div class="list">` + people.map((p) => {
      const cats = catObjects(p.categories);
      const catSpans = cats.slice(0, 3).map((c) => `<span><span class="material-symbols-rounded">${c.icon}</span> ${c.label}</span>`).join('');
      const canDelete = p.user_role !== 'admin' || admins.length > 1;
      return `<div class="row-card">${avatar(p.display_name, p.photo, 52)}
        <div class="row-main"><div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <span class="row-title">${e(p.display_name)}</span>
          ${p.featured ? `<span class="status is-booked"><span class="material-symbols-rounded">star</span> Featured</span>` : ''}
          ${!p.active ? `<span class="status is-declined"><span class="material-symbols-rounded">visibility_off</span> Hidden</span>` : ''}
          ${p.user_role === 'admin' ? `<span class="status is-accepted"><span class="material-symbols-rounded">shield</span> Admin</span>` : ''}</div>
          <div class="row-sub"><span><span class="material-symbols-rounded">mail</span> ${e(p.user_email)}</span>${catSpans}</div></div>
        <div class="row-actions">
          <a href="/p/${p.id}" class="btn btn-ghost btn-sm" title="View profile"><span class="material-symbols-rounded">visibility</span></a>
          <form action="/admin/performer/${p.id}/flag" method="post" style="display:inline"><input type="hidden" name="field" value="featured" />
            <button class="btn btn-ghost btn-sm" title="Feature"><span class="material-symbols-rounded ${p.featured ? 'fill' : ''}">star</span></button></form>
          <form action="/admin/performer/${p.id}/flag" method="post" style="display:inline"><input type="hidden" name="field" value="active" />
            <button class="btn btn-ghost btn-sm" title="${p.active ? 'Hide' : 'Show'}"><span class="material-symbols-rounded">${p.active ? 'visibility' : 'visibility_off'}</span></button></form>
          <form action="/admin/user/${p.user_id}/password" method="post" style="display:inline" onsubmit="return confirm('Set a new password for ${e(p.display_name)}?')">
            <button class="btn btn-ghost btn-sm" title="New password"><span class="material-symbols-rounded">key</span></button></form>
          ${canDelete ? `<form action="/admin/user/${p.user_id}/delete" method="post" style="display:inline" onsubmit="return confirm('Delete the entire account for ${e(p.display_name)}? This cannot be undone.')">
            <button class="btn btn-danger btn-sm" title="Delete"><span class="material-symbols-rounded">delete</span></button></form>` : ''}
        </div></div>`;
    }).join('') + `</div>`;
  }
  return `<main class="page"><div class="container">
    <div class="section-head"><h2><span class="material-symbols-rounded">admin_panel_settings</span> Admin Panel</h2>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <a href="/admin/messages" class="btn btn-outline"><span class="material-symbols-rounded">forum</span> Messages${stats.messagesNew ? ` <span class="badge" style="margin-inline-start:6px">${stats.messagesNew}</span>` : ''}</a>
        <a href="/admin/reviews" class="btn btn-outline"><span class="material-symbols-rounded">reviews</span> Reviews${stats.reviewsPending ? ` <span class="badge" style="margin-inline-start:6px">${stats.reviewsPending}</span>` : ''}</a>
        <a href="/admin/bookings" class="btn btn-outline"><span class="material-symbols-rounded">event</span> All bookings</a>
        <a href="/admin/new" class="btn btn-primary"><span class="material-symbols-rounded">person_add</span> Open new account</a></div></div>
    <div class="stat-row" style="margin-bottom:26px">
      <div class="stat"><div class="ic ic-p"><span class="material-symbols-rounded">group</span></div><div><div class="num">${stats.people}</div><div class="lbl">Music people</div></div></div>
      <div class="stat"><div class="ic ic-a"><span class="material-symbols-rounded">schedule</span></div><div><div class="num">${stats.pending}</div><div class="lbl">Pending bookings</div></div></div>
      <div class="stat"><div class="ic ic-s"><span class="material-symbols-rounded">event</span></div><div><div class="num">${stats.bookings}</div><div class="lbl">Total bookings</div></div></div>
      <div class="stat"><div class="ic ic-a"><span class="material-symbols-rounded">reviews</span></div><div><div class="num">${stats.reviewsPending || 0}</div><div class="lbl">Reviews to check</div></div></div></div>
    <div class="section-head" style="margin-bottom:14px"><h2 style="font-size:1.25rem"><span class="material-symbols-rounded">group</span> Music people</h2></div>
    ${list}
  </div></main>`;
}

export function adminNew({ generated }) {
  const catSelect = CATEGORIES.map((c) =>
    `<label><input type="checkbox" name="categories" value="${c.key}" /><span class="material-symbols-rounded">${c.icon}</span> ${c.label}</label>`
  ).join('');
  return `<main class="page"><div class="container" style="max-width:760px">
    <a href="/admin" class="btn btn-ghost btn-sm" style="margin-bottom:12px"><span class="material-symbols-rounded">arrow_back</span> Back to admin</a>
    <div class="section-head"><h2><span class="material-symbols-rounded">person_add</span> Open new account</h2></div>
    <form action="/admin/new" method="post"><section class="card card-pad">
      <div class="form-grid"><div class="field"><label>Full name *</label><input class="input" type="text" name="name" required /></div>
        <div class="field"><label>Name on profile</label><input class="input" type="text" name="display_name" placeholder="Leave empty = same name" /></div></div>
      <div class="form-grid"><div class="field"><label>Email (to log in) *</label><input class="input" type="email" name="email" required /></div>
        <div class="field"><label>Starting password *</label><input class="input" type="text" name="password" value="${e(generated)}" required />
          <div class="hint">The person can change it later. Pass it along to them.</div></div></div>
      <div class="form-grid"><div class="field"><label>Phone</label><input class="input" type="tel" name="phone" /></div>
        <div class="field"><label>Location / area</label><input class="input" type="text" name="location" /></div></div>
      <div class="field"><label>What do they do?</label><div class="cat-select">${catSelect}</div></div>
      <div class="field"><label>Account type</label><select class="input" name="role">
        <option value="performer">Music person (can edit their profile and bookings)</option>
        <option value="admin">Administrator (can manage everything)</option></select></div>
      <button class="btn btn-primary" type="submit"><span class="material-symbols-rounded">check</span> Create account</button>
    </section></form></div></main>`;
}

export function adminReviews({ reviews }) {
  const star = (n) => { let o = ''; for (let i = 1; i <= 5; i++) o += `<span class="material-symbols-rounded${i <= n ? ' fill' : ''}">star</span>`; return o; };
  let list;
  if (!reviews.length) {
    list = `<div class="card card-pad empty"><span class="material-symbols-rounded">rate_review</span><p>No reviews yet.</p></div>`;
  } else {
    list = `<div class="list">` + reviews.map((r) => `<div class="row-card"><div class="row-main">
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap"><span class="row-title">${e(r.author_name)}</span>
        <span class="rating-inline sm">${star(r.rating)}</span>
        <span class="muted">→</span><a href="/p/${r.performer_id}" style="color:var(--accent-ink);font-weight:600">${e(r.performer_name)}</a>
        ${r.approved ? `<span class="status is-accepted"><span class="material-symbols-rounded">check_circle</span> Live</span>` : `<span class="status is-pending"><span class="material-symbols-rounded">schedule</span> Pending</span>`}</div>
      ${r.comment ? `<div class="muted small" style="margin-top:8px;padding:10px 12px;background:var(--surface-sunken);border-radius:10px;white-space:pre-line">${e(r.comment)}</div>` : ''}
      <div class="small muted" style="margin-top:6px">${fmtDate((r.created_at || '').slice(0, 10))}</div></div>
      <div class="row-actions"><form action="/admin/review/${r.id}" method="post" style="display:flex;gap:8px;flex-wrap:wrap">
        ${!r.approved ? `<button class="btn btn-primary btn-sm" name="action" value="approve"><span class="material-symbols-rounded">check</span> Approve</button>` : `<button class="btn btn-ghost btn-sm" name="action" value="hide"><span class="material-symbols-rounded">visibility_off</span> Hide</button>`}
        <button class="btn btn-danger btn-sm" name="action" value="delete" onclick="return confirm('Delete this review?')"><span class="material-symbols-rounded">delete</span></button>
      </form></div></div>`).join('') + `</div>`;
  }
  return `<main class="page"><div class="container">
    <a href="/admin" class="btn btn-ghost btn-sm" style="margin-bottom:12px"><span class="material-symbols-rounded">arrow_back</span> Back to admin</a>
    <div class="section-head"><h2><span class="material-symbols-rounded">reviews</span> Reviews</h2></div>
    <p class="muted small" style="margin:-8px 0 18px">New reviews are hidden until you approve them.</p>${list}
  </div></main>`;
}

export function adminMessages({ messages }) {
  let list;
  if (!messages.length) {
    list = `<div class="card card-pad empty"><span class="material-symbols-rounded">mark_email_read</span><p>No messages yet.</p></div>`;
  } else {
    list = `<div class="list">` + messages.map((m) => `<div class="row-card"><div class="row-main">
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap"><span class="row-title">${e(m.name)}</span>
        ${m.subject ? `<span class="muted">· ${e(m.subject)}</span>` : ''}
        ${m.handled ? `<span class="status is-accepted"><span class="material-symbols-rounded">check_circle</span> Handled</span>` : `<span class="status is-pending"><span class="material-symbols-rounded">schedule</span> New</span>`}</div>
      <div class="row-sub">${m.email ? `<span><a href="mailto:${e(m.email)}" style="color:var(--accent-ink)"><span class="material-symbols-rounded">mail</span> ${e(m.email)}</a></span>` : ''}
        ${m.phone ? `<span><a href="tel:${e(m.phone)}" style="color:var(--accent-ink)"><span class="material-symbols-rounded">call</span> ${e(m.phone)}</a></span>` : ''}
        <span><span class="material-symbols-rounded">schedule</span> ${fmtDate((m.created_at || '').slice(0, 10))}</span></div>
      <div class="muted small" style="margin-top:8px;padding:10px 12px;background:var(--surface-sunken);border-radius:10px;white-space:pre-line">${e(m.body)}</div></div>
      <div class="row-actions"><form action="/admin/message/${m.id}" method="post" style="display:flex;gap:8px;flex-wrap:wrap">
        ${m.handled ? `<button class="btn btn-ghost btn-sm" name="action" value="unhandle"><span class="material-symbols-rounded">undo</span></button>` : `<button class="btn btn-primary btn-sm" name="action" value="handle"><span class="material-symbols-rounded">check</span> Mark done</button>`}
        <button class="btn btn-danger btn-sm" name="action" value="delete" onclick="return confirm('Delete this message?')"><span class="material-symbols-rounded">delete</span></button>
      </form></div></div>`).join('') + `</div>`;
  }
  return `<main class="page"><div class="container">
    <a href="/admin" class="btn btn-ghost btn-sm" style="margin-bottom:12px"><span class="material-symbols-rounded">arrow_back</span> Back to admin</a>
    <div class="section-head"><h2><span class="material-symbols-rounded">forum</span> Messages</h2></div>${list}
  </div></main>`;
}

export function adminBookings({ bookings }) {
  let list;
  if (!bookings.length) {
    list = `<div class="card card-pad empty"><span class="material-symbols-rounded">inbox</span><p>No bookings in the system yet.</p></div>`;
  } else {
    list = `<div class="list">` + bookings.map((b) => {
      const st = BOOKING_STATUS[b.status];
      return `<div class="row-card"><div class="row-main">
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap"><span class="row-title">${e(b.requester_name)}</span>
          <span class="muted">→</span><a href="/p/${b.performer_id}" style="color:var(--primary);font-weight:600">${e(b.performer_name)}</a>
          <span class="status ${st.cls}"><span class="material-symbols-rounded">${st.icon}</span> ${st.label}</span></div>
        <div class="row-sub"><span><span class="material-symbols-rounded">calendar_today</span> ${fmtDate(b.event_date)}</span>
          ${b.event_type ? `<span><span class="material-symbols-rounded">celebration</span> ${e(b.event_type)}</span>` : ''}
          ${b.location ? `<span><span class="material-symbols-rounded">location_on</span> ${e(b.location)}</span>` : ''}
          ${b.requester_phone ? `<span><span class="material-symbols-rounded">call</span> ${e(b.requester_phone)}</span>` : ''}
          ${b.requester_email ? `<span><span class="material-symbols-rounded">mail</span> ${e(b.requester_email)}</span>` : ''}</div></div></div>`;
    }).join('') + `</div>`;
  }
  return `<main class="page"><div class="container">
    <a href="/admin" class="btn btn-ghost btn-sm" style="margin-bottom:12px"><span class="material-symbols-rounded">arrow_back</span> Back to admin</a>
    <div class="section-head"><h2><span class="material-symbols-rounded">event</span> All bookings</h2></div>${list}
  </div></main>`;
}
