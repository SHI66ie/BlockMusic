const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Create a new random wallet
const wallet = ethers.Wallet.createRandom();

// Prepare the output
const output = {
  address: wallet.address,
  privateKey: wallet.privateKey,
  mnemonic: wallet.mnemonic.phrase
};

// Create a backup file (in a real scenario, this would be more secure)
const backupPath = path.join(__dirname, 'wallet-backup.json');
fs.writeFileSync(backupPath, JSON.stringify(output, null, 2));

// Create or update .env file
const envPath = path.join(__dirname, '.env');
let envContent = '';

if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8');
  // Remove existing PRIVATE_KEY if it exists
  envContent = envContent.replace(/^PRIVATE_KEY=.*$/m, '');
}

// Add the new private key
envContent += `\nPRIVATE_KEY=${wallet.privateKey}\n`;

// Write back to .env
fs.writeFileSync(envPath, envContent.trim());

console.log('✅ New wallet created and .env updated');
console.log('📝 Backup saved to wallet-backup.json');
console.log('\n🔑 Address:', wallet.address);
console.log('🔐 Private Key:', wallet.privateKey);
console.log('📜 Mnemonic:', wallet.mnemonic.phrase);
console.log('\n⚠️  IMPORTANT: Backup this information in a secure location!');
console.log('⚠️  Never commit the .env file or wallet-backup.json to version control!');

// Add wallet-backup.json to .gitignore if not already present
const gitignorePath = path.join(__dirname, '.gitignore');
if (fs.existsSync(gitignorePath)) {
  let gitignore = fs.readFileSync(gitignorePath, 'utf8');
  if (!gitignore.includes('wallet-backup.json')) {
    fs.appendFileSync(gitignore, '\n# Wallet backups\nwallet-backup.json\n');
  }
} else {
  fs.writeFileSync(gitignorePath, '# Wallet backups\nwallet-backup.json\n');
}

// Ensure .env is in .gitignore
if (fs.existsSync(gitignorePath)) {
  let gitignore = fs.readFileSync(gitignorePath, 'utf8');
  if (!gitignore.includes('.env')) {
    fs.appendFileSync(gitignore, '\n# Environment variables\n.env\n');
  }
}
