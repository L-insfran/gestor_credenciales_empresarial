import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const backend = 'http://localhost:3334'

/**
 * Misma URL que rutas del SPA (p. ej. /equipos/2, /login, /logs): si el proxy
 * no hace bypass, una recarga del navegador va al API y devuelve JSON 401.
 */
function apiProxy() {
  return {
    target: backend,
    changeOrigin: true,
    bypass(req) {
      const accept = req.headers.accept ?? ''
      if (accept.includes('text/html')) {
        return '/index.html'
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/login': apiProxy(),
      '/logout': apiProxy(),
      '/refresh-token': apiProxy(),
      '/2fa': apiProxy(),
      '/users': apiProxy(),
      '/credentials': apiProxy(),
      '/equipos': apiProxy(),
      '/migrations': apiProxy(),
      '/logs': apiProxy(),
      '/health': apiProxy(),
      '/me': apiProxy(),
    },
  },
})
