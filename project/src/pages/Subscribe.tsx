import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { SubscriptionPlans } from '../components/subscription/SubscriptionPlans';
import { useSubscription } from '../hooks/useSubscription';

const Subscribe: React.FC = () => {
  const { isConnected } = useAccount();
  const { isSubscribed } = useSubscription();
  const location = useLocation();
  const navigate = useNavigate();
  // Define the expected shape of the location state
  interface LocationState {
    from?: {
      pathname: string;
    };
  }

  const from = (location.state as LocationState)?.from?.pathname || '/';

  // If user is already subscribed, redirect them back
  if (isSubscribed) {
    navigate(from, { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Upgrade to Premium</h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Unlock all features and support independent artists with a BlockMusic subscription
          </p>
        </div>

        {!isConnected ? (
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold mb-4">Connect your wallet to subscribe</h2>
            <p className="text-gray-400 mb-6">
              You need to connect your wallet to view subscription options
            </p>
            <button
              onClick={() => navigate('/connect')}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-full transition-colors"
            >
              Connect Wallet
            </button>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto">
            <SubscriptionPlans />
            
            <div className="mt-12 bg-gray-800/50 rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-4">What's included?</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-lg mb-3">For Listeners</h4>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Unlimited streaming of all premium content</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>High quality audio (320kbps)</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Download tracks for offline listening</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Early access to new releases</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-lg mb-3">For Artists</h4>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Earn 90% of subscription revenue</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Direct payments in crypto</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Analytics dashboard</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Customizable profile</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-8 text-center text-sm text-gray-400">
              <p>By subscribing, you agree to our <Link to="/terms" className="text-purple-400 hover:underline">Terms of Service</Link> and <Link to="/privacy" className="text-purple-400 hover:underline">Privacy Policy</Link>.</p>
              <p className="mt-2">Cancel anytime. No hidden fees.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Subscribe;
