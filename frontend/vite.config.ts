import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig, loadEnv } from 'vite';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env vars from the root directory (parent of frontend/)
  const env = loadEnv(mode, '../', '');
  const apiUrl = env.VITE_API_URL || 'http://localhost:5600';
  
  console.log(`[DEBUG] Vite proxy target: ${apiUrl}`);
  
  return {
    plugins: [react(), visualizer()],
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: apiUrl,
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
    outDir: mode === 'debug' ? 'build-debug' : 'build',
    chunkSizeWarningLimit: 1000,
    minify: mode === 'debug' ? false : 'esbuild',
    sourcemap: mode === 'debug' ? true : false,
    target: 'es2020', // Ensure compatibility with Node.js v24
    rollupOptions: {
      external: [],
      output: {
        format: 'es',
        // No code splitting - single bundle approach for Node.js v24 compatibility
        manualChunks: mode === 'debug' ? undefined : undefined,
      },
    },
  },
  // Optimize dependencies and ensure proper resolution
  optimizeDeps: {
    include: ['react', 'react-dom', 'react/jsx-runtime'],
    force: true
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@members': path.resolve(__dirname, './src/members'),
      '@admin': path.resolve(__dirname, './src/admin'),
      '@anonymous': path.resolve(__dirname, './src/anonymous')
    },
    dedupe: ['react', 'react-dom']
  }

  // Enable better HMR for linked packages
  // optimizeDeps: {
  //   exclude: ['@drdata/ai-styles']
  // }
}});