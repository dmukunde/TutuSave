// One-off generator for the PWA app icons under public/icons.
// Re-run with `node scripts/generate-pwa-icons.mjs` any time the mark
// or brand colors change. Uses `sharp` (already present in
// node_modules) purely as a build-time tool — it is not a runtime
// dependency of the app.
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "public", "icons");

const BG = "#171717"; // matches the app's neutral/near-black primary color
const FG = "#ffffff";

// A bold geometric "T" (two rects), centered on a 512x512 canvas.
// Kept well inside Android's maskable safe zone (center ~80% circle).
const glyph = `
  <rect x="136" y="146" width="240" height="54" rx="14" fill="${FG}" />
  <rect x="229" y="146" width="54" height="220" rx="14" fill="${FG}" />
`;

// Rounded-square version: looks right wherever the OS shows icons "as is".
const roundedSvg = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="112" fill="${BG}" />
  ${glyph}
</svg>`;

// Full-bleed, no rounding: for maskable + apple-touch-icon, where the OS
// applies its own mask/corner shape and expects edge-to-edge artwork.
const fullBleedSvg = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="${BG}" />
  ${glyph}
</svg>`;

async function render(svg, size, filename) {
  const buffer = await sharp(Buffer.from(svg), { density: 384 })
    .resize(size, size)
    .png()
    .toBuffer();
  await writeFile(path.join(outDir, filename), buffer);
  console.log(`wrote ${filename} (${size}x${size})`);
}

await mkdir(outDir, { recursive: true });
await render(roundedSvg, 192, "icon-192.png");
await render(roundedSvg, 512, "icon-512.png");
await render(fullBleedSvg, 512, "icon-maskable.png");
await render(fullBleedSvg, 180, "apple-touch-icon.png");
