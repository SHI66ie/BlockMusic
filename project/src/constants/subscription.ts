// Contract addresses - should be in .env file in production
export const SUBSCRIPTION_CONTRACT = process.env.REACT_APP_SUBSCRIPTION_CONTRACT || '0x...';

// Plan mappings
export const PLAN_TO_ENUM = {
  daily: 0,
  monthly: 1,
  yearly: 2
} as const;

export const ENUM_TO_PLAN: Record<number, 'daily' | 'monthly' | 'yearly' | null> = {
  0: 'daily',
  1: 'monthly',
  2: 'yearly'
};
