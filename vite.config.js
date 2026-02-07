import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  base: command === 'serve' ? '/' : '/ayto/',
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'solver': ['./src/solver/solver.js'],
          'auth': ['./src/context/AuthContext.jsx'],
          'season': ['./src/context/SeasonContext.jsx'],
        }
      }
    },
    chunkSizeWarningLimit: 600,
    sourcemap: false
  }
}))
