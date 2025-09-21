#!/bin/bash

# Script de ayuda para mostrar todos los comandos de despliegue disponibles

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}🚀 Scripts de Despliegue - Coin Flip Project${NC}"
echo -e "${CYAN}==============================================${NC}"
echo ""

echo -e "${BLUE}📋 Comandos Disponibles:${NC}"
echo ""

echo -e "${GREEN}🔧 Despliegue Completo:${NC}"
echo -e "  ${YELLOW}pnpm run deploy:sepolia${NC}     - Desplegar a Base Sepolia (Testnet)"
echo -e "  ${YELLOW}pnpm run deploy:mainnet${NC}     - Desplegar a Base Mainnet (Producción)"
echo ""

echo -e "${GREEN}🔄 Solo Actualización Post-Despliegue:${NC}"
echo -e "  ${YELLOW}pnpm run post-deploy${NC}        - Actualizar archivos (Base Sepolia)"
echo -e "  ${YELLOW}pnpm run post-deploy:base${NC}   - Actualizar archivos (Base Mainnet)"
echo ""

echo -e "${GREEN}🔨 Compilación y ABI:${NC}"
echo -e "  ${YELLOW}pnpm run compile:abi${NC}        - Compilar contrato y actualizar ABI"
echo -e "  ${YELLOW}pnpm run validate:abi${NC}       - Validar consistencia del ABI"
echo ""

echo -e "${GREEN}📁 Scripts Directos:${NC}"
echo -e "  ${YELLOW}./scripts/deploy-to-sepolia.sh${NC}  - Despliegue completo a Sepolia"
echo -e "  ${YELLOW}./scripts/deploy-to-mainnet.sh${NC}  - Despliegue completo a Mainnet"
echo -e "  ${YELLOW}node scripts/post-deploy.js [CHAIN_ID]${NC} - Actualización manual"
echo ""

echo -e "${BLUE}⚙️ Variables de Entorno Requeridas:${NC}"
echo ""
echo -e "${GREEN}Para Base Sepolia:${NC}"
echo -e "  ${YELLOW}export PRIVATE_KEY=\"0x...\"${NC}"
echo -e "  ${YELLOW}export BASE_SEPOLIA_URL=\"https://...\"${NC}"
echo -e "  ${YELLOW}export ETHERSCAN_API_KEY=\"...\"${NC}"
echo ""

echo -e "${GREEN}Para Base Mainnet:${NC}"
echo -e "  ${YELLOW}export PRIVATE_KEY=\"0x...\"${NC}"
echo -e "  ${YELLOW}export BASE_URL=\"https://...\"${NC}"
echo -e "  ${YELLOW}export ETHERSCAN_API_KEY=\"...\"${NC}"
echo ""

echo -e "${BLUE}📝 Archivos que se Actualizan:${NC}"
echo -e "  ${YELLOW}apps/miniapp/src/contracts/abis.ts${NC} - ABI del contrato"
echo -e "  ${YELLOW}apps/miniapp/.env.local${NC} - Dirección del contrato"
echo ""

echo -e "${BLUE}🔗 Enlaces Útiles:${NC}"
echo -e "  ${YELLOW}Base Sepolia Faucet:${NC} https://bridge.base.org/deposit"
echo -e "  ${YELLOW}BaseScan Sepolia:${NC} https://sepolia.basescan.org/"
echo -e "  ${YELLOW}BaseScan Mainnet:${NC} https://basescan.org/"
echo -e "  ${YELLOW}Base Documentation:${NC} https://docs.base.org/"
echo ""

echo -e "${PURPLE}💡 Ejemplo de Uso:${NC}"
echo -e "  ${YELLOW}# 1. Configurar variables${NC}"
echo -e "  ${YELLOW}export PRIVATE_KEY=\"0x123...\"${NC}"
echo -e "  ${YELLOW}export BASE_SEPOLIA_URL=\"https://sepolia.base.org\"${NC}"
echo -e "  ${YELLOW}export ETHERSCAN_API_KEY=\"ABC123...\"${NC}"
echo ""
echo -e "  ${YELLOW}# 2. Desplegar a testnet${NC}"
echo -e "  ${YELLOW}pnpm run deploy:sepolia${NC}"
echo ""
echo -e "  ${YELLOW}# 3. Cuando esté listo para producción${NC}"
echo -e "  ${YELLOW}export BASE_URL=\"https://mainnet.base.org\"${NC}"
echo -e "  ${YELLOW}pnpm run deploy:mainnet${NC}"
echo ""

echo -e "${RED}⚠️  Importante:${NC}"
echo -e "  • Base Sepolia es para pruebas (gratis)"
echo -e "  • Base Mainnet es para producción (cuesta ETH real)"
echo -e "  • Siempre prueba primero en Sepolia"
echo -e "  • Verifica que tienes suficiente ETH para gas fees"
echo ""

echo -e "${CYAN}📚 Para más información, consulta: scripts/README.md${NC}"
