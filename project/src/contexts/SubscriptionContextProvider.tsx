import React, { useEffect } from 'react';
import { useSubscriptionContext } from './useSubscription';
import { SubscriptionProvider } from './SubscriptionContext';

const SubscriptionContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { checkSubscription } = useSubscriptionContext();

  // Initial load
  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  return <SubscriptionProvider>{children}</SubscriptionProvider>;
};

export default SubscriptionContextProvider;
