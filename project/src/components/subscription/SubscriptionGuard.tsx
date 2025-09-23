import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface SubscriptionGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export const SubscriptionGuard: React.FC<SubscriptionGuardProps> = ({
  children,
  redirectTo = '/subscribe',
}) => {
  const { isSubscribed, isLoading, checkSubscription } = useSubscription();
  const location = useLocation();

  // If we're still loading the subscription status, show a loading spinner
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // If user is not subscribed, redirect to subscription page
  if (!isSubscribed) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // If user is subscribed, render the children
  return <>{children}</>;
};

// Create a version of the component with default props
export const withSubscription = (
  Component: React.ComponentType,
  redirectTo?: string
) => {
  return (props: any) => (
    <SubscriptionGuard redirectTo={redirectTo}>
      <Component {...props} />
    </SubscriptionGuard>
  );
};
