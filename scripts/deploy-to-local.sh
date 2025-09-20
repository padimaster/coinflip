#!/bin/bash

# Script to deploy FlipToEarnFaucet contract to local Anvil network
# and update frontend configuration

set -e  # Exit if any command fails

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
CHAIN_ID="31337"  # Anvil default chain ID
NETWORK="http://localhost:8545"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONTRACTS_DIR="$PROJECT_ROOT/packages/contracts"

echo -e "${BLUE}🚀 Starting local deployment to Anvil...${NC}"
echo -e "${BLUE}📁 Project directory: $PROJECT_ROOT${NC}"

# Check if we're in the correct directory
if [ ! -d "$CONTRACTS_DIR" ]; then
    echo -e "${RED}❌ Error: Contracts directory not found at $CONTRACTS_DIR${NC}"
    exit 1
fi

# Check if Anvil is running
echo -e "${YELLOW}🔍 Checking if Anvil is running...${NC}"
if ! curl -s -X POST -H "Content-Type: application/json" \
    --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
    "$NETWORK" > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: Anvil is not running on $NETWORK${NC}"
    echo -e "${YELLOW}💡 Start Anvil with: anvil --accounts 10 --balance 1000${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Anvil is running${NC}"

# Navigate to contracts directory
cd "$CONTRACTS_DIR"

# Compile contracts
echo -e "${YELLOW}🔨 Compiling contracts...${NC}"
forge build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error during compilation${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Contracts compiled successfully${NC}"

# Deploy contract using default Anvil account
echo -e "${YELLOW}🚀 Deploying FlipToEarnFaucet to local Anvil...${NC}"
echo -e "${BLUE}📡 Network: $NETWORK (Chain ID: $CHAIN_ID)${NC}"

# Use the first Anvil account (has 10000 ETH by default)
ANVIL_PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"

forge script script/FlipToEarnFaucet.s.sol:FlipToEarnFaucetScript \
    --rpc-url "$NETWORK" \
    --broadcast \
    --private-key "$ANVIL_PRIVATE_KEY" \
    -vvvv

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error during deployment${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Contract deployed successfully${NC}"

# Extract contract address from broadcast file
BROADCAST_FILE="$CONTRACTS_DIR/broadcast/FlipToEarnFaucet.s.sol/$CHAIN_ID/run-latest.json"
if [ -f "$BROADCAST_FILE" ]; then
    CONTRACT_ADDRESS=$(jq -r '.transactions[0].contractAddress' "$BROADCAST_FILE")
    echo -e "${GREEN}📄 Contract deployed to: $CONTRACT_ADDRESS${NC}"
else
    echo -e "${RED}❌ Error: Could not find broadcast file${NC}"
    exit 1
fi

# Run post-deployment script
echo -e "${YELLOW}🔄 Running post-deployment configuration...${NC}"

cd "$PROJECT_ROOT"
node scripts/post-deploy-local.js "$CHAIN_ID" "$CONTRACT_ADDRESS"

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error during post-deployment configuration${NC}"
    exit 1
fi

echo -e "${GREEN}🎉 Local deployment completed successfully!${NC}"
echo -e "${BLUE}📝 Deployment Summary:${NC}"
echo -e "   • Network: Local Anvil ($CHAIN_ID)"
echo -e "   • Contract: FlipToEarnFaucet"
echo -e "   • Address: $CONTRACT_ADDRESS"
echo -e "   • ABI updated in: apps/miniapp/src/contracts/coin-flip.contract.ts"
echo -e "   • Contract address in: apps/miniapp/.env.local"
echo -e ""
echo -e "${YELLOW}💡 Next steps:${NC}"
echo -e "   1. Verify NEXT_PUBLIC_FLIP_TO_EARN_FAUCET_CONTRACT_ADDRESS_LOCAL is in your .env.local"
echo -e "   2. Restart your development server if running"
echo -e "   3. Your frontend can now interact with the deployed contract!"
echo -e ""
echo -e "${BLUE}🔗 Contract details:${NC}"
echo -e "   • Min flips required: 5"
echo -e "   • Daily claims limit: 100"
echo -e "   • Drop amount: 0.001 ETH"
echo -e "   • Cooldown period: 24 hours"
echo -e "   • Signature expiration: 1 hour"
