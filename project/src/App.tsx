import { Suspense } from 'react';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { QueryClientProvider } from '@tanstack/react-query';
import { config, queryClient, rainbowKitConfig } from './config/web3';
import AppContent from './AppContent';

// Create router outside of the component to prevent recreation on re-renders
const router = createBrowserRouter([
  {
    path: "/",
    element: <AppContent />,
  },
]);

function App() {
  console.log('App component rendering');
  
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider {...rainbowKitConfig}>
          <Suspense fallback={<div>Loading BlockMusic...</div>}>
            <RouterProvider router={router} />
          </Suspense>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;