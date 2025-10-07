import { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AppContent from './AppContent';
import { Home } from './pages/Home';
import Marketplace from './pages/Marketplace';
import Create from './pages/Create';
import Profile from './pages/Profile';
import Subscribe from './pages/Subscribe';
import Upload from './pages/Upload';
import SubscriptionContextProvider from './contexts/SubscriptionContextProvider';
import { SubscriptionGuard } from './components/subscription/SubscriptionGuard';

// Type for component props
interface ComponentProps {
  [key: string]: unknown;
}

// Wrap components that require subscription with this HOC
const withSubscription = <P extends ComponentProps>(
  Component: React.ComponentType<P>
): React.FC<P> => {
  const WrappedComponent: React.FC<P> = (props) => (
    <SubscriptionGuard>
      <Component {...props} />
    </SubscriptionGuard>
  );
  return WrappedComponent;
};

// Protected components
const ProtectedMarketplace = withSubscription(Marketplace);
const ProtectedCreate = withSubscription(Create);
const ProtectedProfile = withSubscription(Profile);
const ProtectedUpload = withSubscription(Upload);

function App() {
  return (
    <SubscriptionContextProvider>
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen bg-gray-900">
          <div className="text-white text-xl">Loading BlockMusic...</div>
        </div>
      }>
        <Router>
          <Routes>
            <Route path="/" element={<AppContent />}>
              <Route index element={<Navigate to="/home" replace />} />
              <Route path="home" element={<Home />} />
              <Route path="marketplace" element={<ProtectedMarketplace />} />
              <Route path="upload" element={<ProtectedUpload />} />
              <Route path="create" element={<ProtectedCreate />} />
              <Route path="profile" element={<ProtectedProfile />} />
              <Route path="subscribe" element={<Subscribe />} />
              <Route path="*" element={<Navigate to="/home" replace />} />
            </Route>          </Routes>
        </Router>
      </Suspense>
    </SubscriptionContextProvider>
  );
}

export default App;