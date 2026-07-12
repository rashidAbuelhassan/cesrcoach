/**
 * Regenerates the PWA / home-screen icons from public/branding/logo-icon.svg.
 * Run after changing the logo:  npm run icons
 */
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const src = path.join(root, "public", "branding", "logo-icon.svg");
const out = path.join(root, "public", "icons");

await mkdir(out, { recursive: true });

const targets = [
  { file: "icon-192.png", size: 192, pad: 0 },
  { file: "icon-512.png", size: 512, pad: 0 },
  { file: "apple-touch-icon.png", size: 180, pad: 0 },
  // maskable: icon shrunk into the middle 80% "safe zone" on a solid backdrop
  { file: "icon-maskable-512.png", size: 512, pad: 64 },
];

for (const t of targets) {
  const inner = t.size - t.pad * 2;
  const icon = await sharp(src).resize(inner, inner).png().toBuffer();
  await sharp({
    create: {
      width: t.size,
      height: t.size,
      channels: 4,
      background: { r: 6, g: 10, b: 24, alpha: t.pad ? 1 : 0 },
    },
  })
    .composite([{ input: icon, top: t.pad, left: t.pad }])
    .png()
    .toFile(path.join(out, t.file));
  console.log(`✓ ${t.file}`);
}

console.log("Icons regenerated in public/icons/");
