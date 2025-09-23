import React, { useState } from 'react';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { formatDistanceToNow } from 'date-fns';

type Plan = 'daily' | 'monthly' | 'yearly';

const SubscriptionPlan: React.FC = () => {
  const { 
    subscribe, 
    isSubscribed, 
    subscriptionEnds, 
    subscriptionData,
    isLoading 
  } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<Plan>('monthly');
  const [paymentMethod, setPaymentMethod] = useState<'usdc' | 'eth'>('eth');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubscribe = async () => {
    if (isLoading || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await subscribe(selectedPlan, paymentMethod);
      // Show success message or redirect
    } catch (error) {
      console.error('Subscription error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubscribed && subscriptionEnds) {
    return (
      <div className="bg-green-900/20 border border-green-800 rounded-xl p-6 text-center">
        <h3 className="text-xl font-bold text-green-400 mb-2">Active Subscription</h3>
        <p className="text-green-200">
          Your subscription is active and will renew in {formatDistanceToNow(new Date(subscriptionEnds))}.
        </p>
      </div>
    );
  }

  const plans = [
    {
      id: 'daily',
      name: 'Daily Pass',
      price: subscriptionData.dailyPrice,
      description: 'Full access for 30 days',
      features: ['Unlimited streaming', 'High quality audio', 'Cancel anytime'],
      popular: false,
    },
    {
      id: 'monthly',
      name: 'Monthly',
      price: subscriptionData.monthlyPrice,
      description: 'Billed monthly (10% off)',
      features: ['Everything in Daily', 'Save 10%', 'Cancel anytime'],
      popular: true,
    },
    {
      id: 'yearly',
      name: 'Yearly',
      price: subscriptionData.yearlyPrice,
      description: 'Billed yearly (15% off)',
      features: ['Everything in Monthly', 'Save 15%', 'Best value'],
      popular: false,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">Choose Your Plan</h2>
        <p className="text-gray-400">Unlock all features with a subscription</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative rounded-xl p-6 border-2 transition-all ${
              selectedPlan === plan.id
                ? 'border-purple-500 bg-gray-800/50'
                : 'border-gray-700 hover:border-purple-900/50'
            } ${plan.popular ? 'ring-2 ring-purple-500/30' : ''}`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                POPULAR
              </div>
            )}
            
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
              <p className="text-gray-400 text-sm">{plan.description}</p>
            </div>
            
            <div className="text-center mb-6">
              <span className="text-4xl font-bold">${plan.price}</span>
              <span className="text-gray-400">/{plan.id === 'yearly' ? 'year' : 'month'}</span>
              {paymentMethod === 'eth' && (
                <div className="text-sm text-gray-400 mt-1">
                  ≈ {(parseFloat(plan.price) / subscriptionData.ethToUsd).toFixed(6)} ETH
                </div>
              )}
            </div>
            
            <ul className="space-y-3 mb-6">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-300">{feature}</span>
                </li>
              ))}
            </ul>
            
            <button
              onClick={() => setSelectedPlan(plan.id as Plan)}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                selectedPlan === plan.id
                  ? 'bg-purple-600 hover:bg-purple-700 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-200'
              }`}
            >
              {selectedPlan === plan.id ? 'Selected' : 'Select Plan'}
            </button>
          </div>
        ))}
      </div>

      {/* Payment Method */}
      <div className="bg-gray-800/50 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Payment Method</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setPaymentMethod('eth')}
            className={`flex items-center justify-center p-4 rounded-lg border-2 transition-colors ${
              paymentMethod === 'eth' ? 'border-purple-500 bg-purple-500/10' : 'border-gray-700 hover:border-purple-500/50'
            }`}
          >
            <img src="/eth-logo.png" alt="Ethereum" className="w-6 h-6 mr-2" />
            <span>Pay with ETH</span>
          </button>
          <button
            onClick={() => setPaymentMethod('usdc')}
            className={`flex items-center justify-center p-4 rounded-lg border-2 transition-colors ${
              paymentMethod === 'usdc' ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700 hover:border-blue-500/50'
            }`}
          >
            <img src="/usdc-logo.png" alt="USDC" className="w-6 h-6 mr-2" />
            <span>Pay with USDC</span>
          </button>
        </div>
      </div>

      {/* Subscribe Button */}
      <div className="text-center">
        <button
          onClick={handleSubscribe}
          disabled={isLoading || isSubmitting}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-4 px-8 rounded-full text-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading || isSubmitting ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </div>
          ) : (
            'Subscribe Now'
          )}
        </button>
        <p className="text-sm text-gray-400 mt-3">
          Cancel anytime. No hidden fees.
        </p>
      </div>
    </div>
  );
};

export default SubscriptionPlan;
