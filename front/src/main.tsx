import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ClerkProvider } from '@clerk/clerk-react'
import { dark } from '@clerk/themes'
import './index.css'
import App from './App.tsx'

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
      <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} appearance={{ baseTheme: dark }}>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <App />
        </BrowserRouter>
      </ClerkProvider>
    </StrictMode>,
  )
}
