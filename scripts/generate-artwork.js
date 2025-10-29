#!/usr/bin/env node
/*
  Regenerate public/invitation_2.png from public/invitation_2.svg
  at higher resolution so it looks crisp on devices and in editors.
*/
const fs = require('fs');
const path = require('path');

async function main() {
  const sharp = require('sharp');
  const svgPath = path.join(__dirname, '..', 'public', 'invitation_2.svg');
  const pngPath = path.join(__dirname, '..', 'public', 'invitation_2.png');

  if (!fs.existsSync(svgPath)) {
    console.error('SVG not found:', svgPath);
    process.exit(1);
  }

  // Target higher resolution (4x of 768 → 3072) for extra crispness
  const targetWidth = parseInt(process.env.WIDTH || '3072', 10);

  const svgBuffer = fs.readFileSync(svgPath);
  await sharp(svgBuffer)
    .resize({ width: targetWidth })
    .png({ compressionLevel: 9, quality: 90 })
    .toFile(pngPath);

  console.log('Rebuilt PNG at', pngPath, 'width', targetWidth);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
