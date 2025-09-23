export function shortenAddress(address: string, chars = 4): string {
  if (!address) return '';
  return `${address.substring(0, chars + 2)}...${address.substring(address.length - chars)}`;
}

export function formatEtherscanLink(
  type: 'tx' | 'token' | 'address' | 'block',
  data: [number, string],
): string {
  const [chainId, value] = data;
  
  const chainMap: Record<number, string> = {
    1: 'etherscan.io',
    5: 'goerli.etherscan.io',
    10: 'optimistic.etherscan.io',
    56: 'bscscan.com',
    137: 'polygonscan.com',
    42161: 'arbiscan.io',
    80001: 'mumbai.polygonscan.com',
    11155111: 'sepolia.etherscan.io',
    8453: 'basescan.org',
    84532: 'sepolia.basescan.org',
  };

  const prefix = chainId === 1 ? '' : `${chainMap[chainId] || `chain-${chainId}.io`}`;
  
  return `https://${prefix}/${type}/${value}`;
}
