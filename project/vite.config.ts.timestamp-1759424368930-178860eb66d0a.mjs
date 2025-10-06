// vite.config.ts
import { defineConfig, loadEnv } from "file:///C:/Users/DELL/Downloads/BLockMusic(Pricesadj)/project/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/DELL/Downloads/BLockMusic(Pricesadj)/project/node_modules/@vitejs/plugin-react/dist/index.mjs";
import { nodePolyfills } from "file:///C:/Users/DELL/Downloads/BLockMusic(Pricesadj)/project/node_modules/vite-plugin-node-polyfills/dist/index.js";
var vite_config_default = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    base: process.env.NODE_ENV === "production" ? "/" : "/",
    plugins: [
      react({
        babel: {
          plugins: [
            ["@babel/plugin-transform-react-jsx", { runtime: "automatic" }]
          ]
        }
      }),
      // Polyfill Node.js core modules for browser compatibility
      nodePolyfills({
        // To exclude specific polyfills, add them to this list
        exclude: [],
        // Whether to polyfill `node:` protocol imports
        protocolImports: true
      })
    ],
    define: {
      "process.env": {
        ...env,
        VITE_ALCHEMY_API_KEY: JSON.stringify(env.VITE_ALCHEMY_API_KEY || ""),
        VITE_WALLET_CONNECT_PROJECT_ID: JSON.stringify(env.VITE_WALLET_CONNECT_PROJECT_ID || "")
      },
      "import.meta.env.MODE": JSON.stringify(mode),
      global: "globalThis"
      // Fix for global object
    },
    server: {
      port: 3e3,
      strictPort: true,
      host: true,
      open: true,
      headers: {
        "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self' https://*.alchemy.com https://sepolia.base.org;"
      }
    },
    // Build configuration
    build: {
      target: "esnext",
      outDir: "dist",
      sourcemap: true,
      emptyOutDir: true,
      rollupOptions: {
        output: {
          manualChunks: {
            react: ["react", "react-dom", "react-router-dom"],
            web3: ["wagmi", "viem", "@rainbow-me/rainbowkit"]
          }
        }
      },
      commonjsOptions: {
        transformMixedEsModules: true
      }
    },
    optimizeDeps: {
      esbuildOptions: {
        // Node.js global to browser globalThis
        define: {
          global: "globalThis"
        }
      },
      exclude: ["lucide-react"]
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxERUxMXFxcXERvd25sb2Fkc1xcXFxCTG9ja011c2ljKFByaWNlc2FkailcXFxccHJvamVjdFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcREVMTFxcXFxEb3dubG9hZHNcXFxcQkxvY2tNdXNpYyhQcmljZXNhZGopXFxcXHByb2plY3RcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL0RFTEwvRG93bmxvYWRzL0JMb2NrTXVzaWMoUHJpY2VzYWRqKS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnLCBsb2FkRW52IH0gZnJvbSAndml0ZSc7XG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnO1xuaW1wb3J0IHsgbm9kZVBvbHlmaWxscyB9IGZyb20gJ3ZpdGUtcGx1Z2luLW5vZGUtcG9seWZpbGxzJztcblxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBtb2RlIH06IHsgbW9kZTogc3RyaW5nIH0pID0+IHtcbiAgLy8gTG9hZCBlbnYgZmlsZSBiYXNlZCBvbiBgbW9kZWAgaW4gdGhlIGN1cnJlbnQgZGlyZWN0b3J5IGFuZCBwYXJlbnQgZGlyZWN0b3JpZXNcbiAgY29uc3QgZW52ID0gbG9hZEVudihtb2RlLCBwcm9jZXNzLmN3ZCgpLCAnJyk7XG4gIFxuICByZXR1cm4ge1xuICAgIGJhc2U6IHByb2Nlc3MuZW52Lk5PREVfRU5WID09PSAncHJvZHVjdGlvbicgPyAnLycgOiAnLycsXG4gICAgcGx1Z2luczogW1xuICAgICAgcmVhY3Qoe1xuICAgICAgICBiYWJlbDoge1xuICAgICAgICAgIHBsdWdpbnM6IFtcbiAgICAgICAgICAgIFsnQGJhYmVsL3BsdWdpbi10cmFuc2Zvcm0tcmVhY3QtanN4JywgeyBydW50aW1lOiAnYXV0b21hdGljJyB9XVxuICAgICAgICAgIF1cbiAgICAgICAgfVxuICAgICAgfSksXG4gICAgICAvLyBQb2x5ZmlsbCBOb2RlLmpzIGNvcmUgbW9kdWxlcyBmb3IgYnJvd3NlciBjb21wYXRpYmlsaXR5XG4gICAgICBub2RlUG9seWZpbGxzKHtcbiAgICAgICAgLy8gVG8gZXhjbHVkZSBzcGVjaWZpYyBwb2x5ZmlsbHMsIGFkZCB0aGVtIHRvIHRoaXMgbGlzdFxuICAgICAgICBleGNsdWRlOiBbXSxcbiAgICAgICAgLy8gV2hldGhlciB0byBwb2x5ZmlsbCBgbm9kZTpgIHByb3RvY29sIGltcG9ydHNcbiAgICAgICAgcHJvdG9jb2xJbXBvcnRzOiB0cnVlLFxuICAgICAgfSksXG4gICAgXSxcbiAgICBkZWZpbmU6IHtcbiAgICAgICdwcm9jZXNzLmVudic6IHtcbiAgICAgICAgLi4uZW52LFxuICAgICAgICBWSVRFX0FMQ0hFTVlfQVBJX0tFWTogSlNPTi5zdHJpbmdpZnkoZW52LlZJVEVfQUxDSEVNWV9BUElfS0VZIHx8ICcnKSxcbiAgICAgICAgVklURV9XQUxMRVRfQ09OTkVDVF9QUk9KRUNUX0lEOiBKU09OLnN0cmluZ2lmeShlbnYuVklURV9XQUxMRVRfQ09OTkVDVF9QUk9KRUNUX0lEIHx8ICcnKVxuICAgICAgfSxcbiAgICAgICdpbXBvcnQubWV0YS5lbnYuTU9ERSc6IEpTT04uc3RyaW5naWZ5KG1vZGUpLFxuICAgICAgZ2xvYmFsOiAnZ2xvYmFsVGhpcycsICAvLyBGaXggZm9yIGdsb2JhbCBvYmplY3RcbiAgICB9LFxuICAgIHNlcnZlcjoge1xuICAgICAgcG9ydDogMzAwMCxcbiAgICAgIHN0cmljdFBvcnQ6IHRydWUsXG4gICAgICBob3N0OiB0cnVlLFxuICAgICAgb3BlbjogdHJ1ZSxcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgJ0NvbnRlbnQtU2VjdXJpdHktUG9saWN5JzogXCJkZWZhdWx0LXNyYyAnc2VsZic7IHNjcmlwdC1zcmMgJ3NlbGYnICd1bnNhZmUtZXZhbCcgJ3Vuc2FmZS1pbmxpbmUnOyBzdHlsZS1zcmMgJ3NlbGYnICd1bnNhZmUtaW5saW5lJzsgaW1nLXNyYyAnc2VsZicgZGF0YTo7IGZvbnQtc3JjICdzZWxmJyBkYXRhOjsgY29ubmVjdC1zcmMgJ3NlbGYnIGh0dHBzOi8vKi5hbGNoZW15LmNvbSBodHRwczovL3NlcG9saWEuYmFzZS5vcmc7XCJcbiAgICAgIH1cbiAgICB9LFxuICAgIC8vIEJ1aWxkIGNvbmZpZ3VyYXRpb25cbiAgICBidWlsZDoge1xuICAgICAgdGFyZ2V0OiAnZXNuZXh0JyxcbiAgICAgIG91dERpcjogJ2Rpc3QnLFxuICAgICAgc291cmNlbWFwOiB0cnVlLFxuICAgICAgZW1wdHlPdXREaXI6IHRydWUsXG4gICAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICAgIG91dHB1dDoge1xuICAgICAgICAgIG1hbnVhbENodW5rczoge1xuICAgICAgICAgICAgcmVhY3Q6IFsncmVhY3QnLCAncmVhY3QtZG9tJywgJ3JlYWN0LXJvdXRlci1kb20nXSxcbiAgICAgICAgICAgIHdlYjM6IFsnd2FnbWknLCAndmllbScsICdAcmFpbmJvdy1tZS9yYWluYm93a2l0J10sXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICBjb21tb25qc09wdGlvbnM6IHtcbiAgICAgICAgdHJhbnNmb3JtTWl4ZWRFc01vZHVsZXM6IHRydWUsXG4gICAgICB9LFxuICAgIH0sXG4gICAgb3B0aW1pemVEZXBzOiB7XG4gICAgICBlc2J1aWxkT3B0aW9uczoge1xuICAgICAgICAvLyBOb2RlLmpzIGdsb2JhbCB0byBicm93c2VyIGdsb2JhbFRoaXNcbiAgICAgICAgZGVmaW5lOiB7XG4gICAgICAgICAgZ2xvYmFsOiAnZ2xvYmFsVGhpcycsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgZXhjbHVkZTogWydsdWNpZGUtcmVhY3QnXSxcbiAgICB9LFxuICB9O1xufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQTZWLFNBQVMsY0FBYyxlQUFlO0FBQ25ZLE9BQU8sV0FBVztBQUNsQixTQUFTLHFCQUFxQjtBQUc5QixJQUFPLHNCQUFRLGFBQWEsQ0FBQyxFQUFFLEtBQUssTUFBd0I7QUFFMUQsUUFBTSxNQUFNLFFBQVEsTUFBTSxRQUFRLElBQUksR0FBRyxFQUFFO0FBRTNDLFNBQU87QUFBQSxJQUNMLE1BQU0sUUFBUSxJQUFJLGFBQWEsZUFBZSxNQUFNO0FBQUEsSUFDcEQsU0FBUztBQUFBLE1BQ1AsTUFBTTtBQUFBLFFBQ0osT0FBTztBQUFBLFVBQ0wsU0FBUztBQUFBLFlBQ1AsQ0FBQyxxQ0FBcUMsRUFBRSxTQUFTLFlBQVksQ0FBQztBQUFBLFVBQ2hFO0FBQUEsUUFDRjtBQUFBLE1BQ0YsQ0FBQztBQUFBO0FBQUEsTUFFRCxjQUFjO0FBQUE7QUFBQSxRQUVaLFNBQVMsQ0FBQztBQUFBO0FBQUEsUUFFVixpQkFBaUI7QUFBQSxNQUNuQixDQUFDO0FBQUEsSUFDSDtBQUFBLElBQ0EsUUFBUTtBQUFBLE1BQ04sZUFBZTtBQUFBLFFBQ2IsR0FBRztBQUFBLFFBQ0gsc0JBQXNCLEtBQUssVUFBVSxJQUFJLHdCQUF3QixFQUFFO0FBQUEsUUFDbkUsZ0NBQWdDLEtBQUssVUFBVSxJQUFJLGtDQUFrQyxFQUFFO0FBQUEsTUFDekY7QUFBQSxNQUNBLHdCQUF3QixLQUFLLFVBQVUsSUFBSTtBQUFBLE1BQzNDLFFBQVE7QUFBQTtBQUFBLElBQ1Y7QUFBQSxJQUNBLFFBQVE7QUFBQSxNQUNOLE1BQU07QUFBQSxNQUNOLFlBQVk7QUFBQSxNQUNaLE1BQU07QUFBQSxNQUNOLE1BQU07QUFBQSxNQUNOLFNBQVM7QUFBQSxRQUNQLDJCQUEyQjtBQUFBLE1BQzdCO0FBQUEsSUFDRjtBQUFBO0FBQUEsSUFFQSxPQUFPO0FBQUEsTUFDTCxRQUFRO0FBQUEsTUFDUixRQUFRO0FBQUEsTUFDUixXQUFXO0FBQUEsTUFDWCxhQUFhO0FBQUEsTUFDYixlQUFlO0FBQUEsUUFDYixRQUFRO0FBQUEsVUFDTixjQUFjO0FBQUEsWUFDWixPQUFPLENBQUMsU0FBUyxhQUFhLGtCQUFrQjtBQUFBLFlBQ2hELE1BQU0sQ0FBQyxTQUFTLFFBQVEsd0JBQXdCO0FBQUEsVUFDbEQ7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUFBLE1BQ0EsaUJBQWlCO0FBQUEsUUFDZix5QkFBeUI7QUFBQSxNQUMzQjtBQUFBLElBQ0Y7QUFBQSxJQUNBLGNBQWM7QUFBQSxNQUNaLGdCQUFnQjtBQUFBO0FBQUEsUUFFZCxRQUFRO0FBQUEsVUFDTixRQUFRO0FBQUEsUUFDVjtBQUFBLE1BQ0Y7QUFBQSxNQUNBLFNBQVMsQ0FBQyxjQUFjO0FBQUEsSUFDMUI7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
