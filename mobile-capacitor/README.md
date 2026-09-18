# mobile-capacitor

The native shell round the web app. Nothing of the game lives here — the
shell loads `front/`'s production build inside a system web view, so the
app **is** the website, packaged. Same React, same back, same Clerk.

```
mobile-capacitor/
  capacitor.config.ts   app id, name, where the web build is, live-reload switch
  android/              the Android project (open in Android Studio)
  ios/                  the iOS project (open in Xcode — needs a Mac)
```

## Every-day flow

1. Change things in `front/` as always.
2. `npm run sync` — builds `front/` (`tsc -b && vite build`) and copies the
   result into `android/` and `ios/`.
3. Build/run the native project from Android Studio or Xcode (or
   `npm run run:android` / `npm run run:ios` with a device attached).

So yes: a change in the web needs a `sync` and a native rebuild to reach the
app. Except while developing —

## Live reload (no repackaging while you work)

Point the shell at the Vite dev server instead of the packaged build:

```
# in front/  (must listen on the LAN, not just localhost)
npx vite --host

# in mobile-capacitor/  (your PC's LAN IP, phone on the same wifi)
CAP_LIVE_URL=http://192.168.1.20:5173 npm run sync:live
```

Then run the app once from Android Studio / Xcode: every save in `front/`
shows up in the app. Run `npm run sync` (without the variable) before any
real build — never ship with the live URL set.

## What you need to build

- **Android**: Android Studio (Windows is fine). It brings the JDK and the
  SDK; open `android/` and press Run with a phone in USB-debugging mode or
  an emulator.
- **iOS**: a Mac with Xcode, plus the Apple Developer account for a real
  device / TestFlight. `ios/` is already generated; on the Mac run
  `npx cap sync ios` once (installs the Swift packages) and open
  `ios/App/App.xcworkspace`.

There is no Expo Go equivalent: Capacitor apps are ordinary native apps
and need the native toolchain to run. The closest "just look at it" is the
site itself in Safari/Chrome on the phone — the web view is the same
engine, so it looks and performs the same.

## Origins

Inside the app the page is served from `capacitor://localhost` (iOS) and
`https://localhost` (Android). Both are in the back's CORS list
(`back/src/index.js`) and must be added as allowed origins in Clerk's
dashboard before sign-in works from the app.

## Next steps (not done yet)

- Sign in: OAuth can't run inside an embedded web view (Google blocks it).
  Needs `@capacitor/browser` + a return URL scheme, or native Sign in with
  Google / Sign in with Apple plugins. Apple requires Sign in with Apple if
  Google is offered.
- Purchases: `@revenuecat/purchases-capacitor`, same RevenueCat project as
  the back, products created in App Store Connect / Play Console.
- Ads: `@capacitor-community/admob`.
- Icons and splash: `@capacitor/assets` from `front/public/icons`.
- Haptics, push, status bar: `@capacitor/haptics`, `@capacitor/push-notifications`,
  `@capacitor/status-bar`.

## Sign in (Google, native)

Inside the app the Google button doesn't redirect: `@capgo/capacitor-social-login`
opens the system account sheet and the ID token goes to Clerk
(`front/src/lib/nativeSignIn.ts`). What it needs, once:

- Google Cloud, same project: a **Web application** OAuth client (its ID
  and secret go into Clerk → SSO connections → Google → *Use custom
  credentials*; its ID also into `front/.env.app` as
  `VITE_GOOGLE_WEB_CLIENT_ID`) and one **Android** client per signing key
  (package `app.clankup` + SHA-1; nothing from it goes in the app).
  Debug SHA-1: `cd android && ./gradlew signingReport`.
- Clerk instance `allowed_origins` = `capacitor://localhost`,
  `https://localhost` (done on the dev instance; for production run the
  same PATCH on `/v1/instance` with the live secret key).
- Keys: `front/.env.app` (see `.env.app.example`) — `npm run sync` builds
  the web app with `--mode app`, which loads it over `.env`.
