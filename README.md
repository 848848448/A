# 🎵 Music Directory & Booking

A full-stack directory and booking website for singers, musicians, bands and every kind of
music person. The public can browse profiles, see each performer's availability calendar, and
send booking requests. An administrator opens accounts for people; each person logs in to manage
their own profile, set their availability, and handle their bookings.

The interface is in English and uses Google's **Material Symbols** icon set and a
Material-inspired design, in both light and dark themes.

## Deploy it for real (Cloudflare)

To run the full app online — with real logins, saved bookings, and the admin panel — there's a
Cloudflare version in [`cloudflare/`](cloudflare/) (Cloudflare Workers + D1 + R2). It runs on
Cloudflare's free tier (no credit card needed). See [`cloudflare/README.md`](cloudflare/README.md)
for step-by-step deploy instructions.

## Live preview

A static, browsable preview of the site is published via GitHub Pages:
**https://848848448.github.io/A/** (served from `index.html`). You can search, filter,
open profiles, view availability, and try the booking form there.

That preview is front-end only. The **full app** — real logins, saved availability and
bookings, and the admin panel — is the Node.js server below, which needs a host that can run
Node (see **Running it**). GitHub Pages serves static files only, so it cannot run the server.

---

## Features

**For the public (no login needed)**
- Browse all music people in a card directory
- Search by name / description / location
- Filter by category (singer, band, DJ, violin, badchen, …)
- Open a performer's profile: bio, contact, categories, price
- See a live availability calendar (free / booked / unavailable)
- Send a booking request for a specific date

**For a music person (performer login)**
- Dashboard overview (pending / accepted bookings, free days)
- Edit profile: name, categories, bio, photo (upload or URL), phone, email, website, location, price
- Toggle whether they appear in the public directory
- Set availability — click any day, or mark a whole date range at once
- See and manage booking requests (accept / decline / delete); accepting marks the day booked
- Change their own password

**For the administrator**
- Open new accounts (performer or admin) with a starting password
- See every music person; feature, hide, reset passwords, or delete accounts
- See every booking across the platform

---

## Tech stack

- **Node.js + Express** — server and routing
- **better-sqlite3** — embedded database (no external service needed)
- **express-session** (persisted to SQLite) — login sessions
- **bcryptjs** — password hashing
- **EJS** — server-rendered templates
- **multer** — profile photo uploads
- **Self-hosted fonts** — Rubik and Material Symbols Rounded, served locally
  from `public/fonts/` so the site works even without internet access to Google Fonts.

No build step. No external API keys.

---

## Running it

```bash
npm install        # install dependencies
npm run seed       # create the database + an admin login + sample performers
npm start          # start the server on http://localhost:3000
```

Then open **http://localhost:3000**.

### Default logins (created by `npm run seed`)

| Role      | Email                        | Password     |
|-----------|------------------------------|--------------|
| Admin     | `avrumypolatsek@gmail.com`   | `admin1234`  |
| Performer | `meir@example.com` (and others) | `muzik123` |

> Change the admin password after the first login (Dashboard → Settings), or seed with your
> own values: `ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run seed`.

The port can be changed with the `PORT` environment variable, and the session secret with
`SESSION_SECRET`.

---

## Project structure

```
server.js              Express app, sessions, middleware, routes wiring
db.js                  SQLite schema + connection
seed.js                Seeds admin + sample data
lib/
  constants.js         Music categories, status labels (with Material icons)
  helpers.js           Date formatting, avatars, escaping
  auth.js              requireLogin / requireAdmin middleware
routes/
  public.js            Directory, profile, booking submission
  auth.js              Login, logout, password change
  dashboard.js         Performer: profile, availability, bookings, settings
  admin.js             Admin: accounts, featured/hide, all bookings
views/                 EJS templates (RTL, Material-style)
public/
  css/                 styles.css (design system) + fonts.css
  js/main.js           Menu, theme toggle, calendar interactions
  fonts/               Self-hosted woff2 fonts
  uploads/             Uploaded profile photos (gitignored)
data/                  SQLite database + session store (gitignored)
```

Data lives under `data/` and uploaded photos under `public/uploads/` — both are gitignored, so the
repository stays clean and each environment keeps its own data.
