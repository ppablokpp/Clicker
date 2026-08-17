import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // GitHub Pages serves this as a project site at /Clicker/, so assets
  // need that prefix in production; local dev keeps serving from /.
  base: command === 'build' ? '/Clicker/' : '/',
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
  },
}))
