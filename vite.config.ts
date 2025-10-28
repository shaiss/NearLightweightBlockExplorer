import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Environment variables with defaults
const FRONTEND_PORT = parseInt(process.env.FRONTEND_PORT || '3000', 10);
const PROXY_PORT = parseInt(process.env.PROXY_PORT || '3001', 10);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
  server: {
    port: FRONTEND_PORT,
    proxy: {
      // Proxy RPC requests to bypass CORS - forwards to standalone proxy server
      '/rpc-proxy': {
        target: `http://localhost:${PROXY_PORT}`,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/rpc-proxy/, ''),
      },
    },
  },
});

