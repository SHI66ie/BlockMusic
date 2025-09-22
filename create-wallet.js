const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Create a new random wallet
const wallet = ethers.Wallet.createRandom();

// Create .env file with the private key
const envPath = path.join(__dirname, '.env');
fs.writeFileSync(envPath, `PRIVATE_KEY=${wallet.privateKey}`);

console.log('✅ New wallet created and .env updated');
console.log('\n🔑 Address:', wallet.address);
console.log('🔐 Private Key:', wallet.privateKey);
console.log('📜 Mnemonic:', wallet.mnemonic.phrase);
console.log('\n⚠️  IMPORTANT: Save this information in a secure location!');
console.log('⚠️  Never share your private key or mnemonic with anyone!');

// Ensure .env is in .gitignore
const gitignorePath = path.join(__dirname, '.gitignore');
if (fs.existsSync(gitignorePath)) {
  let gitignore = fs.readFileSync(gitignorePath, 'utf8');
  if (!gitignore.includes('.env')) {
    fs.appendFileSync(gitignore, '\n# Environment variables\n.env\n');
  }
} else {
  fs.writeFileSync(gitignorePath, '# Environment variables\n.env\n');
}
