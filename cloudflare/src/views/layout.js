import { escapeHtml as e, colorFromString, initials } from '../lib/helpers.js';

export function avatar(name, photo, size = 48) {
  const hue = colorFromString(name || '');
  const fs = Math.round(size * 0.4);
  const inner = photo
    ? `<img src="${e(photo)}" alt="${e(name)}" />`
    : `${e(initials(name))}`;
  return `<div class="avatar" style="width:${size}px;height:${size}px;font-size:${fs}px;background:hsl(${hue},55%,55%)">${inner}</div>`;
}

function headerHtml(user, path) {
  const link = (href, active, icon, label) =>
    `<a href="${href}" class="navlink ${active ? 'active' : ''}"><span class="material-symbols-rounded">${icon}</span> ${label}</a>`;
  let nav = link('/', path === '/', 'search', 'Browse');
  if (user) {
    nav += link('/dashboard', path.startsWith('/dashboard'), 'dashboard', 'My Dashboard');
    if (user.role === 'admin') nav += link('/admin', path.startsWith('/admin'), 'admin_panel_settings', 'Admin');
    nav += `<form action="/auth/logout" method="post" style="margin:0"><button class="navlink" style="border:none;background:none;cursor:pointer;font-family:inherit"><span class="material-symbols-rounded">logout</span> Log out</button></form>`;
  } else {
    nav += link('/auth/login', path.startsWith('/auth'), 'login', 'Log in');
  }
  return `<header class="appbar"><div class="container appbar-inner">
    <a href="/" class="brand"><span class="logo"><span class="material-symbols-rounded fill">music_note</span></span>
      <span>Music Directory<small>Singers · Players · All music people</small></span></a>
    <nav class="nav" id="mainNav">${nav}</nav>
    <button class="icon-btn" onclick="toggleTheme()" title="Switch theme" aria-label="Switch theme"><span class="material-symbols-rounded" id="theme-icon">dark_mode</span></button>
    <button class="icon-btn menu-toggle" onclick="toggleMenu()" aria-label="Menu"><span class="material-symbols-rounded">menu</span></button>
  </div></header>`;
}

function flashHtml(flash) {
  if (!flash) return '';
  const icon = flash.type === 'success' ? 'check_circle' : (flash.type === 'error' ? 'error' : 'info');
  return `<div class="container" style="padding-top:18px"><div class="flash flash-${e(flash.type)}">
    <span class="material-symbols-rounded">${icon}</span><div>${e(flash.msg)}</div></div></div>`;
}

const footerHtml = `<footer class="footer"><div class="container footer-inner">
  <div style="display:flex;align-items:center;gap:8px"><span class="material-symbols-rounded fill" style="color:var(--primary)">music_note</span>
    <span>Music Directory — the place for all music people</span></div>
  <div>© ${new Date().getFullYear()} · All rights reserved</div>
</div></footer><script src="/js/main.js"></script>`;

export function layout({ title, user, path, flash, body }) {
  return `<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${e(title ? title + ' · Music Directory' : 'Music Directory')}</title>
<meta name="description" content="A directory of singers, musicians and all music people — see when they are available and book them." />
<link rel="stylesheet" href="/css/fonts.css" />
<link rel="stylesheet" href="/css/styles.css" />
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='24' fill='%236c4cd6'/><text x='50' y='72' font-size='60' text-anchor='middle' fill='white'>♪</text></svg>" />
</head>
<body>
${headerHtml(user, path || '/')}
${flashHtml(flash)}
${body}
${footerHtml}
</body>
</html>`;
}
