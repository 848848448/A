import { escapeHtml as e, colorFromString, initials } from '../lib/helpers.js';

export function avatar(name, photo, size = 48) {
  const hue = colorFromString(name || '');
  const fs = Math.round(size * 0.4);
  const inner = photo
    ? `<img src="${e(photo)}" alt="${e(name)}" />`
    : `${e(initials(name))}`;
  return `<div class="avatar" style="width:${size}px;height:${size}px;font-size:${fs}px;background:hsl(${hue},38%,44%)">${inner}</div>`;
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
      <span>Music Directory<small>Singers · Bands · Musicians</small></span></a>
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

const footerHtml = `<footer class="footer"><div class="container">
  <div class="footer-top">
    <div>
      <div class="footer-brand"><span class="logo"><span class="material-symbols-rounded fill">music_note</span></span> Music Directory</div>
      <p class="muted small" style="margin:0;max-width:34ch">The directory for singers, bands, musicians and entertainers — find who's available and book them for your event.</p>
    </div>
    <div class="footer-col"><h4>Browse</h4>
      <a href="/?cat=singer">Singers</a>
      <a href="/?cat=band">Bands</a>
      <a href="/?cat=musician">Musicians</a>
      <a href="/">All artists</a></div>
    <div class="footer-col"><h4>For artists</h4>
      <a href="/auth/login">Log in</a>
      <a href="/dashboard">My dashboard</a>
      <a href="/auth/login">Manage availability</a></div>
  </div>
  <div class="footer-bottom">
    <span>© ${new Date().getFullYear()} Music Directory · All rights reserved</span>
    <span>Accounts are opened by an administrator.</span>
  </div>
</div></footer><script src="/js/main.js"></script>`;

export function layout({ title, user, path, flash, body, origin = '', url = '', description = '', image = '' }) {
  const fullTitle = title ? title + ' · Music Directory' : 'Music Directory — book singers, bands & musicians';
  const desc = (description || 'A directory of singers, bands, musicians, cantors and entertainers — see when they are available and book them for your event.').slice(0, 300);
  const img = image ? (/^https?:\/\//i.test(image) ? image : origin + image) : (origin + '/icons/icon-512.png');
  return `<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${e(fullTitle)}</title>
<meta name="description" content="${e(desc)}" />
${url ? `<link rel="canonical" href="${e(url)}" />` : ''}
<meta property="og:type" content="website" />
<meta property="og:site_name" content="Music Directory" />
<meta property="og:title" content="${e(fullTitle)}" />
<meta property="og:description" content="${e(desc)}" />
${url ? `<meta property="og:url" content="${e(url)}" />` : ''}
<meta property="og:image" content="${e(img)}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${e(fullTitle)}" />
<meta name="twitter:description" content="${e(desc)}" />
<meta name="twitter:image" content="${e(img)}" />
<link rel="stylesheet" href="/css/fonts.css" />
<link rel="stylesheet" href="/css/styles.css" />
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%2317181c'/><text x='50' y='72' font-size='60' text-anchor='middle' fill='white'>♪</text></svg>" />
<link rel="manifest" href="/manifest.webmanifest" />
<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
<meta name="theme-color" content="#0e0f12" media="(prefers-color-scheme: dark)" />
<link rel="apple-touch-icon" href="/icons/icon-192.png" />
<meta name="mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-title" content="Music Directory" />
</head>
<body>
${headerHtml(user, path || '/')}
${flashHtml(flash)}
${body}
${footerHtml}
</body>
</html>`;
}
