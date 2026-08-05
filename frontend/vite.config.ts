import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const runtimeEnv = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};
const backendProxyTarget = runtimeEnv.DEMO_BACKEND_PROXY_URL ?? 'http://127.0.0.1:18000';

export default defineConfig({
  plugins: [react()],
  server: {
    host: 'localhost',
    port: 5173,
    proxy: {
      '/api': backendProxyTarget,
    },
  },
});
