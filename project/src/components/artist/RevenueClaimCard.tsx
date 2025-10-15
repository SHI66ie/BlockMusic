import { useState } from 'react';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { formatEther, formatUnits } from 'viem';
import { toast } from 'react-toastify';
import { FaEthereum, FaDollarSign, FaDownload, FaSpinner } from 'react-icons/fa';
import { RevenueDistribution } from '../../abis/RevenueDistribution';

const REVENUE_DISTRIBUTION_CONTRACT = import.meta.env.VITE_REVENUE_DISTRIBUTION_CONTRACT || '0x...';

export default function RevenueClaimCard() {
  const { address } = useAccount();
  const [isClaimingETH, setIsClaimingETH] = useState(false);
  const [isClaimingUSDC, setIsClaimingUSDC] = useState(false);
  const [isClaimingAll, setIsClaimingAll] = useState(false);

  const { writeContractAsync } = useWriteContract();

  // Fetch artist revenue summary
  const { data: revenueSummary, refetch: refetchRevenue } = useReadContract({
    address: REVENUE_DISTRIBUTION_CONTRACT as `0x${string}`,
    abi: RevenueDistribution,
    functionName: 'getArtistRevenueSummary',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 10000, // Refetch every 10 seconds
    },
  });

  const claimableETH = revenueSummary ? revenueSummary[0] : BigInt(0);
  const claimableUSDC = revenueSummary ? revenueSummary[1] : BigInt(0);
  const totalClaimedETH = revenueSummary ? revenueSummary[2] : BigInt(0);
  const totalClaimedUSDC = revenueSummary ? revenueSummary[3] : BigInt(0);
  const artistPlays = revenueSummary ? Number(revenueSummary[4]) : 0;
  const totalPlays = revenueSummary ? Number(revenueSummary[5]) : 0;

  const handleClaimETH = async () => {
    if (!address || claimableETH === BigInt(0)) {
      toast.warning('No ETH revenue to claim');
      return;
    }

    setIsClaimingETH(true);
    try {
      await writeContractAsync({
        address: REVENUE_DISTRIBUTION_CONTRACT as `0x${string}`,
        abi: RevenueDistribution,
        functionName: 'claimETHRevenue',
      });

      toast.success(`Successfully claimed ${formatEther(claimableETH)} ETH!`);
      await refetchRevenue();
    } catch (error) {
      console.error('Error claiming ETH:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to claim ETH revenue';
      toast.error(errorMessage);
    } finally {
      setIsClaimingETH(false);
    }
  };

  const handleClaimUSDC = async () => {
    if (!address || claimableUSDC === BigInt(0)) {
      toast.warning('No USDC revenue to claim');
      return;
    }

    setIsClaimingUSDC(true);
    try {
      await writeContractAsync({
        address: REVENUE_DISTRIBUTION_CONTRACT as `0x${string}`,
        abi: RevenueDistribution,
        functionName: 'claimUSDCRevenue',
      });

      toast.success(`Successfully claimed ${formatUnits(claimableUSDC, 6)} USDC!`);
      await refetchRevenue();
    } catch (error) {
      console.error('Error claiming USDC:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to claim USDC revenue';
      toast.error(errorMessage);
    } finally {
      setIsClaimingUSDC(false);
    }
  };

  const handleClaimAll = async () => {
    if (!address || (claimableETH === BigInt(0) && claimableUSDC === BigInt(0))) {
      toast.warning('No revenue to claim');
      return;
    }

    setIsClaimingAll(true);
    try {
      await writeContractAsync({
        address: REVENUE_DISTRIBUTION_CONTRACT as `0x${string}`,
        abi: RevenueDistribution,
        functionName: 'claimAllRevenue',
      });

      toast.success('Successfully claimed all revenue!');
      await refetchRevenue();
    } catch (error) {
      console.error('Error claiming all revenue:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to claim revenue';
      toast.error(errorMessage);
    } finally {
      setIsClaimingAll(false);
    }
  };

  const playSharePercentage = totalPlays > 0 ? ((artistPlays / totalPlays) * 100).toFixed(2) : '0.00';

  return (
    <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-500/30 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Revenue Dashboard</h2>
        <div className="text-sm text-gray-400">
          Your share: {playSharePercentage}% ({artistPlays.toLocaleString()} / {totalPlays.toLocaleString()} plays)
        </div>
      </div>

      {/* Claimable Revenue */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* ETH Claimable */}
        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Claimable ETH</span>
            <FaEthereum className="text-blue-400 text-xl" />
          </div>
          <div className="text-3xl font-bold text-white mb-3">
            {formatEther(claimableETH)}
          </div>
          <button
            onClick={handleClaimETH}
            disabled={claimableETH === BigInt(0) || isClaimingETH}
            className={`w-full py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
              claimableETH === BigInt(0)
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isClaimingETH ? (
              <>
                <FaSpinner className="animate-spin" />
                Claiming...
              </>
            ) : (
              <>
                <FaDownload />
                Claim ETH
              </>
            )}
          </button>
        </div>

        {/* USDC Claimable */}
        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Claimable USDC</span>
            <FaDollarSign className="text-green-400 text-xl" />
          </div>
          <div className="text-3xl font-bold text-white mb-3">
            ${formatUnits(claimableUSDC, 6)}
          </div>
          <button
            onClick={handleClaimUSDC}
            disabled={claimableUSDC === BigInt(0) || isClaimingUSDC}
            className={`w-full py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
              claimableUSDC === BigInt(0)
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isClaimingUSDC ? (
              <>
                <FaSpinner className="animate-spin" />
                Claiming...
              </>
            ) : (
              <>
                <FaDownload />
                Claim USDC
              </>
            )}
          </button>
        </div>
      </div>

      {/* Claim All Button */}
      {(claimableETH > BigInt(0) || claimableUSDC > BigInt(0)) && (
        <button
          onClick={handleClaimAll}
          disabled={isClaimingAll}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 mb-6"
        >
          {isClaimingAll ? (
            <>
              <FaSpinner className="animate-spin" />
              Claiming All Revenue...
            </>
          ) : (
            <>
              <FaDownload />
              Claim All Revenue
            </>
          )}
        </button>
      )}

      {/* Total Claimed */}
      <div className="border-t border-gray-700 pt-4">
        <h3 className="text-sm font-semibold text-gray-400 mb-3">Lifetime Earnings</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-800/30 rounded-lg p-3">
            <div className="text-xs text-gray-400 mb-1">Total Claimed ETH</div>
            <div className="text-lg font-bold flex items-center gap-1">
              <FaEthereum className="text-blue-400" />
              {formatEther(totalClaimedETH)}
            </div>
          </div>
          <div className="bg-gray-800/30 rounded-lg p-3">
            <div className="text-xs text-gray-400 mb-1">Total Claimed USDC</div>
            <div className="text-lg font-bold flex items-center gap-1">
              <FaDollarSign className="text-green-400" />
              {formatUnits(totalClaimedUSDC, 6)}
            </div>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="mt-4 bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 text-sm text-blue-200">
        <p className="font-semibold mb-1">💡 How Revenue Works:</p>
        <ul className="space-y-1 text-xs">
          <li>• You earn 85% of subscription revenue based on your play share</li>
          <li>• Revenue is calculated: (Your Plays / Total Plays) × 85% of Pool</li>
          <li>• Claim anytime - no minimum threshold</li>
          <li>• All transactions are on-chain and transparent</li>
        </ul>
      </div>
    </div>
  );
}
