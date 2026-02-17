import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🖼️  OTIMIZADOR DE IMAGEM LCP');
console.log('================================\n');

const inputPath = 'public/banner-slide-1-mobile.webp';
const outputPath = 'public/banner-slide-1-mobile-optimized.webp';
const backupPath = 'public/banner-slide-1-mobile-original.webp';

// Verificar se arquivo existe
if (!fs.existsSync(inputPath)) {
    console.error(`❌ Arquivo não encontrado: ${inputPath}`);
    console.log('\nVerifique:');
    console.log('1. O nome do arquivo está correto?');
    console.log('2. O arquivo está na pasta public/?');
    process.exit(1);
}

const originalSize = fs.statSync(inputPath).size;

console.log(`📁 Arquivo original: ${inputPath}`);
console.log(`📊 Tamanho original: ${(originalSize / 1024).toFixed(2)} KB\n`);

console.log('⚙️  Processando...\n');

// Criar backup
if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(inputPath, backupPath);
    console.log(`✅ Backup criado: ${backupPath}`);
}

// Read to buffer to avoid file locking on Windows
const inputBuffer = fs.readFileSync(inputPath);

// Otimizar imagem
sharp(inputBuffer)
    .resize(1080, 1920, {
        fit: 'cover',
        position: 'center',
        withoutEnlargement: true
    })
    .webp({
        quality: 85,
        effort: 6, // 0-6, maior = mais compressão (mais lento)
        lossless: false
    })
    .toFile(outputPath)
    .then(info => {
        console.log('\n🎉 SUCESSO!');
        console.log('================================');
        console.log(`📁 Arquivo otimizado: ${outputPath}`);
        console.log(`📊 Tamanho novo: ${(info.size / 1024).toFixed(2)} KB`);
        console.log(`💾 Economia: ${((1 - info.size / originalSize) * 100).toFixed(2)}%`);
        console.log(`⚡ Redução: ${((originalSize - info.size) / 1024).toFixed(2)} KB`);

        // Rename immediately as per plan
        fs.renameSync(outputPath, inputPath);
        console.log(`\n✅ Arquivo original SUBSTITUÍDO pelo otimizado: ${inputPath}`);
    })
    .catch(err => {
        console.error('\n❌ ERRO ao otimizar imagem:');
        console.error(err.message);
        process.exit(1);
    });
