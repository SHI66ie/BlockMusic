# Subscription System for BlockMusic

This document outlines the subscription system implementation for BlockMusic, including smart contracts, deployment instructions, and frontend integration.

## Smart Contract Overview

The subscription system is built on the Ethereum blockchain using Solidity and consists of the following components:

1. **Subscription.sol**: The main contract that handles subscription logic, payments, and access control.
2. **Price Feed Integration**: Uses Chainlink's price feeds for ETH/USD conversion.
3. **Payment Methods**: Supports both native ETH and USDC stablecoin payments.

## Deployment Instructions

### Prerequisites

1. Node.js (v16+) and npm
2. Hardhat
3. A wallet with test ETH on Base Sepolia
4. BaseScan API key for contract verification

### Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file in the project root with the following variables:
   ```
   PRIVATE_KEY=your_private_key
   ALCHEMY_BASE_SEPOLIA_RPC_URL=your_alchemy_url
   BASESCAN_API_KEY=your_basescan_api_key
   ETHERSCAN_API_KEY=your_etherscan_api_key
   ```

3. Compile the contracts:
   ```bash
   npx hardhat compile
   ```

### Deploying the Contract

1. Run the deployment script:
   ```bash
   npx hardhat run scripts/deploy-subscription.ts --network baseSepolia
   ```

2. After deployment, update the frontend with the new contract address in the `.env` file:
   ```
   NEXT_PUBLIC_SUBSCRIPTION_CONTRACT=deployed_contract_address
   ```

## Frontend Integration

The frontend uses React with TypeScript and integrates with the subscription contract using wagmi and viem.

### Key Components

1. **SubscriptionContext**: Manages subscription state and provides methods for subscribing and checking status.
2. **SubscriptionPlan**: Displays available subscription plans and handles the subscription flow.
3. **SubscriptionGuard**: A higher-order component that protects routes requiring an active subscription.

### Usage

1. Wrap your app with the `SubscriptionProvider` in `App.tsx`:
   ```tsx
   import { SubscriptionProvider } from './contexts/SubscriptionContext';

   function App() {
     return (
       <WagmiProvider config={config}>
         <QueryClientProvider client={queryClient}>
           <RainbowKitProvider>
             <SubscriptionProvider>
               {/* Your app components */}
             </SubscriptionProvider>
           </RainbowKitProvider>
         </QueryClientProvider>
       </WagmiProvider>
     );
   }
   ```

2. Protect routes that require a subscription:
   ```tsx
   import { withSubscription } from './components/subscription/SubscriptionGuard';
   
   const ProtectedComponent = withSubscription(YourComponent);
   ```

3. Use the `useSubscription` hook to access subscription methods:
   ```tsx
   const { isSubscribed, subscribe, subscriptionEnds } = useSubscription();
   ```

## Testing

Run the test suite with:

```bash
npx hardhat test
```

## Security Considerations

1. Always use the latest version of OpenZeppelin contracts.
2. Ensure proper access control for admin functions.
3. Use reentrancy guards for functions that make external calls.
4. Test thoroughly on testnets before deploying to mainnet.

## License

This project is licensed under the MIT License.
