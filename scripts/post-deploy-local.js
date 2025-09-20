#!/usr/bin/env node

/**
 * Post-deployment script for local Anvil deployment
 * Updates frontend configuration with contract address and ABI
 */

const fs = require('fs');
const path = require('path');

// Get command line arguments
const chainId = process.argv[2];
const contractAddress = process.argv[3];

if (!chainId || !contractAddress) {
    console.error('❌ Error: Missing required arguments');
    console.error('Usage: node post-deploy-local.js <chainId> <contractAddress>');
    process.exit(1);
}

const projectRoot = path.resolve(__dirname, '..');
const contractsDir = path.join(projectRoot, 'packages', 'contracts');
const frontendDir = path.join(projectRoot, 'apps', 'miniapp');

console.log('🔄 Updating frontend configuration...');
console.log(`📄 Chain ID: ${chainId}`);
console.log(`📄 Contract Address: ${contractAddress}`);

// Read the compiled contract ABI
const contractArtifactPath = path.join(contractsDir, 'out', 'FlipToEarnFaucet.sol', 'FlipToEarnFaucet.json');

if (!fs.existsSync(contractArtifactPath)) {
    console.error('❌ Error: Contract artifact not found at:', contractArtifactPath);
    process.exit(1);
}

const contractArtifact = JSON.parse(fs.readFileSync(contractArtifactPath, 'utf8'));
const abi = contractArtifact.abi;

// Update the contract configuration file
const contractConfigPath = path.join(frontendDir, 'src', 'contracts', 'coin-flip.contract.ts');

// Create the contract configuration content
const contractConfigContent = `// Auto-generated contract configuration
// Generated on: ${new Date().toISOString()}
// Chain ID: ${chainId}
// Contract Address: ${contractAddress}

export const FAUCET_CONTRACT_ADDRESSES = {
  local: process.env.NEXT_PUBLIC_FLIP_TO_EARN_FAUCET_CONTRACT_ADDRESS_LOCAL,
  baseSepolia: process.env.NEXT_PUBLIC_FLIP_TO_EARN_FAUCET_CONTRACT_ADDRESS_BASE_SEPOLIA,
  base: process.env.NEXT_PUBLIC_FLIP_TO_EARN_FAUCET_CONTRACT_ADDRESS_BASE_MAINNET,
} as const;

export const FAUCET_CONTRACT_ABI = ${JSON.stringify(abi, null, 2)} as const;

// Contract configuration
export const FAUCET_CONFIG = {
  addresses: FAUCET_CONTRACT_ADDRESSES,
  abi: FAUCET_CONTRACT_ABI,
  chainId: ${chainId},
  network: 'local-anvil',
} as const;

// Contract function signatures for type safety
export type FaucetContract = typeof FAUCET_CONTRACT_ABI;
`;

// Write the contract configuration
fs.writeFileSync(contractConfigPath, contractConfigContent);
console.log('✅ Contract configuration updated:', contractConfigPath);

// Update or create .env.local file
const envLocalPath = path.join(frontendDir, '.env.local');
let envContent = '';

// Read existing .env.local if it exists
if (fs.existsSync(envLocalPath)) {
    envContent = fs.readFileSync(envLocalPath, 'utf8');
}

// Define all environment variables we need
const envVars = [
  {
    name: 'NEXT_PUBLIC_FLIP_TO_EARN_FAUCET_CONTRACT_ADDRESS_LOCAL',
    value: contractAddress // This is the current deployment
  },
  {
    name: 'NEXT_PUBLIC_FLIP_TO_EARN_FAUCET_CONTRACT_ADDRESS_BASE_SEPOLIA',
    value: process.env.NEXT_PUBLIC_FLIP_TO_EARN_FAUCET_CONTRACT_ADDRESS_BASE_SEPOLIA || ''
  },
  {
    name: 'NEXT_PUBLIC_FLIP_TO_EARN_FAUCET_CONTRACT_ADDRESS_BASE_MAINNET',
    value: process.env.NEXT_PUBLIC_FLIP_TO_EARN_FAUCET_CONTRACT_ADDRESS_BASE_MAINNET || ''
  },
  {
    name: 'NEXT_PUBLIC_CHAIN_ID_LOCAL',
    value: chainId
  }
];

// Process each environment variable
let finalLines = envContent.split('\n');
envVars.forEach(envVar => {
  // Remove existing line if it exists
  finalLines = finalLines.filter(line => !line.startsWith(`${envVar.name}=`));
  // Add the new line
  finalLines.push(`${envVar.name}=${envVar.value}`);
});

// Write the updated .env.local
const updatedEnvContent = finalLines.join('\n');
fs.writeFileSync(envLocalPath, updatedEnvContent);
console.log('✅ Environment variables updated:', envLocalPath);
console.log('   • NEXT_PUBLIC_FLIP_TO_EARN_FAUCET_CONTRACT_ADDRESS_LOCAL=' + contractAddress);
console.log('   • NEXT_PUBLIC_CHAIN_ID_LOCAL=' + chainId);

// Create a deployment summary
const summaryPath = path.join(projectRoot, 'deployment-summary.json');
const summary = {
    timestamp: new Date().toISOString(),
    network: 'local-anvil',
    chainId: parseInt(chainId),
    contractAddress,
    contractName: 'FlipToEarnFaucet',
    deploymentConfig: {
        minFlipsRequired: 5,
        dailyClaimsLimit: 100,
        dropAmount: '0.001 ETH',
        cooldownPeriod: '24 hours',
        signatureExpiration: '1 hour'
    },
    files: {
        contractConfig: contractConfigPath,
        envLocal: envLocalPath,
        summary: summaryPath
    }
};

fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
console.log('✅ Deployment summary created:', summaryPath);

console.log('🎉 Frontend configuration updated successfully!');
console.log('');
console.log('📝 Summary:');
console.log(`   • Contract Address: ${contractAddress}`);
console.log(`   • Chain ID: ${chainId}`);
console.log(`   • Network: Local Anvil`);
console.log(`   • Contract Config: ${contractConfigPath}`);
console.log(`   • Environment File: ${envLocalPath}`);
console.log('');
console.log('💡 Next steps:');
console.log('   1. Restart your development server if running');
console.log('   2. The frontend will now use the deployed contract');
console.log('   3. Make sure your wallet is connected to the local Anvil network');
