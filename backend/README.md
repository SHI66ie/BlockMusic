# BlockMusic Backend

This is the backend service for the BlockMusic application, handling NFT minting, IPFS uploads, and blockchain interactions.

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
  - [Installation](#installation)
  - [Configuration](#configuration)
  - [Running the Server](#running-the-server)
- [API Documentation](#api-documentation)
- [Development](#development)
  - [Environment Setup](#environment-setup)
  - [Testing](#testing)
  - [Linting](#linting)
  - [Formatting](#formatting)
- [Production Deployment](#production-deployment)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

## Features

- **RESTful API** - Clean and consistent API design
- **Authentication & Authorization** - JWT-based authentication
- **File Uploads** - Support for uploading files to IPFS via Pinata
- **Blockchain Integration** - Interact with Ethereum-compatible blockchains
- **MongoDB** - Flexible NoSQL database
- **Rate Limiting** - Protect against abuse
- **Logging** - Comprehensive logging with Winston
- **Validation** - Request validation and sanitization
- **Testing** - Unit and integration tests
- **Environment Configuration** - Support for multiple environments

## Prerequisites

- Node.js (v14 or later)
- npm (v6 or later) or yarn
- MongoDB (v4.4 or later)
- Git

## Getting Started

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/blockmusic-backend.git
   cd blockmusic-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Configuration

1. Copy the environment template file for your environment:
   ```bash
   # For development
   cp env.development.template .env.development
   
   # For production
   cp env.production.template .env.production
   
   # For testing
   cp env.test.template .env.test
   ```

2. Update the `.env` file with your configuration.

### Running the Server

- Development (with hot-reload):
  ```bash
  npm run dev
  ```

- Production:
  ```bash
  npm start
  ```

## API Documentation

API documentation is available at `/api-docs` when running in development mode.

### Authentication

Most endpoints require authentication. Include the JWT token in the `Authorization` header:

```
Authorization: Bearer <token>
```

### Endpoints

#### Health Check
- `GET /health` - Check server status

#### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh-token` - Refresh access token
- `POST /api/auth/logout` - Logout

#### Users
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get user by ID
- `PATCH /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

#### NFTs
- `GET /api/nfts` - Get all NFTs
- `GET /api/nfts/:id` - Get NFT by ID
- `POST /api/nfts` - Create a new NFT
- `PATCH /api/nfts/:id` - Update NFT
- `DELETE /api/nfts/:id` - Delete NFT

#### Uploads
- `POST /api/upload` - Upload file to IPFS

## Development

### Environment Setup

1. Create a `.env.development` file based on the template.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

### Testing

Run tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm run test:coverage
```

### Linting

Check for linting errors:
```bash
npm run lint
```

Fix linting errors:
```bash
npm run lint:fix
```

### Formatting

Format code with Prettier:
```bash
npm run format
```

## Production Deployment

1. Set up a production MongoDB database.
2. Create a `.env.production` file with your production configuration.
3. Build the application:
   ```bash
   npm run build
   ```
4. Start the production server:
   ```bash
   NODE_ENV=production npm start
   ```

### Using PM2 (recommended for production)

1. Install PM2 globally:
   ```bash
   npm install -g pm2
   ```

2. Start the application with PM2:
   ```bash
   NODE_ENV=production pm2 start server.js --name "blockmusic-backend"
   ```

3. Save the PM2 process list:
   ```bash
   pm2 save
   ```

4. Set up PM2 to start on system boot:
   ```bash
   pm2 startup
   ```

## Project Structure

```
backend/
├── config/             # Configuration files
├── controllers/        # Route controllers
├── middleware/         # Custom middleware
├── models/             # Database models
├── routes/             # API routes
├── services/           # Business logic
├── utils/              # Utility functions
├── validations/        # Request validations
├── tests/              # Test files
├── uploads/            # File uploads (development)
├── .env.example        # Environment variables example
├── .eslintrc.js        # ESLint configuration
├── .prettierrc         # Prettier configuration
├── app.js              # Express app setup
├── package.json        # Project metadata and dependencies
└── server.js           # Server entry point
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.
