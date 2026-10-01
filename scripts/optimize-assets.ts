#!/usr/bin/env node
/* eslint-disable no-console */
// One-off image optimization for `public/images/`.
//
// Pipeline per source file (JPEG / PNG):
//   1. `.rotate()` — applies the EXIF orientation tag to the pixels and
//      strips it, so the saved file is upright in every browser (some
//      renderers ignore the EXIF tag in CSS `image-set()` backgrounds).
//   2. `.resize({ width: 1920, withoutEnlargement: true })` — cap the long
//      edge so mobile doesn't download > retina content.
//   3. WebP at quality 80 alongside the re-rotated original. The original
//      stays as a JPEG fallback for browsers without WebP support.
//
// Usage:  npm run optimize-assets

import { rename } from 'node:fs/promises';
import { readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import sharp from 'sharp';

const ROOT = resolve(import.meta.dirname, '..');
const PUBLIC_DIR = join(ROOT, 'public');

async function listImages(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    if (entry.isFile() && /\.(jpe?g|png)$/i.test(entry.name)) {
      files.push(join(dir, entry.name));
    }
  }
  return files;
}

async function optimizeOne(path: string): Promise<void> {
  const ext = path.match(/\.(jpe?g|png)$/i)![0];
  const before = await sharp(path).metadata();

  // Bake the EXIF orientation into pixels and write back so the fallback
  // URL (`/images/hero.jpg`) is also upright. Sharp refuses same-file
  // output, so write to a sibling `.tmp` and rename.
  const tmpOut = `${path}.tmp`;
  const pipeline = sharp(path).rotate().resize({ width: 1920, withoutEnlargement: true });
  if (/jpe?g/i.test(ext)) {
    await pipeline.jpeg({ quality: 90, mozjpeg: true }).toFile(tmpOut);
  } else {
    await pipeline.png({ compressionLevel: 9 }).toFile(tmpOut);
  }
  await rename(tmpOut, path);

  const webpOut = path.replace(/\.(jpe?g|png)$/i, '.webp');
  await sharp(path).rotate().resize({ width: 1920, withoutEnlargement: true })
    .webp({ quality: 80 }).toFile(webpOut);
  const after = await sharp(webpOut).metadata();

  console.log(
    `[ok] ${path} (re-rotated, ${before.width}x${before.height}) + ${webpOut} (${after.width}x${after.height})`,
  );
}

async function main(): Promise<void> {
  const dirs = ['images'].map((d) => join(PUBLIC_DIR, d));
  let count = 0;
  for (const dir of dirs) {
    const files = await listImages(dir).catch(() => []);
    for (const file of files) {
      await optimizeOne(file);
      count += 1;
    }
  }
  if (count === 0) console.log('No images found.');
}

main().catch((err: unknown) => {
  console.error('optimize-assets failed:', err);
  process.exit(1);
});
