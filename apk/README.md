# Android APK (Trusted Web Activity)

This folder builds a signed Android **APK** that wraps the live website as a
native app. Because the app loads the live site, every update you deploy shows
up automatically — you never rebuild or reinstall the APK for content changes.

## How to build and get the APK (from a phone browser)

1. Go to the repo's **Actions** tab → **Build Android APK** → **Run workflow**.
2. When it finishes (green ✓), open the run and download the
   **`music-directory-apk`** artifact (a zip containing the `.apk`).
3. Unzip, then open the `.apk` on your Android phone to install it
   (you may need to allow "install from unknown sources" once).

## Files

- `twa-manifest.json` — the Bubblewrap build config (app name, colors, icons,
  the website it wraps, and the signing key to use).
- `android.keystore` — the signing key used to sign the APK.

## About the signing key

`android.keystore` is a self-signed key for sideloading this community app.
Its alias is `muzik` and its password is `muzikdirektorie2026`. Its SHA-256
fingerprint is registered at `/.well-known/assetlinks.json` on the site, which
is what lets the app open fullscreen (no browser address bar).

Keeping the same key means future rebuilds install over the old app without
uninstalling. If you ever publish to the Google Play Store, generate a fresh,
private key instead and update the `assetlinks.json` fingerprint in
`cloudflare/src/index.js`.
