/**
 * Generate PNG icons from SVG source files
 *
 * Usage: node scripts/generate-icons.js
 *
 * Requires: npm install sharp
 */

const sharp = require('sharp');
const { readFileSync } = require('fs');
const { join } = require('path');

const publicDir = join(__dirname, '..', 'public');

const icons = [
  { input: 'pwa-192x192.svg', output: 'pwa-192x192.png', size: 192 },
  { input: 'pwa-512x512.svg', output: 'pwa-512x512.png', size: 512 },
  { input: 'apple-touch-icon.svg', output: 'apple-touch-icon.png', size: 180 },
  { input: 'favicon.svg', output: 'favicon-32.png', size: 32 },
  { input: 'favicon.svg', output: 'favicon-16.png', size: 16 },
];

async function generateIcons() {
  console.log('Generating PNG icons from SVG sources...\n');

  for (const icon of icons) {
    const inputPath = join(publicDir, icon.input);
    const outputPath = join(publicDir, icon.output);

    try {
      const svgBuffer = readFileSync(inputPath);

      await sharp(svgBuffer)
        .resize(icon.size, icon.size)
        .png()
        .toFile(outputPath);

      console.log(`+ Generated ${icon.output} (${icon.size}x${icon.size})`);
    } catch (error) {
      console.error(`x Failed to generate ${icon.output}: ${error.message}`);
    }
  }

  console.log('\nDone! PNG icons are in the public folder.');
}

generateIcons().catch(console.error);
