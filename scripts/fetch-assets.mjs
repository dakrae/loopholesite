// Fetches the one asset that still lives on a remote host — the YouTube
// thumbnail for the video on the main page — into public/, so the site
// serves everything same-origin. It is skipped when the file already
// exists, and a failure is a warning rather than a build error: drop your
// own image at public/images/video-doom.jpg to override it for good.
//
// Everything else (photos, album covers, press-kit PDFs) is committed
// under public/.
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const ASSETS = [
  {
    dest: 'public/images/video-doom.jpg',
    urls: [
      'https://i.ytimg.com/vi/oLf0dvIrwU4/maxresdefault.jpg',
      'https://i.ytimg.com/vi/oLf0dvIrwU4/hqdefault.jpg',
    ],
  },
];

let ok = 0, skipped = 0, failed = 0;

for (const asset of ASSETS) {
  const dest = join(root, asset.dest);
  if (existsSync(dest)) { skipped++; continue; }
  let done = false;
  for (const url of asset.urls) {
    try {
      const res = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 (loophole-site build)' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      mkdirSync(dirname(dest), { recursive: true });
      writeFileSync(dest, buf);
      console.log(`fetched  ${asset.dest} (${(buf.length / 1024).toFixed(0)} kB)`);
      ok++; done = true;
      break;
    } catch (e) {
      console.warn(`warn     ${asset.dest}: ${url} → ${e.message}`);
    }
  }
  if (!done) failed++;
}

console.log(`assets: ${ok} fetched, ${skipped} already present, ${failed} missing`);
if (failed > 0) {
  console.warn('Missing assets render as an empty placeholder — commit the file to public/ to fix permanently.');
}
