import React from 'react';
import { SubscriptionGuard } from '../components/subscription/SubscriptionGuard';

interface WithSubscriptionProps {
  redirectTo?: string;
}

export const withSubscription = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  redirectTo?: string
) => {
  const WithSubscription: React.FC<P & WithSubscriptionProps> = (props) => (
    <SubscriptionGuard redirectTo={redirectTo}>
      <WrappedComponent {...props as P} />
    </SubscriptionGuard>
  );

  // Set a display name for the HOC for better debugging
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';
  WithSubscription.displayName = `withSubscription(${displayName})`;

  return WithSubscription;
};
