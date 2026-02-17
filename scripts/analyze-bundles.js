import fs from 'fs';
import path from 'path';

const chunksDir = '.next/static/chunks';

if (!fs.existsSync(chunksDir)) {
    console.log('❌ .next não encontrado. Execute npm run build primeiro');
    process.exit(1);
}

const files = fs.readdirSync(chunksDir)
    .filter(f => f.endsWith('.js'))
    .map(f => ({
        name: f,
        size: fs.statSync(path.join(chunksDir, f)).size / 1024
    }))
    .sort((a, b) => b.size - a.size);

console.log('📊 Top 10 maiores chunks:');
console.log('----------------------------------------');

files.slice(0, 10).forEach((file, i) => {
    console.log(`${i + 1}. ${file.name}: ${file.size.toFixed(2)} KB`);
});

const totalSize = files.reduce((sum, f) => sum + f.size, 0);
console.log('----------------------------------------');
console.log(`Total: ${totalSize.toFixed(2)} KB`);
