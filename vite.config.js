import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  base: process.env.GITHUB_ACTIONS === 'true' ? '/jisho_to_anki/' : '/',
  plugins: [react(),tailwindcss()],
  server: {
    proxy: {
      '/api/anki': {
        target: 'http://127.0.0.1:8765',
        changeOrigin: true,
        rewrite: () => '/',
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyRequest) => proxyRequest.removeHeader('origin'));
        },
      },
    },
  },
})
