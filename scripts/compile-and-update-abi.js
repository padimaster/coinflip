#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Script para compilar el contrato y actualizar el ABI sin desplegar
 * 
 * Uso: node scripts/compile-and-update-abi.js
 */

const PROJECT_ROOT = path.join(__dirname, '..');
const CONTRACTS_DIR = path.join(PROJECT_ROOT, 'packages', 'contracts');
const FRONTEND_DIR = path.join(PROJECT_ROOT, 'apps', 'miniapp');

// Rutas de archivos
const ABI_SOURCE = path.join(CONTRACTS_DIR, 'out', 'FlipToEarnFaucet.sol', 'FlipToEarnFaucet.json');
const ABI_DEST = path.join(FRONTEND_DIR, 'src', 'contracts', 'abis.ts');

console.log('🔨 Compilando contrato y actualizando ABI...');

/**
 * Compila el contrato usando Foundry
 */
function compileContract() {
    try {
        console.log('\n🔨 Compilando contrato...');
        
        // Cambiar al directorio de contratos
        process.chdir(CONTRACTS_DIR);
        
        // Ejecutar forge build
        execSync('forge build', { 
            stdio: 'inherit',
            cwd: CONTRACTS_DIR
        });
        
        console.log('✅ Contrato compilado exitosamente');
        
        // Volver al directorio raíz
        process.chdir(PROJECT_ROOT);
        
    } catch (error) {
        console.error('❌ Error al compilar contrato:', error.message);
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
        if (fs.existsSync(ABI_DEST)) {
            const backupPath = ABI_DEST.replace('.ts', `.backup.${Date.now()}.ts`);
            fs.copyFileSync(ABI_DEST, backupPath);
            console.log(`📦 Backup creado: ${path.basename(backupPath)}`);
        }
    } catch (error) {
        console.warn('⚠️  No se pudo crear backup:', error.message);
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
        
        console.log(`📋 ABI extraído con ${abi.length} elementos`);
        return abi;
    } catch (error) {
        console.error('❌ Error al extraer ABI:', error.message);
        process.exit(1);
    }
}

/**
 * Actualiza el archivo ABI
 */
function updateABIFile(abi) {
    try {
        // Validar ABI antes de escribir
        validateABI(abi);
        
        // Crear backup del archivo actual
        createABIBackup();
        
        const contractContent = `// ⚠️  AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
// Generated on: ${new Date().toISOString()}
// Network: Development/Compilation
// This file is automatically updated by compile-and-update-abi script
// Manual edits will be overwritten on next compilation

export const FLIP_TO_EARN_FAUCET_CONTRACT_ABI = ${JSON.stringify(abi, null, 2)} as const;

export type FlipToEarnFaucetContract = typeof FLIP_TO_EARN_FAUCET_CONTRACT_ABI;
`;
        
        fs.writeFileSync(ABI_DEST, contractContent, 'utf8');
        console.log(`✅ Archivo ABI actualizado: ${path.relative(PROJECT_ROOT, ABI_DEST)}`);
    } catch (error) {
        console.error('❌ Error al actualizar archivo ABI:', error.message);
        process.exit(1);
    }
}

/**
 * Función principal
 */
function main() {
    try {
        console.log('\n🔍 Verificando estructura de directorios...');
        
        if (!fs.existsSync(CONTRACTS_DIR)) {
            throw new Error(`Directorio de contratos no encontrado: ${CONTRACTS_DIR}`);
        }
        
        if (!fs.existsSync(FRONTEND_DIR)) {
            throw new Error(`Directorio frontend no encontrado: ${FRONTEND_DIR}`);
        }
        
        // Compilar contrato
        compileContract();
        
        // Extraer ABI
        console.log('\n📋 Extrayendo ABI...');
        const abi = extractABI();
        
        // Actualizar archivo ABI
        console.log('\n💾 Actualizando archivo ABI...');
        updateABIFile(abi);
        
        console.log('\n🎉 ¡Compilación y actualización completada exitosamente!');
        console.log('\n📝 Resumen:');
        console.log(`   • Contrato compilado en: ${path.relative(PROJECT_ROOT, CONTRACTS_DIR)}`);
        console.log(`   • ABI actualizado en: ${path.relative(PROJECT_ROOT, ABI_DEST)}`);
        console.log('\n💡 Próximos pasos:');
        console.log('   1. El ABI está listo para usar en desarrollo');
        console.log('   2. Para desplegar, usa los scripts post-deploy correspondientes');
        console.log('   3. Para validar consistencia, usa: node scripts/validate-abi.js');
        
    } catch (error) {
        console.error('\n💥 Error durante la ejecución:', error.message);
        process.exit(1);
    }
}

// Ejecutar script
main();
