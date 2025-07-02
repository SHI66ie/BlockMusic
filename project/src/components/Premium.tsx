import React from 'react';
import { Check } from 'lucide-react';

interface PremiumProps {
  onSignupClick: () => void;
}

const Premium: React.FC<PremiumProps> = ({ onSignupClick }) => {
  // NGN to USDC conversion rate (approximate): 1 USD = 1600 NGN, so 1 USDC ≈ 1600 NGN
  // NGN 1,300 = ~$0.81 USDC, with 20% reduction = ~$0.65 USDC
  // NGN 1,700 = ~$1.06 USDC, with 20% reduction = ~$0.85 USDC  
  // NGN 2,000 = ~$1.25 USDC, with 20% reduction = ~$1.00 USDC

  const plans = [
    {
      name: 'Individual',
      freeMonths: 1,
      price: '$0.65 USDC',
      period: 'month',
      description: '1 Premium account',
      features: [
        'Cancel anytime',
        'Subscribe or one-time payment'
      ],
      terms: '$0 USDC for 1 month, then $0.65 USDC per month after. Offer only available if you haven\'t tried Premium before. Terms apply.',
      popular: false,
    },
    {
      name: 'Duo',
      freeMonths: 0,
      price: '$0.85 USDC',
      period: 'month',
      description: '2 Premium accounts',
      features: [
        'Cancel anytime',
        'For couples who reside at the same address. Terms apply.'
      ],
      terms: null,
      popular: true,
    },
    {
      name: 'Family',
      freeMonths: 0,
      price: '$1.00 USDC',
      period: 'month',
      description: 'Up to 6 Premium accounts',
      features: [
        'Control content marked as explicit',
        'Cancel anytime'
      ],
      terms: null,
      popular: false,
    },
  ];

  return (
    <section id="premium" className="py-20 bg-gradient-to-b from-black to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Choose your Premium
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Listen without limits. Cancel anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative bg-gray-800 rounded-2xl p-8 border-2 transition-all duration-300 hover:scale-105 ${
                plan.popular
                  ? 'border-purple-400 shadow-2xl shadow-purple-400/20'
                  : 'border-gray-700 hover:border-purple-400/50'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-purple-400 text-white px-4 py-2 rounded-full text-sm font-bold">
                    MOST POPULAR
                  </span>
                </div>
              )}

              {/* Free Month Badge */}
              {plan.freeMonths > 0 && (
                <div className="bg-purple-500 text-white text-sm font-bold px-3 py-1 rounded-full mb-4 inline-block">
                  $0 USDC for {plan.freeMonths} month
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-sm font-bold text-purple-400 mb-2">Premium</h3>
                <h4 className="text-2xl font-bold text-white mb-4">{plan.name}</h4>
                
                {plan.freeMonths > 0 ? (
                  <div className="mb-4">
                    <div className="text-lg font-bold text-white mb-1">
                      $0 USDC for {plan.freeMonths} month
                    </div>
                    <div className="text-gray-400">
                      {plan.price}/{plan.period} after
                    </div>
                  </div>
                ) : (
                  <div className="mb-4">
                    <div className="flex items-baseline">
                      <span className="text-2xl font-bold text-white">{plan.price}</span>
                      <span className="text-gray-400 ml-2">/ {plan.period}</span>
                    </div>
                  </div>
                )}

                <p className="text-white font-medium mb-6">{plan.description}</p>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start space-x-3">
                    <Check className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={onSignupClick}
                className={`w-full py-3 rounded-full font-bold transition-all duration-200 mb-6 ${
                  plan.popular
                    ? 'bg-purple-400 hover:bg-purple-300 text-white'
                    : 'bg-white hover:bg-gray-100 text-black'
                } hover:scale-105 transform`}
              >
                GET PREMIUM
              </button>

              {plan.terms && (
                <div className="text-xs text-gray-400 leading-relaxed">
                  {plan.terms}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-400 mb-4 text-sm">
            Terms and conditions apply. Free month offer only available if you haven't tried Premium before.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Premium;