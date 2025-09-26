import { useContext } from 'react';
import { SubscriptionContext } from './SubscriptionContext';
import { SubscriptionContextType } from '../types/subscription';

export const useSubscriptionContext = (): SubscriptionContextType => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

export { useSubscriptionContext as useSubscription };
