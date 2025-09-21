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
const CONTRACTS_DIR = path.join(PROJECT_ROOT, 'packages', 'contracts');
const FRONTEND_DIR = path.join(PROJECT_ROOT, 'apps', 'miniapp');

// Rutas de archivos
const ABI_SOURCE = path.join(CONTRACTS_DIR, 'out', 'FlipToEarnFaucet.sol', 'FlipToEarnFaucet.json');
const BROADCAST_DIR = path.join(CONTRACTS_DIR, 'broadcast', 'FlipToEarnFaucet.s.sol', CHAIN_ID);
const CONTRACT_DEST = path.join(FRONTEND_DIR, 'src', 'contracts', 'abis.ts');
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
 * Valida que el ABI tenga las funciones esenciales
 */
function validateABI(abi) {
    // Funciones esenciales que deben existir en el contrato FlipToEarnFaucet
    const requiredFunctions = [
        'claimReward',
        'getUserNonce', 
        'getDailyClaimsLimit',
        'getDailyClaimsCount',
        'getContractBalance',
        'getDropAmount'
    ];
    
    const abiFunctions = abi.filter(item => item.type === 'function').map(item => item.name);
    
    const missingFunctions = requiredFunctions.filter(func => !abiFunctions.includes(func));
    
    if (missingFunctions.length > 0) {
        throw new Error(`ABI inválido: faltan funciones esenciales: ${missingFunctions.join(', ')}`);
    }
    
    console.log(`✅ ABI validado: ${abiFunctions.length} funciones encontradas`);
    console.log(`   • Funciones esenciales: ${requiredFunctions.join(', ')}`);
}

/**
 * Crea un backup del archivo ABI actual
 */
function createABIBackup() {
    try {
        if (fs.existsSync(CONTRACT_DEST)) {
            const backupPath = CONTRACT_DEST.replace('.ts', `.backup.${Date.now()}.ts`);
            fs.copyFileSync(CONTRACT_DEST, backupPath);
            console.log(`📦 Backup creado: ${path.basename(backupPath)}`);
        }
    } catch (error) {
        console.warn('⚠️  No se pudo crear backup:', error.message);
    }
}

/**
 * Actualiza el archivo de contrato con el ABI
 */
function updateContractFile(abi) {
    try {
        // Validar ABI antes de escribir
        validateABI(abi);
        
        // Crear backup del archivo actual
        createABIBackup();
        
        const contractContent = `// ⚠️  AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
// Generated on: ${new Date().toISOString()}
// Chain ID: ${CHAIN_ID}
// Network: Base Sepolia
// This file is automatically updated by post-deploy scripts
// Manual edits will be overwritten on next deployment

export const FLIP_TO_EARN_FAUCET_CONTRACT_ABI = ${JSON.stringify(abi, null, 2)} as const;

export type FlipToEarnFaucetContract = typeof FLIP_TO_EARN_FAUCET_CONTRACT_ABI;
`;
        
        fs.writeFileSync(CONTRACT_DEST, contractContent, 'utf8');
        console.log(`✅ Archivo ABI actualizado: ${CONTRACT_DEST}`);
    } catch (error) {
        console.error('❌ Error al actualizar archivo ABI:', error.message);
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
                value: contractAddress // This is the current deployment
            },
            {
                name: 'NEXT_PUBLIC_FLIP_TO_EARN_FAUCET_CONTRACT_ADDRESS_BASE_MAINNET',
                value: process.env.NEXT_PUBLIC_FLIP_TO_EARN_FAUCET_CONTRACT_ADDRESS_BASE_MAINNET || ''
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
        console.log(`   • NEXT_PUBLIC_FLIP_TO_EARN_FAUCET_CONTRACT_ADDRESS_BASE_SEPOLIA=${contractAddress}`);
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
        console.log('   1. Verifica que la variable NEXT_PUBLIC_FLIP_TO_EARN_FAUCET_CONTRACT_ADDRESS_BASE_SEPOLIA esté en tu .env.local');
        console.log('   2. Reinicia tu servidor de desarrollo si está corriendo');
        console.log('   3. ¡Tu frontend ya puede interactuar con el contrato desplegado!');
        
    } catch (error) {
        console.error('\n💥 Error durante la ejecución:', error.message);
        process.exit(1);
    }
}

// Ejecutar script
main();
