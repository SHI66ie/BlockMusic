require('dotenv').config();

const config = {
  // Server configuration
  nodeEnv: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,
  host: process.env.HOST || '0.0.0.0',
  
  // MongoDB configuration
  mongo: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/blockmusic',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    },
  },
  
  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your_jwt_secret_key_here',
    expiresIn: process.env.JWT_EXPIRES_IN || '90d',
    cookieExpiresIn: process.env.JWT_COOKIE_EXPIRES_IN || 90, // days
  },
  
  // Pinata IPFS configuration
  pinata: {
    apiKey: process.env.PINATA_API_KEY,
    secretKey: process.env.PINATA_SECRET_API_KEY,
    jwt: process.env.PINATA_JWT,
    gateway: 'https://gateway.pinata.cloud/ipfs/',
  },
  
  // Blockchain configuration
  blockchain: {
    networkUrl: process.env.NETWORK_URL || 'https://sepolia.base.org',
    privateKey: process.env.PRIVATE_KEY,
    contractAddress: process.env.CONTRACT_ADDRESS,
    chainId: process.env.CHAIN_ID || 84532, // Base Sepolia testnet
  },
  
  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  },
  
  // CORS configuration
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  },
  
  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    dir: 'logs',
  },
  
  // Uploads
  uploads: {
    dir: 'uploads',
    maxFileSize: 50 * 1024 * 1024, // 50MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'audio/mpeg',
      'audio/wav',
      'audio/mp4',
      'audio/aac',
      'application/json',
    ],
  },
  
  // API
  api: {
    prefix: '/api',
    version: 'v1',
    docsPath: '/api-docs',
  },
};

// Validate required configuration
const requiredConfig = [
  'PINATA_API_KEY',
  'PINATA_SECRET_API_KEY',
  'PRIVATE_KEY',
  'CONTRACT_ADDRESS',
  'JWT_SECRET',
];

// Check for missing required configuration in production
if (config.nodeEnv === 'production') {
  const missingConfig = requiredConfig.filter(key => !process.env[key]);
  
  if (missingConfig.length > 0) {
    console.error('Missing required environment variables:', missingConfig.join(', '));
    process.exit(1);
  }
}

module.exports = config;
