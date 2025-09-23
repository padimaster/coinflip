# Scripts de Despliegue Automatizado

Este directorio contiene scripts para automatizar el despliegue de contratos inteligentes y la actualización de archivos del frontend.

## 📁 Archivos

### `post-deploy.js`
Script de Node.js que actualiza automáticamente:
- **ABI del contrato** en `apps/miniapp/src/contracts/abis.ts`
- **Dirección del contrato** en `apps/miniapp/.env.local`

### `deploy-to-sepolia.sh`
Script completo de Bash que:
1. Compila los contratos
2. Despliega a Base Sepolia
3. Verifica el contrato en BaseScan
4. Ejecuta automáticamente `post-deploy.js`

### `deploy-to-mainnet.sh`
Script completo de Bash para Base Mainnet que:
1. Verifica balance y variables de entorno
2. Solicita confirmación del usuario
3. Compila los contratos
4. Despliega a Base Mainnet
5. Verifica el contrato en BaseScan
6. Ejecuta automáticamente `post-deploy.js`

## 🚀 Uso

### Opción 1: Despliegue Completo (Recomendado)

#### Para Base Sepolia (Testnet)
```bash
# Configurar variables de entorno
export PRIVATE_KEY="tu_clave_privada"
export BASE_SEPOLIA_URL="tu_url_rpc_base_sepolia"
export ETHERSCAN_API_KEY="tu_api_key_etherscan"

# Ejecutar despliegue completo
./scripts/deploy-to-sepolia.sh
# o usando pnpm
pnpm run deploy:sepolia
```

#### Para Base Mainnet (Producción)
```bash
# Configurar variables de entorno
export PRIVATE_KEY="tu_clave_privada"
export BASE_URL="tu_url_rpc_base_mainnet"
export ETHERSCAN_API_KEY="tu_api_key_etherscan"

# Ejecutar despliegue completo
./scripts/deploy-to-mainnet.sh
# o usando pnpm
pnpm run deploy:mainnet
```

### Opción 2: Solo Actualización Post-Despliegue

Si ya tienes un contrato desplegado y solo quieres actualizar los archivos:

```bash
# Para Base Sepolia (Chain ID: 84532)
node scripts/post-deploy.js 84532
# o usando pnpm
pnpm run post-deploy

# Para Base Mainnet (Chain ID: 8453)
node scripts/post-deploy.js 8453
# o usando pnpm
pnpm run post-deploy:base
```

## ⚙️ Configuración Requerida

### Variables de Entorno

```bash
# Obligatorias para despliegue
export PRIVATE_KEY="0x..."                    # Tu clave privada
export ETHERSCAN_API_KEY="tu_api_key"         # API Key de Etherscan

# Para Base Sepolia (Testnet)
export BASE_SEPOLIA_URL="https://..."         # URL RPC de Base Sepolia

# Para Base Mainnet (Producción)
export BASE_URL="https://..."                 # URL RPC de Base Mainnet
```

### Archivos de Configuración

El script busca automáticamente:
- **ABI**: `contracts/out/CoinFlip.sol/CoinFlip.json`
- **Broadcast**: `contracts/broadcast/CoinFlip.s.sol/[CHAIN_ID]/run-latest.json`

## 📋 Qué Hace el Script

### 1. Despliegue (`deploy-to-sepolia.sh` y `deploy-to-mainnet.sh`)
- ✅ Verifica variables de entorno
- ✅ Verifica balance (solo mainnet)
- ✅ Solicita confirmación (solo mainnet)
- ✅ Compila contratos con `forge build`
- ✅ Despliega a la red correspondiente con `forge script`
- ✅ Verifica contrato en BaseScan
- ✅ Ejecuta actualización automática

### 2. Actualización Post-Despliegue (`post-deploy.js`)
- ✅ Encuentra el archivo de broadcast más reciente
- ✅ Extrae la dirección del contrato desplegado
- ✅ Extrae el ABI del archivo compilado
- ✅ Actualiza `apps/miniapp/src/contracts/abis.ts`
- ✅ Crea/actualiza `apps/miniapp/.env.local`

## 📝 Archivos Actualizados

### `apps/miniapp/src/contracts/abis.ts`
```typescript
export const FLIP_TO_EARN_FAUCET_CONTRACT_ABI = [
  // ABI extraído automáticamente
] as const;

export type FlipToEarnFaucetContract = typeof FLIP_TO_EARN_FAUCET_CONTRACT_ABI;
```

### `apps/miniapp/.env.local`
```env
NEXT_PUBLIC_FLIP_TO_EARN_FAUCET_CONTRACT_ADDRESS_BASE_SEPOLIA=0x...
NEXT_PUBLIC_FLIP_TO_EARN_FAUCET_CONTRACT_ADDRESS_BASE_MAINNET=0x...
```

## 🔧 Personalización

### Cambiar Chain ID
Para desplegar a otra red, modifica el `CHAIN_ID` en los scripts correspondientes:

```bash
# En deploy-to-sepolia.sh (Base Sepolia)
CHAIN_ID="84532"
NETWORK="base-sepolia"

# En deploy-to-mainnet.sh (Base Mainnet)
CHAIN_ID="8453"
NETWORK="base"

# Para otra red personalizada, crea un nuevo script
CHAIN_ID="tu_chain_id"
NETWORK="tu_network_name"

```

### Cambiar Nombre del Contrato
Si cambias el nombre del contrato, actualiza las referencias en:
- `post-deploy.js`: `tx.contractName === 'FlipToEarnFaucet'`
- `deploy-to-sepolia.sh`: `script/FlipToEarnFaucet.s.sol:FlipToEarnFaucetScript`
- `deploy-to-mainnet.sh`: `script/FlipToEarnFaucet.s.sol:FlipToEarnFaucetScript`

## 🐛 Solución de Problemas

### Error: "No se encontraron archivos de broadcast"
- Verifica que el despliegue se completó exitosamente
- Asegúrate de que el Chain ID sea correcto
- Revisa que el directorio `contracts/broadcast/` existe

### Error: "Archivo ABI no encontrado"
- Ejecuta `forge build` en el directorio de contratos
- Verifica que el contrato se compiló correctamente

### Error: "Variables de entorno no configuradas"
- Configura todas las variables requeridas
- Usa `export` para hacerlas disponibles en la sesión actual

## 📚 Comandos Útiles

```bash
# Verificar compilación
cd contracts && forge build

# Verificar configuración
cd contracts && forge config

# Verificar balance
cast balance [ADDRESS] --rpc-url $BASE_SEPOLIA_URL

# Verificar contrato desplegado
cast code [CONTRACT_ADDRESS] --rpc-url $BASE_SEPOLIA_URL
```

## 🔗 Enlaces Útiles

### Base Sepolia (Testnet)
- [Base Sepolia Faucet](https://bridge.base.org/deposit)
- [BaseScan Sepolia](https://sepolia.basescan.org/)

### Base Mainnet (Producción)
- [Base Bridge](https://bridge.base.org/)
- [BaseScan Mainnet](https://basescan.org/)

### Documentación
- [Foundry Book](https://book.getfoundry.sh/)
- [Base Documentation](https://docs.base.org/)
- [Base RPC Endpoints](https://docs.base.org/tools/network-faucets)
