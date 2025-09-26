import React from 'react';
import { useSubscription } from '../../hooks/useSubscriptionHook';
import { formatDistanceToNow } from 'date-fns';
import { FaCrown, FaExclamationTriangle } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import styles from './SubscriptionStatus.module.css';

export const SubscriptionStatus: React.FC = () => {
  const { isSubscribed, subscriptionEnds, currentPlan, isLoading } = useSubscription();

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-6 bg-gray-700 rounded w-32"></div>
      </div>
    );
  }

  if (!isSubscribed || !subscriptionEnds) {
    return (
      <div className="bg-yellow-900/30 border border-yellow-800 text-yellow-400 px-4 py-2 rounded-lg flex items-center">
        <FaExclamationTriangle className="mr-2 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium">No active subscription</p>
          <p className="text-xs text-yellow-500">
            <Link to="/subscribe" className="underline hover:text-yellow-400">
              Subscribe now
            </Link>{' '}
            to access all features
          </p>
        </div>
      </div>
    );
  }

  const planNames = {
    daily: 'Daily Pass',
    monthly: 'Monthly',
    yearly: 'Yearly',
  };

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center">
          <div className="bg-purple-600/20 text-purple-400 rounded-full w-10 h-10 flex items-center justify-center mr-3">
            <FaCrown className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-medium text-white">{planNames[currentPlan as keyof typeof planNames] || 'Premium'}</h4>
            <p className="text-sm text-gray-400">
              {isSubscribed ? 'Active' : 'Expired'} • Renews in {formatDistanceToNow(new Date(subscriptionEnds))}
            </p>
          </div>
        </div>
        <Link
          to="/subscribe"
          className="text-sm bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded-md transition-colors"
        >
          Manage
        </Link>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="flex justify-between text-sm text-gray-400 mb-1">
          <span>Plan renews</span>
          <span className="text-white">
            {new Date(subscriptionEnds).toLocaleDateString()}
          </span>
        </div>
        <div className={styles.progressBar}>
          <div className="flex items-center justify-between">
            <div className="text-right">
              <span className="text-xs font-semibold inline-block text-purple-400">
                {Math.round((new Date(subscriptionEnds).getTime() - Date.now()) / (24 * 60 * 60 * 1000))} days left
              </span>
            </div>
          </div>
          <div className={styles.progressContainer}>
            <div 
              className={`${styles.progressFill}`}
              data-width={Math.max(5, Math.min(100, Math.round((new Date(subscriptionEnds).getTime() - Date.now()) / (30 * 24 * 60 * 60 * 1000) * 100)))}
              role="progressbar"
              aria-label={`Subscription progress: ${Math.round((new Date(subscriptionEnds).getTime() - Date.now()) / (30 * 24 * 60 * 60 * 1000))}% complete`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionStatus;
