import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 3002,
      strictPort: true,
      // En dev, /api est relayé vers l'API .NET : pas de CORS à configurer.
      proxy: {
        '/api': { target: env.API_URL || 'http://localhost:5063', changeOrigin: true },
      },
    },
  }
})
