import React, { useEffect } from 'react';
import { SubscriptionProvider } from './SubscriptionContext';
import { useSubscription } from '../hooks/useSubscription';

// Separate component to handle the subscription check after the context is available
const SubscriptionInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { checkSubscription } = useSubscription();

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  return <>{children}</>;
};

const SubscriptionContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <SubscriptionProvider>
      <SubscriptionInitializer>
        {children}
      </SubscriptionInitializer>
    </SubscriptionProvider>
  );
};

export default SubscriptionContextProvider;
