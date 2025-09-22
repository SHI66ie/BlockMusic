# BlockMusic - Decentralized Music Platform

A decentralized music platform built on the Base blockchain that allows artists to upload, share, and monetize their music using blockchain technology.

## Features

- 🎵 Upload and share music on the blockchain
- 💰 Monetize your music with cryptocurrency
- 🔒 Secure and transparent royalty distribution
- 🌐 Decentralized storage using IPFS
- 🔗 Built on Base (Ethereum L2)

## Prerequisites

- Node.js (v18 or later)
- npm or yarn
- WalletConnect Project ID (from [WalletConnect Cloud](https://cloud.walletconnect.com/))

## Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/blockmusic.git
   cd blockmusic/project
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` and add your WalletConnect Project ID.

4. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open in your browser**
   The app should be running at http://localhost:3000

## Tech Stack

- **Frontend**: React, TypeScript, Vite
- **Blockchain**: Base (Ethereum L2), wagmi, viem
- **Wallet**: RainbowKit, WalletConnect
- **State Management**: React Query
- **Styling**: Tailwind CSS

## Smart Contracts

Smart contracts are deployed on the Base Sepolia testnet. You'll need test ETH to interact with them.

### Getting Test ETH

1. Get Sepolia ETH from a faucet
2. Bridge to Base Sepolia using the [Base Bridge](https://bridge.base.org/)

## Contributing

Contributions are welcome! Please read our [contributing guidelines](CONTRIBUTING.md) to get started.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you have any questions or need help, please open an issue or join our [Discord](https://discord.gg/your-discord).
