import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),tailwindcss()],
  server: {
    proxy: {
      '/api/jisho': {
        target: 'https://jisho.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/jisho/, '/api/v1'),
      },
      '/api/kanji': {
        target: 'https://kanjiapi.dev',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/kanji/, '/v1/kanji'),
      },
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
