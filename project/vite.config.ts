import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// https://vitejs.dev/config/
export default defineConfig(({ mode }: { mode: string }) => {
  // Load env file based on `mode` in the current directory and parent directories
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    base: process.env.NODE_ENV === 'production' ? '/' : '/',
    plugins: [
      react({
        babel: {
          plugins: [
            ['@babel/plugin-transform-react-jsx', { runtime: 'automatic' }]
          ]
        }
      }),
      // Polyfill Node.js core modules for browser compatibility
      nodePolyfills({
        // To exclude specific polyfills, add them to this list
        exclude: [],
        // Whether to polyfill `node:` protocol imports
        protocolImports: true,
      }),
    ],
    define: {
      'process.env': {
        ...env,
        VITE_ALCHEMY_API_KEY: JSON.stringify(env.VITE_ALCHEMY_API_KEY || ''),
        VITE_WALLET_CONNECT_PROJECT_ID: JSON.stringify(env.VITE_WALLET_CONNECT_PROJECT_ID || '')
      },
      'import.meta.env.MODE': JSON.stringify(mode),
      global: 'globalThis',  // Fix for global object
    },
    server: {
      port: 3000,
      strictPort: true,
      host: true,
      open: true,
      headers: {
        'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self' https://*.alchemy.com https://sepolia.base.org;"
      }
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
