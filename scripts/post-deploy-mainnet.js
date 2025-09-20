#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Script para automatizar la actualización del ABI y dirección del contrato
 * después de desplegar en Base Mainnet
 * 
 * Uso: node scripts/post-deploy-mainnet.js [chainId]
 * Ejemplo: node scripts/post-deploy-mainnet.js 8453
 */

const CHAIN_ID = process.argv[2] || '8453'; // Base Mainnet por defecto
const PROJECT_ROOT = path.join(__dirname, '..');
const CONTRACTS_DIR = path.join(PROJECT_ROOT, 'packages', 'contracts');
const FRONTEND_DIR = path.join(PROJECT_ROOT, 'apps', 'miniapp');

// Rutas de archivos
const ABI_SOURCE = path.join(CONTRACTS_DIR, 'out', 'FlipToEarnFaucet.sol', 'FlipToEarnFaucet.json');
const BROADCAST_DIR = path.join(CONTRACTS_DIR, 'broadcast', 'FlipToEarnFaucet.s.sol', CHAIN_ID);
const CONTRACT_DEST = path.join(FRONTEND_DIR, 'src', 'contracts', 'coin-flip.contract.ts');
const ENV_FILE = path.join(FRONTEND_DIR, '.env.local');

console.log('🚀 Iniciando actualización post-despliegue para Base Mainnet...');
console.log(`📡 Chain ID: ${CHAIN_ID}`);

/**
 * Encuentra el archivo de broadcast más reciente
 */
function findLatestBroadcastFile() {
    try {
        const files = fs.readdirSync(BROADCAST_DIR)
            .filter(file => file.startsWith('run-'))
            .sort()
            .reverse();
        
        if (files.length === 0) {
            throw new Error(`No se encontraron archivos de broadcast en ${BROADCAST_DIR}`);
        }
        
        return path.join(BROADCAST_DIR, files[0]);
    } catch (error) {
        console.error('❌ Error al buscar archivo de broadcast:', error.message);
        process.exit(1);
    }
}

/**
 * Extrae la dirección del contrato del archivo de broadcast
 */
function extractContractAddress(broadcastFile) {
    try {
        const broadcastData = JSON.parse(fs.readFileSync(broadcastFile, 'utf8'));
        
        // Buscar la transacción de creación del contrato
        const createTransaction = broadcastData.transactions.find(tx => 
            tx.transactionType === 'CREATE' && tx.contractName === 'FlipToEarnFaucet'
        );
        
        if (!createTransaction) {
            throw new Error('No se encontró la transacción de creación del contrato FlipToEarnFaucet');
        }
        
        const contractAddress = createTransaction.contractAddress;
        console.log(`📍 Dirección del contrato encontrada: ${contractAddress}`);
        return contractAddress;
    } catch (error) {
        console.error('❌ Error al extraer dirección del contrato:', error.message);
        process.exit(1);
    }
}

/**
 * Extrae el ABI del archivo JSON compilado
 */
function extractABI() {
    try {
        if (!fs.existsSync(ABI_SOURCE)) {
            throw new Error(`Archivo ABI no encontrado: ${ABI_SOURCE}`);
        }
        
        const contractData = JSON.parse(fs.readFileSync(ABI_SOURCE, 'utf8'));
        const abi = contractData.abi;
        
        console.log(`📋 ABI extraído con ${abi.length} funciones`);
        return abi;
    } catch (error) {
        console.error('❌ Error al extraer ABI:', error.message);
        process.exit(1);
    }
}

/**
 * Actualiza el archivo de contrato con el ABI
 */
function updateContractFile(abi) {
    try {
        const contractContent = `// Auto-generated contract configuration
// Generated on: ${new Date().toISOString()}
// Chain ID: ${CHAIN_ID}

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
  chainId: ${CHAIN_ID},
  network: 'base-mainnet',
} as const;

// Contract function signatures for type safety
export type FaucetContract = typeof FAUCET_CONTRACT_ABI;
`;
        
        fs.writeFileSync(CONTRACT_DEST, contractContent, 'utf8');
        console.log(`✅ Archivo de contrato actualizado: ${CONTRACT_DEST}`);
    } catch (error) {
        console.error('❌ Error al actualizar archivo de contrato:', error.message);
        process.exit(1);
    }
}

