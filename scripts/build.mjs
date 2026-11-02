// Build the deployable static site into ./build (no bundler, no dependencies).
// Source files are already browser-ready, so "building" means copying them
// into the directory the host publishes. Run `npm run build` after any edit.
import { cp, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const OUT = join(ROOT, 'build');
const FILES = ['index.html', 'styles.css', 'app.js'];
const DIRS = ['assets'];

// Start clean so deleted source files never linger in the published output.
await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

for (const file of FILES) {
  await cp(join(ROOT, file), join(OUT, file));
}
for (const dir of DIRS) {
  const source = join(ROOT, dir);
  try {
    await stat(source);
  } catch {
    continue;
  }
  await cp(source, join(OUT, dir), { recursive: true });
}

// Small headers file for the deployed site (no frame restrictions, so it
// still works inside preview iframes).
await writeFile(
  join(OUT, '_headers'),
  `/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n`
);

// Manifest is handy when debugging a deploy: it lists exactly what shipped.
const shipped = [];
const walk = async (dir) => {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) await walk(path);
    else shipped.push(relative(OUT, path));
  }
};
await walk(OUT);
const files = [];
for (const name of shipped.sort()) {
  const info = await stat(join(OUT, name));
  files.push({ path: name.replaceAll('\\', '/'), bytes: info.size });
}
// Deliberately no timestamp: repeated builds are byte-for-byte identical.
await writeFile(join(OUT, 'build-manifest.json'), JSON.stringify({ files }, null, 2) + '\n');

console.log(`✓ Built ${files.length} files into build/`);
for (const file of files) console.log(`  ${String(file.bytes).padStart(7)}  ${file.path}`);

// Sanity check: the published HTML must reference files that actually shipped.
const html = await readFile(join(OUT, 'index.html'), 'utf8');
const missing = [...html.matchAll(/(?:src|href)="([^"#:]+)"/g)]
  .map(m => m[1])
  .filter(p => !p.startsWith('mailto:') && !p.startsWith('data:'))
  .filter(p => !files.some(f => f.path === p));
if (missing.length) {
  console.error('Build incomplete, missing assets: ' + missing.join(', '));
  process.exit(1);
}
