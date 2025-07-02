import React from 'react';
import { useWallet } from '../contexts/WalletContext';

const Wallet: React.FC = () => {
  const { 
    balance, 
    isLoading, 
    error, 
    getBalance, 
    makeTransaction
  } = useWallet();

  const handleDeposit = async () => {
    await makeTransaction(100);
  };

  const handleWithdraw = async () => {
    await makeTransaction(-50);
  };

  const refreshBalance = async () => {
    await getBalance();
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Wallet Balance</h2>
        <div className="flex gap-4">
          <button 
            onClick={refreshBalance}
            className="text-blue-600 hover:text-blue-800"
          >
            Refresh
          </button>
          <a 
            href="http://localhost:5001"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Artistes
          </a>
        </div>
      </div>
      <h2 className="text-xl font-bold mb-4">Wallet</h2>
      
      {isLoading ? (
        <div className="animate-pulse">Loading...</div>
      ) : (
        <>
          <div className="text-2xl font-bold mb-4">
            Balance: ${balance.toFixed(2)}
          </div>
          
          <div className="space-y-2">
            <button
              onClick={handleDeposit}
              className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
            >
              Deposit $100
            </button>
            <button
              onClick={handleWithdraw}
              className="w-full bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600"
            >
              Withdraw $50
            </button>
          </div>
        </>
      )}
      
      {error && (
        <div className="mt-4 text-red-500">{error}</div>
      )}
    </div>
  );
};

export default Wallet;
