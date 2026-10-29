import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { createLocalBackendMiddleware } from './src/lib/localBackend';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'local-realtime-backend',
      configureServer(server) {
        server.middlewares.use(createLocalBackendMiddleware());
      },
      configurePreviewServer(server) {
        server.middlewares.use(createLocalBackendMiddleware());
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    host: true,
    allowedHosts: true,
    cors: true,
    hmr: {
      overlay: false,
    },
  },
  preview: {
    port: parseInt(process.env.PORT || '5173'),
    host: true,
    allowedHosts: true,
    cors: true,
  },
});
