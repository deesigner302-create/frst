// Smoke test: links, assets, JS syntax, and deploy output freshness.
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const BUILD = join(ROOT, 'build');
const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
const problems = [];
const assetRefs = () => [...html.matchAll(/(?:src|href)="([^"#:]+)"/g)]
  .map(m => m[1])
  .filter(p => !p.startsWith('mailto:') && !p.startsWith('data:'));

// 1. Every internal anchor has a target.
const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]));
for (const [, ref] of html.matchAll(/href="#([^"]+)"/g)) {
  if (!ids.has(ref)) problems.push(`Unresolved anchor: #${ref}`);
}

// 2. Every referenced local asset exists.
const paths = assetRefs();
for (const p of paths) {
  if (!existsSync(join(ROOT, p))) problems.push(`Missing file: ${p}`);
}

// 3. JS parses.
for (const file of ['app.js', 'server.mjs', 'scripts/build.mjs']) {
  const result = spawnSync(process.execPath, ['--check', join(ROOT, file)], { encoding: 'utf8' });
  if (result.status !== 0) problems.push(`Syntax error in ${file}: ${result.stderr.trim()}`);
}

// 4. Deploy config points at the build directory.
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
if (pkg.scripts?.build !== 'node scripts/build.mjs') problems.push('package.json is missing the build script');
if (!existsSync(join(ROOT, 'netlify.toml'))) {
  problems.push('Missing netlify.toml');
} else {
  const config = readFileSync(join(ROOT, 'netlify.toml'), 'utf8');
  if (!/publish\s*=\s*"build"/.test(config)) problems.push('netlify.toml publish directory is not build');
  if (!/npm run build/.test(config)) problems.push('netlify.toml does not run npm run build');
}

// 5. The committed deploy output exists and matches the sources byte-for-byte.
const deployed = ['index.html', ...paths, '_headers'];
const hash = (path) => createHash('sha256').update(readFileSync(path)).digest('hex');
for (const p of deployed) {
  const output = join(BUILD, p);
  if (!existsSync(output)) { problems.push(`build/ is missing ${p} — run npm run build`); continue; }
  if (p !== '_headers' && hash(join(ROOT, p)) !== hash(output)) {
    problems.push(`build/${p} is stale — run npm run build`);
  }
}
if (existsSync(BUILD) && !existsSync(join(BUILD, 'build-manifest.json'))) {
  problems.push('build/build-manifest.json is missing — run npm run build');
}

// 6. Required interactive elements are present.
for (const id of ['planner-form', 'plan-list', 'pricing-title', 'signup-form', 'theme-toggle', 'menu-toggle']) {
  if (!ids.has(id)) problems.push(`Missing element id: ${id}`);
}

if (problems.length) {
  console.error('Check failed:');
  problems.forEach(p => console.error('  • ' + p));
  process.exit(1);
}
console.log(`✓ ${ids.size} ids, ${paths.length} assets, JS syntax OK, deploy output build/ is current.`);
