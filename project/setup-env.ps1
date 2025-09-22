# Create .env file with WalletConnect configuration
$envContent = @"
# WalletConnect Project ID - Get one from https://cloud.walletconnect.com/
VITE_WALLET_CONNECT_PROJECT_ID=your-project-id-here

# Optional: Set the default chain
VITE_DEFAULT_CHAIN=base-sepolia

# Optional: Set the app name
VITE_APP_NAME=BlockMusic
"@

# Check if .env file already exists
if (Test-Path .env) {
    Write-Host ".env file already exists. Please update it with your WalletConnect Project ID."
    Write-Host "You can find it at: $((Get-Item .).FullName)\.env"
} else {
    # Create .env file
    $envContent | Out-File -FilePath .env -Encoding utf8
    Write-Host "Created .env file. Please update it with your WalletConnect Project ID."
    Write-Host "You can find it at: $((Get-Item .).FullName)\.env"
}

# Open the .env file in Notepad
notepad .env
