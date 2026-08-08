// Downloads the few assets that still live on remote hosts into public/, so
// the site serves everything same-origin. Files that already exist are
// skipped — commit the real file to public/ and its entry becomes a no-op.
// Failures are warnings, not build errors, so the site still builds once the
// old Wix site is switched off.
//
// Everything else (background photo, booking banner, press photos, album
// covers, press-kit PDFs) is already committed under public/.
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const wix = (path) => `https://static.wixstatic.com/media/${path}`;

const ASSETS = [
  // Band member portraits — still the crops from the old site. Replace these
  // by committing the originals to public/images/band/.
  {
    dest: 'public/images/band/michel.jpg',
    urls: [wix('65e9d4_5f17698d003c43e1a9b7629b81d644db~mv2.jpg/v1/crop/x_320,y_0,w_1943,h_1710/fill/w_850,h_748,al_c,q_85/loophole-3_edited.jpg')],
  },
  {
    dest: 'public/images/band/claude.jpg',
    urls: [wix('65e9d4_a636b95e553d48c6b0b443b5b3541fee~mv2.jpg/v1/crop/x_0,y_123,w_2400,h_1710/fill/w_1050,h_748,al_c,q_85/loophole-5_edited.jpg')],
  },
  {
    dest: 'public/images/band/dave.jpg',
    urls: [wix('65e9d4_6b73b37d97734c6e85663f8ff727ab51~mv2.jpg/v1/crop/x_205,y_55,w_1938,h_1710/fill/w_848,h_748,al_c,q_85/loophole-4_edited.jpg')],
  },
  // Video thumbnail.
  { dest: 'public/images/video-doom.jpg', urls: ['https://i.ytimg.com/vi/oLf0dvIrwU4/maxresdefault.jpg'] },
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
  console.warn('Missing assets render as empty placeholders — commit the files to public/ to fix permanently.');
}
