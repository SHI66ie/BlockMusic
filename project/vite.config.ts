import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import type { ConfigEnv } from 'vite';

// https://vitejs.dev/config/
export default defineConfig(({ mode }: ConfigEnv) => {
  // Load env file based on `mode` in the current directory and parent directories
  const env = loadEnv(mode, process.cwd(), '');
  
  const isProduction = mode === 'production';
  
  return {
    base: isProduction ? '/' : '/',
    plugins: [react()],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    // Make environment variables available to the client
    define: {
      'process.env': { ...env },
      'import.meta.env.MODE': JSON.stringify(mode),
    },
    // Server configuration
    server: {
      port: 3000,
      open: true,
      host: true, // Listen on all network interfaces
    },
    // Build configuration
    build: {
      outDir: 'dist',
      sourcemap: true,
      emptyOutDir: true,
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom', 'react-router-dom'],
            web3: ['wagmi', 'viem', '@rainbow-me/rainbowkit'],
          },
        },
      },
    },
  };
});
