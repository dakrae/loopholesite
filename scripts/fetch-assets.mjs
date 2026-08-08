// Downloads remote assets (old Wix CDN, YouTube thumbnail, press-kit files)
// into public/ so the site serves everything same-origin. Files that already
// exist are skipped — commit the real files to public/ and this script
// becomes a no-op. Failures are warnings, not build errors, so the site
// still builds if the old Wix CDN disappears.
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const wix = (path) => `https://static.wixstatic.com/media/${path}`;

const ASSETS = [
  // Fixed background photo on the main page. Must be same-origin: the
  // adaptive colour engine reads it into a canvas.
  {
    dest: 'public/images/bg.jpg',
    urls: [
      wix('65e9d4_c42f260cd4d249f2b720f2a9133de301~mv2.jpg/v1/fill/w_2200,h_1400,al_c,q_85/loophole_analog-8.jpg'),
      wix('65e9d4_c42f260cd4d249f2b720f2a9133de301~mv2.jpg/v1/fill/w_2200,h_1400,al_c,q_85,enc_avif,quality_auto/loophole_analog-8.jpg'),
    ],
  },
  // Band member photos (crops as designed).
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
  // Booking page hero banner.
  {
    dest: 'public/images/booking-hero.jpg',
    urls: [wix('65e9d4_d2a5ae5842aa45f789e149b13fdf5278~mv2.jpg/v1/fill/w_2200,h_1400,al_c,q_85/loophole5_thomas-zeller.jpg')],
  },
  // Press photos (booking page grid).
  { dest: 'public/images/press/press-1.jpg', urls: [wix('65e9d4_d429430c783a4addb7f6adb15f87fe32~mv2.jpg/v1/fill/w_1114,h_742,al_c,q_85/press-1.jpg')] },
  { dest: 'public/images/press/press-2.jpg', urls: [wix('65e9d4_c42f260cd4d249f2b720f2a9133de301~mv2.jpg/v1/fill/w_1114,h_742,al_c,q_85/press-2.jpg')] },
  { dest: 'public/images/press/press-3.jpg', urls: [wix('65e9d4_d2a5ae5842aa45f789e149b13fdf5278~mv2.jpg/v1/fill/w_1114,h_742,al_c,q_85/press-3.jpg')] },
  { dest: 'public/images/press/press-4.jpg', urls: [wix('65e9d4_a2b52405698248d384ecacfb364c632e~mv2.jpg/v1/fill/w_1114,h_742,al_c,q_85/press-4.jpg')] },
  { dest: 'public/images/press/press-5.jpg', urls: [wix('65e9d4_72bc67cb33d14074bd8f5d60b0332f10~mv2.jpg/v1/fill/w_708,h_1062,al_c,q_85/press-5.jpg')] },
  // Album covers available online (the rest live in public/covers/ in the repo).
  {
    dest: 'public/covers/doom-scrolling.jpg',
    urls: [wix('65e9d4_d7491ffc7ff240a4b61b837dbde6a1f7~mv2.jpg/v1/fill/w_1400,h_1400,al_c,q_85/doom-scrolling.jpg')],
  },
  {
    dest: 'public/covers/songs-vol-1.jpg',
    urls: [wix('65e9d4_b7a930cd145b4a3c857ccffd6842300c~mv2.jpg/v1/fill/w_1200,h_1200,al_c,q_85/songs-vol-1.jpg')],
  },
  // Video thumbnail.
  { dest: 'public/images/video-doom.jpg', urls: ['https://i.ytimg.com/vi/oLf0dvIrwU4/maxresdefault.jpg'] },
  // Press kit files (old Wix file hosting).
  { dest: 'public/downloads/press-text.pdf', urls: ['https://www.loophole.ch/_files/ugd/65e9d4_670ccf0860844b1db8902d035251f8e8.pdf'] },
  { dest: 'public/downloads/bios.pdf', urls: ['https://www.loophole.ch/_files/ugd/65e9d4_f1538fe55c424147990f547fb94511fb.pdf'] },
  { dest: 'public/downloads/tech-rider-trio.pdf', urls: ['https://www.loophole.ch/_files/ugd/65e9d4_dfd49cecead6486688b8973cd70256f3.pdf'] },
  { dest: 'public/downloads/tech-rider-4tett.pdf', urls: ['https://www.loophole.ch/_files/ugd/65e9d4_7121ecdf7a2647098c5bdd556fd86ec3.pdf'] },
  { dest: 'public/downloads/press-photos.zip', urls: ['https://www.loophole.ch/_files/archives/65e9d4_5ac61517e18c4fa4ab900784157f9896.zip'] },
  { dest: 'public/downloads/loophole-press-kit.zip', urls: ['https://www.loophole.ch/_files/archives/65e9d4_7c2262b9f50648589191c132e86968b2.zip'] },
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
  console.warn('Missing assets are rendered as placeholders — commit the files to public/ to fix permanently.');
}
