import React from 'react';
import { useAccount } from 'wagmi';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { SubscriptionPlan } from '../../constants/subscription';

interface SubscriptionButtonProps {
  plan: SubscriptionPlan;
  isCurrentPlan: boolean;
  isProcessing: boolean;
  onClick: (plan: SubscriptionPlan) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const SubscriptionButton: React.FC<SubscriptionButtonProps> = ({
  plan,
  isCurrentPlan,
  isProcessing,
  onClick,
  className = '',
  size = 'md',
}) => {
  const { isConnected } = useAccount();

  const sizeClasses = {
    sm: 'text-sm py-1.5 px-3',
    md: 'text-base py-2 px-4',
    lg: 'text-lg py-3 px-6',
  };

  const getButtonText = () => {
    if (!isConnected) return 'Connect Wallet';
    if (isProcessing) return 'Processing...';
    if (isCurrentPlan) return 'Current Plan';
    // Format the plan name for display (e.g., 'threeMonths' -> '3 Months')
    const displayName = plan === 'threeMonths' 
      ? '3 Months' 
      : plan.charAt(0).toUpperCase() + plan.slice(1);
    return `Subscribe ${displayName}`;
  };

  const getButtonClasses = () => {
    const baseClasses = 'rounded-lg font-medium transition-colors flex items-center justify-center';
    const sizeClass = sizeClasses[size] || sizeClasses.md;
    
    if (!isConnected) {
      return `${baseClasses} ${sizeClass} bg-blue-600 hover:bg-blue-700 text-white ${className}`;
    }
    
    if (isCurrentPlan) {
      return `${baseClasses} ${sizeClass} bg-gray-700 text-gray-400 cursor-not-allowed ${className}`;
    }
    
    return `${baseClasses} ${sizeClass} bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 ${className}`;
  };

  return (
    <button
      type="button"
      onClick={() => onClick(plan)}
      disabled={!isConnected || isCurrentPlan || isProcessing}
      className={getButtonClasses()}
    >
      {isProcessing ? (
        <>
          <LoadingSpinner size="sm" className="mr-2" />
          {getButtonText()}
        </>
      ) : (
        getButtonText()
      )}
    </button>
  );
};

export default SubscriptionButton;
