import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // Served from clankup.app's own root via the custom domain (GitHub Pages
  // also redirects the old username.github.io/Clicker/ URL there once a
  // custom domain is configured), so assets stay at the root in production
  // too instead of the old GitHub-project-page /Clicker/ prefix.
  base: '/',
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
  },
})
