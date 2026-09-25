import type { CapacitorConfig } from '@capacitor/cli'

/**
 * The native shell round the web app. Nothing of the game lives here: the
 * shell loads `front/`'s production build (see `webDir`), so the app is the
 * website, packaged — same React, same back, same Clerk.
 *
 * Two ways to run it:
 *  - packaged: `npm run sync` builds the web app and copies it into the
 *    native projects; Android Studio / Xcode then build those.
 *  - live: `CAP_LIVE_URL=http://<your-pc-ip>:5173 npm run sync` points the
 *    shell at the Vite dev server instead, so edits in `front/` show up in
 *    the app on save, no repackaging. Dev only — never ship a build with
 *    it set.
 */
const liveUrl = process.env.CAP_LIVE_URL

const config: CapacitorConfig = {
  appId: 'app.clankup',
  appName: 'ClankUp',
  webDir: '../front/dist',
  server: {
    // Android serves the app from https://localhost so secure-context APIs
    // (crypto, clipboard, audio unlock) behave as on the site; iOS uses
    // capacitor://localhost. Both must be allowed origins in the back's
    // CORS and in Clerk's dashboard.
    androidScheme: 'https',
    ...(liveUrl ? { url: liveUrl, cleartext: true } : {}),
  },
  ios: {
    // the page's own dark ground behind the web view, so nothing white
    // flashes between the splash and the app
    backgroundColor: '#08080c',
    contentInset: 'never',
  },
  android: {
    backgroundColor: '#08080c',
  },
  plugins: {
    // The full-bleed sky (assets/splash.png, drawn by scripts/splash.mjs)
    // stays up after the system splash until the web view has painted, so
    // the planet never sits on a bare colour between the two.
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 0,
      launchFadeOutDuration: 250,
      backgroundColor: '#120d22',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: false,
    },
    // Sign in with Google and with Apple, natively (see
    // front/src/lib/nativeSignIn.ts). Apple's is iOS only — the plugin
    // would fall back to a browser round-trip on Android, and the button
    // is hidden there anyway.
    SocialLogin: {
      providers: { google: true, apple: true, facebook: false, twitter: false },
      logLevel: 1,
    },
  },
}

export default config
