const sharp = require('sharp');
const path = require('path');

const SRC = path.join(__dirname, '..', 'assets', 'img', 'favicon.svg');
const OUT = path.join(__dirname, '..', 'assets', 'img');

const sizes = [
  { name: 'favicon.png', size: 32 },
  { name: 'apple-touch-icon.png', size: 180 },
];

async function main() {
  for (const { name, size } of sizes) {
    await sharp(SRC)
      .resize(size, size)
      .png()
      .toFile(path.join(OUT, name));
    console.log(`✓ ${name} (${size}×${size})`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
