import React from 'react';
import { SubscriptionProvider } from './SubscriptionContext';

const SubscriptionContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <SubscriptionProvider>
      {children}
    </SubscriptionProvider>
  );
};

export default SubscriptionContextProvider;
