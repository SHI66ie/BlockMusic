import React, { useEffect } from 'react';
import { SubscriptionProvider, useSubscription } from './SubscriptionContext';

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
