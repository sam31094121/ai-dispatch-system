import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/ai-dispatch-system/',
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    strictPort: true,
    open: true,
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
})
