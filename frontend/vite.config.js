import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/login': { target: 'http://localhost:1337', changeOrigin: true },
      '/logout': { target: 'http://localhost:1337', changeOrigin: true },
      '/refresh-token': { target: 'http://localhost:1337', changeOrigin: true },
      '/2fa': { target: 'http://localhost:1337', changeOrigin: true },
      '/users': { target: 'http://localhost:1337', changeOrigin: true },
      '/credentials': { target: 'http://localhost:1337', changeOrigin: true },
      '/logs': { target: 'http://localhost:1337', changeOrigin: true },
      '/health': { target: 'http://localhost:1337', changeOrigin: true },
      '/me': { target: 'http://localhost:1337', changeOrigin: true },
    },
  },
})
