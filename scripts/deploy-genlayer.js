#!/usr/bin/env node

/**
 * GenLayer Intelligent Contract Deployment Script
 * 
 * Prerequisites:
 *   1. Install GenLayer CLI: npm install -g genlayer
 *   2. Initialize environment: genlayer init
 *   3. Start local environment: genlayer up
 * 
 * Usage:
 *   node scripts/deploy-genlayer.js [--network localnet|testnet]
 * 
 * This script deploys all 4 GenLayer Intelligent Contracts:
 *   - MusicContentModerator
 *   - MusicRecommender
 *   - CopyrightVerifier
 *   - ArtistVerifier
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Parse arguments
const args = process.argv.slice(2);
const networkIdx = args.indexOf('--network');
const network = networkIdx !== -1 ? args[networkIdx + 1] : 'localnet';

console.log('='.repeat(60));
console.log('  GenLayer Intelligent Contract Deployment');
console.log('  Network:', network);
console.log('='.repeat(60));
console.log();

// Contract definitions
const contracts = [
  {
    name: 'MusicContentModerator',
    file: 'genlayer/music_content_moderator.py',
    envKey: 'VITE_GENLAYER_CONTENT_MODERATOR',
    description: 'AI-powered content moderation',
  },
  {
    name: 'MusicRecommender',
    file: 'genlayer/music_recommender.py',
    envKey: 'VITE_GENLAYER_MUSIC_RECOMMENDER',
    description: 'AI-powered music recommendations',
  },
  {
    name: 'CopyrightVerifier',
    file: 'genlayer/copyright_verifier.py',
    envKey: 'VITE_GENLAYER_COPYRIGHT_VERIFIER',
    description: 'AI-powered copyright verification',
  },
  {
    name: 'ArtistVerifier',
    file: 'genlayer/artist_verifier.py',
    envKey: 'VITE_GENLAYER_ARTIST_VERIFIER',
    description: 'AI-powered artist identity verification',
  },
];

// Check if GenLayer CLI is available
try {
  execSync('genlayer --version', { stdio: 'pipe' });
  console.log('✅ GenLayer CLI found');
} catch {
  console.error('❌ GenLayer CLI not found. Install with: npm install -g genlayer');
  console.error('   Then run: genlayer init');
  process.exit(1);
}

// Set network
try {
  console.log(`\n📡 Setting network to ${network}...`);
  execSync(`genlayer network set ${network}`, { stdio: 'inherit' });
} catch (err) {
  console.error(`❌ Failed to set network to ${network}`);
  process.exit(1);
}

// Deploy each contract
const deployedAddresses = {};

for (const contract of contracts) {
  console.log(`\n${'─'.repeat(50)}`);
  console.log(`📦 Deploying ${contract.name}...`);
  console.log(`   ${contract.description}`);
  console.log(`   File: ${contract.file}`);

  const contractPath = path.resolve(__dirname, '..', contract.file);
  
  if (!fs.existsSync(contractPath)) {
    console.error(`   ❌ Contract file not found: ${contractPath}`);
    continue;
  }

  try {
    // Deploy using GenLayer CLI
    const output = execSync(
      `genlayer contracts deploy ${contractPath}`,
      { encoding: 'utf-8', timeout: 120000 }
    );

    // Extract contract address from output
    const addressMatch = output.match(/0x[a-fA-F0-9]{40}/);
    if (addressMatch) {
      const address = addressMatch[0];
      deployedAddresses[contract.envKey] = address;
      console.log(`   ✅ Deployed at: ${address}`);
    } else {
      console.log(`   ⚠️ Deployment output:`, output);
      console.log(`   ⚠️ Could not extract address. Check output above.`);
    }
  } catch (err) {
    console.error(`   ❌ Deployment failed:`, err.message);
  }
}

// Print summary
console.log(`\n${'='.repeat(60)}`);
console.log('  Deployment Summary');
console.log('='.repeat(60));

const envLines = [];
for (const contract of contracts) {
  const address = deployedAddresses[contract.envKey] || 'DEPLOYMENT_FAILED';
  const status = address !== 'DEPLOYMENT_FAILED' ? '✅' : '❌';
  console.log(`  ${status} ${contract.name}: ${address}`);
  envLines.push(`${contract.envKey}=${address}`);
}

// Write deployment info
const deploymentInfo = {
  network,
  timestamp: new Date().toISOString(),
  contracts: deployedAddresses,
};

const deploymentPath = path.resolve(__dirname, '..', 'genlayer-deployment.json');
fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
console.log(`\n📄 Deployment info saved to: genlayer-deployment.json`);

// Print env vars to add
console.log(`\n${'─'.repeat(50)}`);
console.log('  Add these to your .env file:');
console.log('─'.repeat(50));
console.log(`VITE_GENLAYER_NETWORK=${network}`);
envLines.forEach(line => console.log(line));

console.log(`\n✨ Done!`);
