import { Suspense } from 'react';
import { RouterProvider, createBrowserRouter, Outlet } from 'react-router-dom';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { QueryClientProvider } from '@tanstack/react-query';
import { config, queryClient, rainbowKitConfig } from './config/web3';
import AppContent from './AppContent';
import { Home } from './pages/Home';
import ArtistDashboard from './pages/ArtistDashboard';

// Layout component that includes the header and footer
const Layout = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <AppContent />
      <main className="pt-16">
        <Outlet />
      </main>
    </div>
  );
};

// Create router outside of the component to prevent recreation on re-renders
const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        path: "/",
        element: <Home />,
      },
      {
        path: "/artist",
        element: <ArtistDashboard />,
      },
    ],
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