import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ClerkProvider } from '@clerk/clerk-react'
import { dark } from '@clerk/themes'
import './index.css'
import App from './App.tsx'
import { LanguageProvider } from './context/LanguageContext'
import { isNativeApp } from './lib/native'

// Inside the native shell the page runs edge to edge under hidden system
// bars; index.css moves the edge-anchored pieces in by the safe area when
// this class is on.
if (isNativeApp()) document.documentElement.classList.add('native')

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

const root = createRoot(document.getElementById('root')!)

if (!CLERK_PUBLISHABLE_KEY) {
  root.render(
    <div style={{ padding: 24, color: '#f4f4f7', fontFamily: 'system-ui, sans-serif' }}>
      Falta VITE_CLERK_PUBLISHABLE_KEY. Si esto es un despliegue, comprueba el secret en GitHub
      Actions; si es local, revisa front/.env.
    </div>,
  )
} else {
  root.render(
    <StrictMode>
      <ClerkProvider
        publishableKey={CLERK_PUBLISHABLE_KEY}
        appearance={{ baseTheme: dark }}
        afterSignOutUrl={import.meta.env.BASE_URL}
        // What keeps a session alive inside the app. Clerk assumes by
        // default that it can set cookies on its own domain and read them
        // back — true on the website, false in a web view: the page is
        // served from `capacitor://localhost` (iOS refuses to let an app
        // serve over https, so this cannot be changed), which makes every
        // cookie for clerk.clankup.app a third-party one, and WKWebView
        // blocks those. The session then survived only until the next time
        // Clerk had to read it back: returning from an ad, coming back from
        // the background, a cold start. With this off Clerk keeps the
        // client token in localStorage and sends it itself, which is what
        // it documents for native platforms.
        standardBrowser={!isNativeApp()}
      >
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <LanguageProvider>
            <App />
          </LanguageProvider>
        </BrowserRouter>
      </ClerkProvider>
    </StrictMode>,
  )
}
