import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
    watch: {
      // Watch for changes in the docomo library
      ignored: ['!**/node_modules/@drdata/docomo/**']
    }
  },
  build: {
    outDir: 'build',
  },
  // Enable better HMR for linked packages
  optimizeDeps: {
    exclude: ['@drdata/docomo']
  }
})