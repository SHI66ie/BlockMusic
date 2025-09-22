import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// https://vitejs.dev/config/
export default defineConfig(({ mode }: { mode: string }) => {
  // Load env file based on `mode` in the current directory and parent directories
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    base: process.env.NODE_ENV === 'production' ? '/' : '/',
    server: {
      port: 3000,
      strictPort: true,
      host: true,
      open: true,
    },
    plugins: [
      react(),
      // Polyfill Node.js core modules for browser compatibility
      nodePolyfills({
        // To exclude specific polyfills, add them to this list
        exclude: [],
        // Whether to polyfill `node:` protocol imports
        protocolImports: true,
      }),
    ],
    define: {
      'process.env': { ...env },
      'import.meta.env.MODE': JSON.stringify(mode),
      global: 'globalThis',  // Fix for global object
    },
    // Server configuration
    server: {
      port: 3000,
      open: true,
      host: true, // Listen on all network interfaces
    },
    // Build configuration
    build: {
      target: 'esnext',
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
      commonjsOptions: {
        transformMixedEsModules: true,
      },
    },
    optimizeDeps: {
      esbuildOptions: {
        // Node.js global to browser globalThis
        define: {
          global: 'globalThis',
        },
      },
      exclude: ['lucide-react'],
    },
  };
});
