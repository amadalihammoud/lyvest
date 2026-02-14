
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_DIR = path.join(__dirname, '../public');

const IMAGES_TO_CONVERT = [
    'banner-slide-1.png',
    'banner-slide-2.png',
    'hero-banner.png',
    'lyvest-red-logo.png',
    'visa-logo.png',
    'pix-logo.png',
    'lets-encrypt.png',
    'instagram-logo.png',
    'facebook-logo.png',
    'x-logo.png',
    'login-featured.png',
    'ly-avatar.png',
    'footer-logo.png'
];

async function convertImages() {
    console.log('Starting image optimization...');

    for (const filename of IMAGES_TO_CONVERT) {
        const inputPath = path.join(PUBLIC_DIR, filename);
        const outputPath = path.join(PUBLIC_DIR, filename.replace('.png', '.webp'));

        if (!fs.existsSync(inputPath)) {
            console.warn(`⚠️  File not found: ${filename}`);
            continue;
        }

        try {
            await sharp(inputPath)
                .webp({ quality: 80 })
                .toFile(outputPath);

            const originalSize = fs.statSync(inputPath).size / 1024;
            const newSize = fs.statSync(outputPath).size / 1024;

            console.log(`✅ Converted ${filename}`);
            console.log(`   Size: ${originalSize.toFixed(2)}KB -> ${newSize.toFixed(2)}KB (-${(100 - (newSize / originalSize * 100)).toFixed(1)}%)`);
        } catch (error) {
            console.error(`❌ Failed to convert ${filename}:`, error);
        }
    }
}

convertImages();
