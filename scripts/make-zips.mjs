// Builds the two press-kit archives from whatever is actually in public/,
// so they can never go stale: add a press photo and the ZIPs pick it up on
// the next build. Both are written into public/downloads/ (gitignored) and
// copied into dist/ by Astro.
import { ZipArchive } from 'archiver';
import { createWriteStream, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const downloads = join(root, 'public/downloads');
const photoDir = join(root, 'public/images/press');

const DOCS = ['press-text.pdf', 'bios.pdf', 'tech-rider-trio.pdf', 'tech-rider-4tett.pdf'];

const photos = existsSync(photoDir)
  ? readdirSync(photoDir).filter((f) => /\.(jpe?g|png)$/i.test(f)).sort().map((f) => join(photoDir, f))
  : [];
const docs = DOCS.map((f) => join(downloads, f)).filter(existsSync);

function write(dest, entries) {
  return new Promise((resolve, reject) => {
    mkdirSync(dirname(dest), { recursive: true });
    const out = createWriteStream(dest);
    const zip = new ZipArchive({ zlib: { level: 9 } });
    out.on('close', () => resolve(zip.pointer()));
    zip.on('warning', reject);
    zip.on('error', reject);
    zip.pipe(out);
    for (const [file, name] of entries) zip.file(file, { name });
    zip.finalize();
  });
}

if (photos.length === 0 && docs.length === 0) {
  console.log('zips: nothing to archive yet, skipping');
} else {
  const photoBytes = await write(
    join(downloads, 'press-photos.zip'),
    photos.map((p) => [p, `loophole press photos/${basename(p)}`])
  );
  const kitBytes = await write(join(downloads, 'loophole-press-kit.zip'), [
    ...docs.map((d) => [d, `loophole press kit/${basename(d)}`]),
    ...photos.map((p) => [p, `loophole press kit/photos/${basename(p)}`]),
  ]);
  console.log(
    `zips: press-photos.zip (${photos.length} photos, ${(photoBytes / 1024 / 1024).toFixed(1)} MB), ` +
      `loophole-press-kit.zip (${docs.length} docs + ${photos.length} photos, ${(kitBytes / 1024 / 1024).toFixed(1)} MB)`
  );
}
