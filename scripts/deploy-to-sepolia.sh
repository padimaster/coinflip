#!/bin/bash

# Script para desplegar el contrato CoinFlip en Base Sepolia y actualizar automáticamente
# los archivos del frontend con el ABI y la dirección del contrato

set -e  # Salir si cualquier comando falla

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración
CHAIN_ID="84532"  # Base Sepolia
NETWORK="base-sepolia"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONTRACTS_DIR="$PROJECT_ROOT/packages/contracts"

echo -e "${BLUE}🚀 Iniciando despliegue a Base Sepolia...${NC}"
echo -e "${BLUE}📁 Directorio del proyecto: $PROJECT_ROOT${NC}"

# Verificar que estamos en el directorio correcto
if [ ! -d "$CONTRACTS_DIR" ]; then
    echo -e "${RED}❌ Error: No se encontró el directorio de contratos en $CONTRACTS_DIR${NC}"
    exit 1
fi

# Cargar variables de entorno desde archivo .env si existe
ENV_FILE="$CONTRACTS_DIR/.env"
if [ -f "$ENV_FILE" ]; then
    echo -e "${BLUE}📄 Cargando variables de entorno desde $ENV_FILE${NC}"
    export $(grep -v '^#' "$ENV_FILE" | xargs)
else
    echo -e "${YELLOW}⚠️  No se encontró archivo .env en $CONTRACTS_DIR${NC}"
fi

# Verificar que las variables de entorno necesarias estén configuradas
echo -e "${YELLOW}🔍 Verificando variables de entorno...${NC}"

if [ -z "$PRIVATE_KEY" ]; then
    echo -e "${RED}❌ Error: La variable PRIVATE_KEY no está configurada${NC}"
    echo -e "${YELLOW}💡 Opciones para configurar:${NC}"
    echo -e "   1. Crear archivo .env en $CONTRACTS_DIR con: PRIVATE_KEY=tu_clave_privada"
    echo -e "   2. Configurar en terminal: export PRIVATE_KEY=tu_clave_privada"
    exit 1
fi

if [ -z "$BASE_SEPOLIA_URL" ]; then
    echo -e "${RED}❌ Error: La variable BASE_SEPOLIA_URL no está configurada${NC}"
    echo -e "${YELLOW}💡 Opciones para configurar:${NC}"
    echo -e "   1. Crear archivo .env en $CONTRACTS_DIR con: BASE_SEPOLIA_URL=https://sepolia.base.org"
    echo -e "   2. Configurar en terminal: export BASE_SEPOLIA_URL=tu_url_rpc"
    exit 1
fi

echo -e "${GREEN}✅ Variables de entorno verificadas${NC}"

# Navegar al directorio de contratos
cd "$CONTRACTS_DIR"

# Compilar contratos
echo -e "${YELLOW}🔨 Compilando contratos...${NC}"
forge build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error durante la compilación${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Contratos compilados exitosamente${NC}"

# Desplegar contrato
echo -e "${YELLOW}🚀 Desplegando contrato a Base Sepolia...${NC}"
echo -e "${BLUE}📡 Network: $NETWORK (Chain ID: $CHAIN_ID)${NC}"

# Intentar desplegar con verificación
echo -e "${YELLOW}🔍 Intentando desplegar con verificación...${NC}"
forge script script/FlipToEarnFaucet.s.sol:FlipToEarnFaucetScript \
    --rpc-url "$NETWORK" \
    --broadcast \
    --verify \
    --etherscan-api-key "$ETHERSCAN_API_KEY" \
    -vvvv

DEPLOY_EXIT_CODE=$?

if [ $DEPLOY_EXIT_CODE -ne 0 ]; then
    echo -e "${YELLOW}⚠️  Despliegue con verificación falló, intentando sin verificación...${NC}"
    
    # Intentar desplegar sin verificación
    forge script script/FlipToEarnFaucet.s.sol:FlipToEarnFaucetScript \
        --rpc-url "$NETWORK" \
        --broadcast \
        -vvvv
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Error durante el despliegue${NC}"
        exit 1
    else
        echo -e "${YELLOW}⚠️  Contrato desplegado sin verificación${NC}"
        echo -e "${YELLOW}💡 Puedes verificar manualmente más tarde con una API key válida${NC}"
    fi
fi

echo -e "${GREEN}✅ Contrato desplegado exitosamente${NC}"

# Verificar contrato automáticamente si la verificación falló durante el despliegue
if [ $DEPLOY_EXIT_CODE -ne 0 ]; then
    echo -e "${YELLOW}🔄 Intentando verificación automática...${NC}"
    cd "$PROJECT_ROOT"
    if ./scripts/auto-verify.sh base-sepolia; then
        echo -e "${GREEN}✅ Verificación automática exitosa${NC}"
    else
        echo -e "${YELLOW}⚠️  Verificación automática falló, pero el contrato está desplegado${NC}"
    fi
    cd "$CONTRACTS_DIR"
fi

# Ejecutar script post-despliegue
echo -e "${YELLOW}🔄 Actualizando archivos del frontend...${NC}"

cd "$PROJECT_ROOT"
node scripts/post-deploy.js "$CHAIN_ID"

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error durante la actualización de archivos${NC}"
    exit 1
fi

echo -e "${GREEN}🎉 ¡Despliegue completado exitosamente!${NC}"
echo -e "${BLUE}📝 Resumen del despliegue:${NC}"
echo -e "   • Network: Base Sepolia ($CHAIN_ID)"
echo -e "   • Contrato: FlipToEarnFaucet"
echo -e "   • ABI actualizado en: apps/miniapp/src/contracts/coin-flip.contract.ts"
echo -e "   • Dirección del contrato en: apps/miniapp/.env.local"
echo -e ""
echo -e "${YELLOW}💡 Próximos pasos:${NC}"
echo -e "   1. Verifica que la variable NEXT_PUBLIC_FLIP_TO_EARN_FAUCET_CONTRACT_ADDRESS_BASE_SEPOLIA esté en tu .env.local"
echo -e "   2. Reinicia tu servidor de desarrollo si está corriendo"
echo -e "   3. ¡Tu frontend ya puede interactuar con el contrato desplegado!"
echo -e ""
echo -e "${BLUE}🔗 Puedes verificar el contrato en BaseScan:${NC}"
echo -e "   https://sepolia.basescan.org/address/[CONTRACT_ADDRESS]"
