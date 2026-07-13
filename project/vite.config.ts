import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in current directory and parent directories
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
        VITE_WALLET_CONNECT_PROJECT_ID: JSON.stringify(env.VITE_WALLET_CONNECT_PROJECT_ID || ''),
        VITE_REVENUE_DISTRIBUTION_CONTRACT: JSON.stringify(env.VITE_REVENUE_DISTRIBUTION_CONTRACT || '0xa61eAfed9c3B7cF6575FB7E35E18ABe425306f02'),
        VITE_MUSIC_NFT_CONTRACT: JSON.stringify(env.VITE_MUSIC_NFT_CONTRACT || '0xF29A2DCC8877fac176C36F30d6245C4320e90841'),
        VITE_SUBSCRIPTION_CONTRACT: JSON.stringify(env.VITE_SUBSCRIPTION_CONTRACT || '0x4371eE0797e2590d2650395FDc8666795DceB92A'),
        VITE_ETH_SUBSCRIPTION_CONTRACT: JSON.stringify(env.VITE_ETH_SUBSCRIPTION_CONTRACT || '0x1d336b8cCA220d596f0e2Fd368fa2424dcbB987A'),
        VITE_USDC_TOKEN: JSON.stringify(env.VITE_USDC_TOKEN || '0x036CbD53842c5426634e7929541eC2318f3dCF7e'),
        VITE_PLAY_TRACKER_API: JSON.stringify(env.VITE_PLAY_TRACKER_API || ''),
      },
      'import.meta.env.MODE': JSON.stringify(mode),
      'import.meta.env.VITE_REVENUE_DISTRIBUTION_CONTRACT': JSON.stringify(env.VITE_REVENUE_DISTRIBUTION_CONTRACT || '0xa61eAfed9c3B7cF6575FB7E35E18ABe425306f02'),
      'import.meta.env.VITE_MUSIC_NFT_CONTRACT': JSON.stringify(env.VITE_MUSIC_NFT_CONTRACT || '0xF29A2DCC8877fac176C36F30d6245C4320e90841'),
      'import.meta.env.VITE_SUBSCRIPTION_CONTRACT': JSON.stringify(env.VITE_SUBSCRIPTION_CONTRACT || '0x4371eE0797e2590d2650395FDc8666795DceB92A'),
      'import.meta.env.VITE_ETH_SUBSCRIPTION_CONTRACT': JSON.stringify(env.VITE_ETH_SUBSCRIPTION_CONTRACT || '0x1d336b8cCA220d596f0e2Fd368fa2424dcbB987A'),
      'import.meta.env.VITE_USDC_TOKEN': JSON.stringify(env.VITE_USDC_TOKEN || '0x036CbD53842c5426634e7929541eC2318f3dCF7e'),
      'import.meta.env.VITE_PLAY_TRACKER_API': JSON.stringify(env.VITE_PLAY_TRACKER_API || ''),
      global: 'globalThis',  // Fix for global object
    },
    server: {
      port: 3000,
      strictPort: true,
      host: true,
      open: true,
      headers: {
        'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' connect-src 'self' https://*.alchemy.com https://sepolia.base.org;"
      }
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
