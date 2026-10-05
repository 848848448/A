# 🎵 Music Directory — Cloudflare version

The same Music Directory site, re-architected to run on **Cloudflare** for free, fast,
always-on hosting that keeps its data.

| Piece | Runs on |
|-------|---------|
| App / routing | **Cloudflare Workers** (via the [Hono](https://hono.dev) framework) |
| Database (accounts, availability, bookings, sessions) | **Cloudflare D1** (SQLite-compatible) |
| Uploaded profile photos | **Cloudflare R2** (object storage) |
| CSS / fonts / client JS | **Workers static assets** (the `public/` folder) |
| Passwords | **PBKDF2** via the Web Crypto API |

It has every feature of the Node version: public directory with search and filters,
performer profiles with a live availability calendar, public booking requests, performer
logins (profile, availability, bookings), and the admin panel for opening accounts.

---

## Try it locally (no Cloudflare account needed)

```bash
cd cloudflare
npm install
npm run db:init:local     # create the local database tables
npm run db:seed:local     # add an admin login + sample performers
npm run dev               # open the printed http://localhost:8787
```

Default admin: `avrumypolatsek@gmail.com` / `admin1234`. Sample performers use `muzik123`.

---

## Deploy it to Cloudflare (free)

You'll do this once. It takes about 10 minutes.

### 1. Create a free Cloudflare account
Sign up at <https://dash.cloudflare.com/sign-up>. No credit card is required for the
free Workers, D1 and R2 tiers.

### 2. Log in from your machine
```bash
cd cloudflare
npm install
npx wrangler login        # opens a browser to authorize
```

### 3. Create the database and the photo bucket
```bash
npx wrangler d1 create muzik-db
npx wrangler r2 bucket create muzik-uploads
```
The `d1 create` command prints a **`database_id`**. Open `wrangler.toml` and paste it in
place of the placeholder on the `database_id = "…"` line.

### 4. Set a session secret (recommended)
```bash
npx wrangler secret put SESSION_SECRET
# paste any long random string when prompted
```

### 5. Create the tables and seed the first admin + samples
```bash
npm run db:init           # runs schema.sql against your live D1
npm run db:seed           # adds the admin login + sample performers
```

### 6. Deploy
```bash
npm run deploy
```
Wrangler prints your live URL, e.g. `https://muzik-direktorie.<your-subdomain>.workers.dev`.
Open it — the site is live, with real logins and saved bookings.

### 7. First thing after deploying
Log in as the admin (`avrumypolatsek@gmail.com` / `admin1234`) and **change the password**
from Dashboard → Settings. Then use the admin panel to open accounts for your singers and
musicians.

---

## Notes

- **Custom domain:** in the Cloudflare dashboard, open the Worker → *Settings* → *Domains &
  Routes* to attach your own domain (e.g. `music.yoursite.com`).
- **Changing the seed:** edit `seed.sql`. Passwords there are pre-hashed with PBKDF2; to add
  accounts after deploy, just use the admin panel instead.
- **Costs:** the free tiers (Workers 100k requests/day, D1 5 GB, R2 10 GB) are far more than a
  directory like this needs, so in practice this runs for free.
