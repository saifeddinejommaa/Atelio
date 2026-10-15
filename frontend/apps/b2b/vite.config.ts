import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { existsSync, readFileSync } from 'node:fs'
import { defineConfig, loadEnv } from 'vite'

// HTTPS en local : Microsoft Entra n'accepte en http que « localhost » ; en https, chaque société garde son adresse
// (https://gmg78.localhost:3002, https://sej.localhost:3002). Certificat créé avec mkcert (voir README / .env.example).
const devCert = { cert: 'certs/dev-cert.pem', key: 'certs/dev-key.pem' }
const https = existsSync(devCert.cert) && existsSync(devCert.key)
  ? { cert: readFileSync(devCert.cert), key: readFileSync(devCert.key) }
  : undefined

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 3002,
      strictPort: true,
      https,
      // En dev, /api est relayé vers l'API .NET : pas de CORS à configurer.
      proxy: {
        '/api': { target: env.API_URL || 'http://localhost:5063', changeOrigin: true },
      },
    },
  }
})
