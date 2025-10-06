import React, { useState } from 'react';
import { useSubscription } from '../../hooks/useSubscription';
import { SubscriptionPlan as PlanType } from '../../constants/subscription';
import { toast } from 'react-toastify';

interface PlanCardProps {
  id: PlanType;
  name: string;
  price: string;
  period: string;
  features: string[];
  isSelected: boolean;
  onSelect: (plan: PlanType) => void;
  isPopular?: boolean;
}

const PlanCard: React.FC<PlanCardProps> = ({
  id,
  name,
  price,
  period,
  features,
  isSelected,
  onSelect,
  isPopular = false,
}) => (
  <div
    className={`relative rounded-xl p-6 border-2 transition-all cursor-pointer ${
      isSelected
        ? 'border-purple-500 bg-gray-800/50'
        : 'border-gray-700 hover:border-purple-900/50'
    }`}
    onClick={() => onSelect(id)}
  >
    {isPopular && (
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full">
        POPULAR
      </div>
    )}
    <div className="text-center mb-4">
      <h3 className="text-xl font-bold mb-1">{name}</h3>
    </div>
    <div className="text-3xl font-bold mb-4 text-center">
      ${price}<span className="text-sm font-normal text-gray-400">/{period}</span>
    </div>
    <ul className="space-y-2">
      {features.map((feature, i) => (
        <li key={i} className="flex items-start">
          <span className="text-green-500 mr-2 mt-1">✓</span>
          <span className="text-sm text-gray-300">{feature}</span>
        </li>
      ))}
    </ul>
  </div>
);

const SubscriptionPlan: React.FC = () => {
  const { 
    subscribe, 
    isSubscribed, 
    subscriptionEnds, 
    subscriptionData,
    isLoading 
  } = useSubscription();
  
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('monthly');
  const [paymentMethod, setPaymentMethod] = useState<'usdc' | 'eth'>('eth');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubscribe = async () => {
    if (isLoading || isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      await subscribe(selectedPlan, paymentMethod);
      toast.success('Subscription successful!');
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error('Failed to subscribe. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubscribed && subscriptionEnds) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-green-900/20 border border-green-800 rounded-xl p-6 text-center">
          <h3 className="text-xl font-bold text-green-400 mb-2">Active Subscription</h3>
          <p className="text-green-200">
            Your subscription is active until {new Date(subscriptionEnds).toLocaleDateString()}
          </p>
        </div>
      </div>
    );
  }

  const plans = [
    {
      id: 'monthly' as PlanType,
      name: 'Monthly',
      price: subscriptionData?.formattedMonthlyPrice || '2.50',
      period: 'month',
      features: [
        'Unlimited access to all content', 
        'Ad-free experience', 
        'High audio quality (320kbps)'
      ]
    },
    {
      id: 'threeMonths' as PlanType,
      name: '3 Months',
      price: subscriptionData?.formattedThreeMonthsPrice || '6.75',
      period: '3 months',
      features: [
        'Save 10% compared to monthly', 
        'All monthly benefits', 
        'Priority customer support'
      ],
      isPopular: true
    },
    {
      id: 'yearly' as PlanType,
      name: 'Yearly',
      price: subscriptionData?.formattedYearlyPrice || '25.00',
      period: 'year',
      features: [
        'Save 15% compared to monthly', 
        'All 3-month benefits', 
        'Highest audio quality (FLAC)'
      ]
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">Choose Your Plan</h2>
        <p className="text-gray-400">Unlock all features with a subscription</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            id={plan.id}
            name={plan.name}
            price={plan.price}
            period={plan.period}
            features={plan.features}
            isSelected={selectedPlan === plan.id}
            onSelect={setSelectedPlan}
            isPopular={plan.isPopular}
          />
        ))}
      </div>

      <div className="bg-gray-800/50 rounded-xl p-6">
        <h3 className="text-xl font-bold mb-4">Payment Method</h3>
        <div className="flex space-x-4 mb-6">
          <button
            className={`px-4 py-2 rounded-lg ${
              paymentMethod === 'eth'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            onClick={() => setPaymentMethod('eth')}
          >
            Pay with ETH
          </button>
          <button
            className={`px-4 py-2 rounded-lg ${
              paymentMethod === 'usdc'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            onClick={() => setPaymentMethod('usdc')}
          >
            Pay with USDC
          </button>
        </div>

        <button
          className={`w-full py-3 px-6 rounded-lg font-bold ${
            isLoading || isSubmitting
              ? 'bg-purple-900 cursor-not-allowed'
              : 'bg-purple-600 hover:bg-purple-700'
          } text-white transition-colors`}
          onClick={handleSubscribe}
          disabled={isLoading || isSubmitting}
        >
          {isSubmitting ? 'Processing...' : 'Subscribe Now'}
        </button>
      </div>
    </div>
  );
};

export default SubscriptionPlan;
