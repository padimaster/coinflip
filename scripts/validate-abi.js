#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Script para validar que el ABI en abis.ts coincida con el contrato compilado
 * 
 * Uso: node scripts/validate-abi.js
 */

const PROJECT_ROOT = path.join(__dirname, '..');
const CONTRACTS_DIR = path.join(PROJECT_ROOT, 'packages', 'contracts');
const FRONTEND_DIR = path.join(PROJECT_ROOT, 'apps', 'miniapp');

// Rutas de archivos
const ABI_SOURCE = path.join(CONTRACTS_DIR, 'out', 'FlipToEarnFaucet.sol', 'FlipToEarnFaucet.json');
const ABI_DEST = path.join(FRONTEND_DIR, 'src', 'contracts', 'abis.ts');

console.log('🔍 Validando consistencia del ABI...');

/**
 * Extrae el ABI del archivo JSON compilado
 */
function extractCompiledABI() {
    try {
        if (!fs.existsSync(ABI_SOURCE)) {
            throw new Error(`Archivo ABI compilado no encontrado: ${ABI_SOURCE}`);
        }
        
        const contractData = JSON.parse(fs.readFileSync(ABI_SOURCE, 'utf8'));
        return contractData.abi;
    } catch (error) {
        console.error('❌ Error al extraer ABI compilado:', error.message);
        process.exit(1);
    }
}

/**
 * Extrae el ABI del archivo TypeScript
 */
function extractFrontendABI() {
    try {
        if (!fs.existsSync(ABI_DEST)) {
            throw new Error(`Archivo ABI frontend no encontrado: ${ABI_DEST}`);
        }
        
        const content = fs.readFileSync(ABI_DEST, 'utf8');
        
        // Buscar la línea que contiene el ABI
        const abiMatch = content.match(/export const FLIP_TO_EARN_FAUCET_CONTRACT_ABI = (\[[\s\S]*?\]) as const;/);
        
        if (!abiMatch) {
            throw new Error('No se pudo extraer el ABI del archivo TypeScript');
        }
        
        return JSON.parse(abiMatch[1]);
    } catch (error) {
        console.error('❌ Error al extraer ABI frontend:', error.message);
        process.exit(1);
    }
}

/**
 * Compara dos ABIs
 */
function compareABIs(abi1, abi2) {
    // Normalizar ABIs para comparación
    const normalizeABI = (abi) => {
        return abi
            .filter(item => item.type === 'function' || item.type === 'event' || item.type === 'constructor')
            .map(item => ({
                type: item.type,
                name: item.name || 'constructor',
                inputs: item.inputs || [],
                outputs: item.outputs || []
            }))
            .sort((a, b) => {
                if (a.type !== b.type) return a.type.localeCompare(b.type);
                return a.name.localeCompare(b.name);
            });
    };
    
    const normalized1 = normalizeABI(abi1);
    const normalized2 = normalizeABI(abi2);
    
    if (normalized1.length !== normalized2.length) {
        return {
            match: false,
            error: `Diferente número de elementos: ${normalized1.length} vs ${normalized2.length}`
        };
    }
    
    for (let i = 0; i < normalized1.length; i++) {
        const item1 = normalized1[i];
        const item2 = normalized2[i];
        
        if (JSON.stringify(item1) !== JSON.stringify(item2)) {
            return {
                match: false,
                error: `Diferencia en elemento ${i}: ${item1.name} vs ${item2.name}`
            };
        }
    }
    
    return { match: true };
}

/**
 * Función principal
 */
function main() {
    try {
        console.log('\n📋 Extrayendo ABI compilado...');
        const compiledABI = extractCompiledABI();
        console.log(`   • ${compiledABI.length} elementos encontrados`);
        
        console.log('\n📋 Extrayendo ABI frontend...');
        const frontendABI = extractFrontendABI();
        console.log(`   • ${frontendABI.length} elementos encontrados`);
        
        console.log('\n🔍 Comparando ABIs...');
        const comparison = compareABIs(compiledABI, frontendABI);
        
        if (comparison.match) {
            console.log('✅ Los ABIs coinciden perfectamente');
            console.log('\n🎉 Validación exitosa!');
        } else {
            console.log('❌ Los ABIs NO coinciden');
            console.log(`   • Error: ${comparison.error}`);
            console.log('\n💡 Solución:');
            console.log('   1. Ejecuta el script post-deploy correspondiente');
            console.log('   2. O regenera el ABI manualmente');
            process.exit(1);
        }
        
    } catch (error) {
        console.error('\n💥 Error durante la validación:', error.message);
        process.exit(1);
    }
}

// Ejecutar script
main();
