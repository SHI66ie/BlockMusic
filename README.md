# BlockMusic

A decentralized music platform built on the Base blockchain.

## Project Structure

- **Frontend**: React + TypeScript + Vite
- **Backend**: Flask + Python
- **Smart Contracts**: Solidity + Hardhat
- **Blockchain**: Base Network
- **Styling**: Tailwind CSS

## Smart Contracts

### Deployed Contracts
- **Greeter**: `0x40906b7A6e2ae4FAE0f3b6313d69a1862212e88A` on Base Sepolia

### Development

#### Prerequisites
- Node.js (v16+)
- npm or yarn
- Hardhat

#### Setup
1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file:
```env
PRIVATE_KEY=your_private_key_here
```

3. Compile contracts:
```bash
npx hardhat compile
```

4. Run tests:
```bash
npx hardhat test
```

5. Deploy to Base Sepolia:
```bash
npx hardhat run scripts/deploy.js --network baseSepolia
```

## Web Application

This project integrates Reown Cloud's WalletKit with a modern web application.

## Setup Instructions

### Main Application Setup
1. Navigate to the project directory:
```bash
cd project
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Install frontend dependencies:
```bash
npm install
```

4. Run the development servers:
```bash
# Backend (in one terminal)
python app.py

# Frontend (in another terminal)
npm run dev
```

### Artist Platform Setup
1. Navigate to the artist-platform directory:
```bash
cd artist-platform
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Run the artist platform server:
```bash
python app.py
```

### Environment Variables
Create `.env` files in both directories with:
- `SECRET_KEY` for security
- `DATABASE_URL` for database connection
- Other configuration settings as needed

## Project Structure

```
BLockMusic(Pricesadj)/
├── project/             # Main application
│   ├── src/            # Frontend source code
│   ├── app.py          # Flask backend
│   ├── requirements.txt # Python dependencies
│   └── .env            # Environment variables
├── artist-platform/    # Artist platform
│   ├── src/           # Frontend source code
│   ├── app.py         # Flask backend
│   ├── requirements.txt # Python dependencies
│   └── .env           # Environment variables
└── README.md          # Project documentation
```
