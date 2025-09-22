export interface WalletContextType {
  balance: number;
  isLoading: boolean;
  error: string | null;
  getBalance: () => Promise<void>;
  makeTransaction: (amount: number) => Promise<void>;
}

export const WALLET_API_BASE_URL = 'http://127.0.0.1:5000/api/wallet';
