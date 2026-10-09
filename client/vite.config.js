import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // In development, /api/* is forwarded to the Express API so no CORS setup is needed.
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        // When the API is down or still connecting to MongoDB, reply with a clean 503
        // instead of letting Vite dump a stack trace for every request.
        configure: (proxy) => {
          proxy.removeAllListeners('error');
          proxy.on('error', (err, req, res) => {
            console.warn(`[proxy] API not reachable on :4000 (${err.code || err.message}) — is the server running?`);
            if (!res.headersSent && typeof res.writeHead === 'function') {
              res.writeHead(503, { 'Content-Type': 'application/json' });
            }
            res.end(JSON.stringify({ success: false, message: 'Unable to connect to the server. Please try again.' }));
          });
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
  },
});
