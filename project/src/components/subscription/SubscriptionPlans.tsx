import React, { useState, useCallback, useMemo } from 'react';
import { useSubscription } from '../../hooks/useSubscription';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { FaCheck, FaMusic, FaCrown, FaGem, FaStar, FaExclamationTriangle } from 'react-icons/fa';
import { useAccount } from 'wagmi';
import { toast } from 'react-toastify';
import { SubscriptionButton } from './SubscriptionButton';

interface PlanCardProps {
  name: string;
  price: string;
  period: string;
  features: string[];
  isPopular?: boolean;
  onSelect: (plan: 'daily' | 'monthly' | 'yearly') => void;
  isSubscribing: boolean;
  isCurrentPlan?: boolean;
  icon: React.ReactNode;
  planId: 'daily' | 'monthly' | 'yearly';
}

const PlanCard: React.FC<PlanCardProps> = ({
  name,
  price,
  period,
  features,
  isPopular = false,
  onSelect,
  isSubscribing,
  isCurrentPlan = false,
  icon,
  planId,
}) => {
  return (
    <div
      className={`relative flex flex-col p-6 rounded-2xl bg-gray-800 border-2 ${
        isPopular ? 'border-purple-500' : 'border-gray-700'
      } transition-all hover:shadow-lg hover:shadow-purple-500/10 h-full`}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-purple-600 text-white text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap">
          MOST POPULAR
        </div>
      )}
      
      <div className="flex items-center justify-center mb-4">
        <div className="p-3 rounded-full bg-purple-500/10 text-purple-400">
          {icon}
        </div>
      </div>
      
      <h3 className="text-xl font-bold text-center mb-2">{name}</h3>
      
      <div className="text-center mb-6">
        <span className="text-4xl font-bold">${price}</span>
        <span className="text-gray-400">/{period}</span>
      </div>
      
      <ul className="space-y-3 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <FaCheck className="text-green-500 mr-2 mt-1 flex-shrink-0" />
            <span className="text-gray-300">{feature}</span>
          </li>
        ))}
      </ul>
      
      <div className="mt-auto">
        <SubscriptionButton
          plan={planId}
          isCurrentPlan={isCurrentPlan}
          isProcessing={isSubscribing}
          onClick={onSelect}
          className="w-full"
        />
      </div>
    </div>
  );
};

export const SubscriptionPlans: React.FC = () => {
  const { 
    subscribe, 
    isSubscribed, 
    currentPlan, 
    isLoading, 
    subscriptionData,
    error 
  } = useSubscription();
  
  const { isConnected, address } = useAccount();
  const [activePlan, setActivePlan] = useState<'daily' | 'monthly' | 'yearly' | null>(null);

  const handleSubscribe = useCallback(async (plan: 'daily' | 'monthly' | 'yearly') => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet to subscribe');
      return;
    }
    
    try {
      setActivePlan(plan);
      await subscribe(plan);
      toast.success(`Successfully subscribed to ${plan} plan!`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to subscribe';
      console.error('Subscription error:', message);
      toast.error(message);
    } finally {
      setActivePlan(null);
    }
  }, [isConnected, address, subscribe]);

  const plans = useMemo(() => [
    {
      id: 'daily' as const,
      name: 'Daily Pass',
      price: subscriptionData?.dailyPrice || '2.50',
      period: 'day',
      features: [
        '24-hour access to all content',
        'Ad-free experience',
        'Standard audio quality (192kbps)',
        'Cancel anytime',
      ],
      icon: <FaMusic className="w-6 h-6" />,
    },
    {
      id: 'monthly' as const,
      name: 'Monthly',
      price: subscriptionData?.monthlyPrice || '25.00',
      period: 'month',
      features: [
        'Unlimited access to all content',
        'Ad-free experience',
        'High audio quality (320kbps)',
        'Early access to new releases',
        'Save 10% compared to daily',
        'Download for offline listening',
      ],
      isPopular: true,
      icon: <FaCrown className="w-6 h-6" />,
    },
    {
      id: 'yearly' as const,
      name: 'Yearly',
      price: subscriptionData?.yearlyPrice || '255.00',
      period: 'year',
      features: [
        'Unlimited access to all content',
        'Ad-free experience',
        'Highest audio quality (FLAC)',
        'Exclusive content and events',
        'Save 15% compared to monthly',
        'Priority customer support',
        'Early access to concerts',
      ],
      icon: <FaGem className="w-6 h-6" />,
    },
  ], [subscriptionData]);

  if (isLoading && !currentPlan) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-gray-400">Loading subscription plans...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-800 text-red-200 p-4 rounded-lg flex items-start space-x-3">
        <FaExclamationTriangle className="text-red-400 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-medium">Error loading subscription plans</p>
          <p className="text-sm text-red-300">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 text-sm text-red-300 hover:text-white underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4">Choose Your Plan</h2>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Select the subscription plan that works best for you. Cancel or switch plans anytime.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => {
          const isCurrent = isSubscribed && currentPlan === plan.id;
          const isProcessing = activePlan === plan.id;
          
          return (
            <PlanCard
              key={plan.id}
              planId={plan.id}
              name={plan.name}
              price={plan.price}
              period={plan.period}
              features={plan.features}
              isPopular={plan.isPopular}
              isCurrentPlan={isCurrent}
              isSubscribing={isProcessing}
              onSelect={handleSubscribe}
              icon={plan.icon}
            />
          );
        })}
      </div>
      
      {isSubscribed && currentPlan && (
        <div className="mt-8 p-4 bg-gray-800/50 border border-gray-700 rounded-lg text-center">
          <div className="flex items-center justify-center text-yellow-400 mb-2">
            <FaStar className="mr-2" />
            <span className="font-medium">
              You're currently on the {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} plan
            </span>
          </div>
          <p className="text-sm text-gray-400 mb-3">
            Your subscription will automatically renew at the end of the billing period.
          </p>
          <div className="text-xs text-gray-500">
            <p>Need help? <a href="/support" className="text-purple-400 hover:underline">Contact support</a></p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionPlans;
