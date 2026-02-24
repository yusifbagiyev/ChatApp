import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Vite dev proxy — local frontend → remote backend
    // Brauzer bütün request-ləri localhost:5173-ə göndərir (same-origin → cookie işləyir)
    // Vite arxa planda remote backend-ə yönləndirir (server-side, CORS/cookie problemi yoxdur)
    proxy: {
      '/api': {
        target: 'http://10.0.1.60:7000',
        changeOrigin: true,
      },
      '/hubs': {
        target: 'http://10.0.1.60:7000',
        changeOrigin: true,
        ws: true, // WebSocket (SignalR) dəstəyi
      },
    },
  },
})
