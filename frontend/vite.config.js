import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// El "proxy" hace que el navegador vea frontend y API en el MISMO origen
// (localhost:5173). Así la cookie de sesión funciona con SameSite=Strict
// y no necesitamos habilitar CORS en el backend.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://127.0.0.1:3000',
      '/uploads': 'http://127.0.0.1:3000',
    },
  },
})
