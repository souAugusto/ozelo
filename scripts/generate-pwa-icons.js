// One-off script to rasterize public/ozelo-icon(.maskable).svg into the PNG
// sizes referenced by public/manifest.json and the apple-touch-icon link.
// Run with: node scripts/generate-pwa-icons.js
// Requires `sharp` (npm install --no-save sharp) — not a runtime dependency.
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const ICONS_DIR = path.join(PUBLIC_DIR, 'icons');

const STANDARD_SIZES = [192, 512];
const MASKABLE_SIZES = [192, 512];
const APPLE_TOUCH_SIZE = 180;
const FAVICON_SIZES = [16, 32];

async function main() {
  fs.mkdirSync(ICONS_DIR, { recursive: true });

  const standardSvg = fs.readFileSync(path.join(PUBLIC_DIR, 'ozelo-icon.svg'));
  const maskableSvg = fs.readFileSync(path.join(PUBLIC_DIR, 'ozelo-icon-maskable.svg'));

  for (const size of STANDARD_SIZES) {
    const out = path.join(ICONS_DIR, `icon-${size}.png`);
    await sharp(standardSvg).resize(size, size).png().toFile(out);
    console.log('wrote', out);
  }

  for (const size of MASKABLE_SIZES) {
    const out = path.join(ICONS_DIR, `icon-maskable-${size}.png`);
    await sharp(maskableSvg).resize(size, size).png().toFile(out);
    console.log('wrote', out);
  }

  const appleOut = path.join(PUBLIC_DIR, 'apple-touch-icon.png');
  await sharp(standardSvg).resize(APPLE_TOUCH_SIZE, APPLE_TOUCH_SIZE).flatten({ color: '#0F0F14' }).png().toFile(appleOut);
  console.log('wrote', appleOut);

  for (const size of FAVICON_SIZES) {
    const out = path.join(PUBLIC_DIR, `favicon-${size}.png`);
    await sharp(standardSvg).resize(size, size).png().toFile(out);
    console.log('wrote', out);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
