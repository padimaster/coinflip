#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Script para automatizar la actualización del ABI y dirección del contrato
 * después de desplegar en Sepolia
 * 
 * Uso: node scripts/post-deploy.js [chainId]
 * Ejemplo: node scripts/post-deploy.js 84532
 */

const CHAIN_ID = process.argv[2] || '84532'; // Base Sepolia por defecto
const PROJECT_ROOT = path.join(__dirname, '..');
const CONTRACTS_DIR = path.join(PROJECT_ROOT, 'contracts');
const FRONTEND_DIR = path.join(PROJECT_ROOT, 'frontend');

// Rutas de archivos
const ABI_SOURCE = path.join(CONTRACTS_DIR, 'out', 'CoinFlip.sol', 'CoinFlip.json');
const BROADCAST_DIR = path.join(CONTRACTS_DIR, 'broadcast', 'CoinFlip.s.sol', CHAIN_ID);
const CONTRACT_DEST = path.join(FRONTEND_DIR, 'src', 'contracts', 'coin-flip.contract.ts');
const ENV_FILE = path.join(FRONTEND_DIR, '.env.local');

console.log('🚀 Iniciando actualización post-despliegue...');
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
            tx.transactionType === 'CREATE' && tx.contractName === 'CoinFlip'
        );
        
        if (!createTransaction) {
            throw new Error('No se encontró la transacción de creación del contrato CoinFlip');
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
        const contractContent = `export const coinFlipContractAddress = process.env.NEXT_PUBLIC_COIN_FLIP_CONTRACT_ADDRESS;

export const abi = ${JSON.stringify(abi, null, 2)} as const;
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
        
        // Buscar si ya existe la variable
        const envVarName = 'NEXT_PUBLIC_COIN_FLIP_CONTRACT_ADDRESS';
        const envVarRegex = new RegExp(`^${envVarName}=.*$`, 'm');
        
        if (envVarRegex.test(envContent)) {
            // Actualizar variable existente
            envContent = envContent.replace(envVarRegex, `${envVarName}=${contractAddress}`);
        } else {
            // Agregar nueva variable
            envContent += envContent.endsWith('\n') ? '' : '\n';
            envContent += `${envVarName}=${contractAddress}\n`;
        }
        
        fs.writeFileSync(ENV_FILE, envContent, 'utf8');
        console.log(`✅ Archivo .env.local actualizado: ${ENV_FILE}`);
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
        console.log('   1. Verifica que la variable NEXT_PUBLIC_COIN_FLIP_CONTRACT_ADDRESS esté en tu .env.local');
        console.log('   2. Reinicia tu servidor de desarrollo si está corriendo');
        console.log('   3. ¡Tu frontend ya puede interactuar con el contrato desplegado!');
        
    } catch (error) {
        console.error('\n💥 Error durante la ejecución:', error.message);
        process.exit(1);
    }
}

// Ejecutar script
main();
