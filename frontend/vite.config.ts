import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), visualizer()],
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
      ignored: ['!**/node_modules/@drdata/ai-styles/**']
    }
  },
  build: {
    outDir: 'build',
    // Set to 3000 to avoid warning for faker-vendor chunk (dynamically loaded)
    chunkSizeWarningLimit: 3000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // React-related libraries
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor';
            }
            // Icons library (large)
            if (id.includes('react-icons')) {
              return 'icons-vendor';
            }
            // Markdown rendering libraries
            if (id.includes('react-markdown') || id.includes('remark-gfm')) {
              return 'markdown-vendor';
            }
            // Faker.js (large mock data library)
            if (id.includes('@faker-js/faker')) {
              return 'faker-vendor';
            }
            // HTTP and small utility libraries
            if (id.includes('axios') || id.includes('uuid') || id.includes('web-vitals')) {
              return 'utils-vendor';
            }
            // Everything else goes to vendor
            return 'vendor';
          }
        },
      },
    },
  },

  // Enable better HMR for linked packages
  // optimizeDeps: {
  //   exclude: ['@drdata/ai-styles']
  // }
})