/**
 * Actualiza o crea el archivo .env.local con la dirección del contrato
 */
function updateEnvFile(contractAddress) {
    try {
        let envContent = '';
        
        // Leer archivo existente si existe
        if (fs.existsSync(ENV_FILE)) {
            envContent = fs.readFileSync(ENV_FILE, 'utf8');
        }
        
        // Definir todas las variables de entorno que necesitamos
        const envVars = [
            {
                name: 'NEXT_PUBLIC_FLIP_TO_EARN_FAUCET_CONTRACT_ADDRESS_LOCAL',
                value: process.env.NEXT_PUBLIC_FLIP_TO_EARN_FAUCET_CONTRACT_ADDRESS_LOCAL || ''
            },
            {
                name: 'NEXT_PUBLIC_FLIP_TO_EARN_FAUCET_CONTRACT_ADDRESS_BASE_SEPOLIA',
                value: process.env.NEXT_PUBLIC_FLIP_TO_EARN_FAUCET_CONTRACT_ADDRESS_BASE_SEPOLIA || ''
            },
            {
                name: 'NEXT_PUBLIC_FLIP_TO_EARN_FAUCET_CONTRACT_ADDRESS_BASE_MAINNET',
                value: contractAddress // This is the current deployment
            }
        ];
        
        // Procesar cada variable de entorno
        envVars.forEach(envVar => {
            const envVarRegex = new RegExp(`^${envVar.name}=.*$`, 'm');
            
            if (envVarRegex.test(envContent)) {
                // Actualizar variable existente
                envContent = envContent.replace(envVarRegex, `${envVar.name}=${envVar.value}`);
            } else {
                // Agregar nueva variable
                envContent += envContent.endsWith('\n') ? '' : '\n';
                envContent += `${envVar.name}=${envVar.value}\n`;
            }
        });
        
        fs.writeFileSync(ENV_FILE, envContent, 'utf8');
        console.log(`✅ Archivo .env.local actualizado: ${ENV_FILE}`);
        console.log(`   • NEXT_PUBLIC_FLIP_TO_EARN_FAUCET_CONTRACT_ADDRESS_BASE_MAINNET=${contractAddress}`);
    } catch (error) {
        console.error('❌ Error al actualizar archivo .env:', error.message);
        process.exit(1);
    }
}

/**
 * Función principal
 */
function main() {
    try {
        console.log('\n🔍 Buscando archivo de broadcast más reciente...');
        const broadcastFile = findLatestBroadcastFile();
        console.log(`📄 Archivo encontrado: ${path.basename(broadcastFile)}`);
        
        console.log('\n📍 Extrayendo dirección del contrato...');
        const contractAddress = extractContractAddress(broadcastFile);
        
        console.log('\n📋 Extrayendo ABI...');
        const abi = extractABI();
        
        console.log('\n💾 Actualizando archivos...');
        updateContractFile(abi);
        updateEnvFile(contractAddress);
        
        console.log('\n🎉 ¡Actualización completada exitosamente!');
        console.log('\n📝 Resumen:');
        console.log(`   • Dirección del contrato: ${contractAddress}`);
        console.log(`   • ABI actualizado en: ${path.relative(PROJECT_ROOT, CONTRACT_DEST)}`);
        console.log(`   • Variable de entorno en: ${path.relative(PROJECT_ROOT, ENV_FILE)}`);
        console.log('\n💡 Próximos pasos:');
        console.log('   1. Verifica que la variable NEXT_PUBLIC_FLIP_TO_EARN_FAUCET_CONTRACT_ADDRESS_BASE_MAINNET esté en tu .env.local');
        console.log('   2. Reinicia tu servidor de desarrollo si está corriendo');
        console.log('   3. ¡Tu frontend ya puede interactuar con el contrato desplegado!');
        
    } catch (error) {
        console.error('\n💥 Error durante la ejecución:', error.message);
        process.exit(1);
    }
}

// Ejecutar script
main();
