import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import type { ConfigEnv } from 'vite';

// https://vitejs.dev/config/
export default defineConfig(({ mode }: ConfigEnv) => {
  // Load env file based on `mode` in the current directory and parent directories
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    // Make environment variables available to the client
    define: {
      'process.env': { ...env },
    },
    // Server configuration
    server: {
      port: 3000,
      open: true,
    },
    // Build configuration
    build: {
      outDir: 'dist',
      sourcemap: true,
    },
  };
});
