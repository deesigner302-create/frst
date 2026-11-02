// Tiny smoke test: internal links, icon references and local assets must resolve.
import { readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
const problems = [];

const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]));
for (const [, ref] of html.matchAll(/href="#([^"]+)"/g)) {
  if (!ids.has(ref)) problems.push(`Unresolved anchor: #${ref}`);
}

const paths = [...html.matchAll(/(?:src|href)="([^"#:]+)"/g)]
  .map(m => m[1])
  .filter(p => !p.startsWith('mailto:') && !p.startsWith('data:'));
for (const p of paths) {
  if (!existsSync(join(ROOT, p))) problems.push(`Missing file: ${p}`);
}

for (const file of ['app.js', 'server.mjs']) {
  const result = spawnSync(process.execPath, ['--check', join(ROOT, file)], { encoding: 'utf8' });
  if (result.status !== 0) problems.push(`Syntax error in ${file}: ${result.stderr.trim()}`);
}

const requiredSelectors = ['planner-form', 'plan-list', 'pricing-title', 'signup-form', 'theme-toggle', 'menu-toggle'];
for (const id of requiredSelectors) if (!ids.has(id)) problems.push(`Missing element id: ${id}`);

if (problems.length) {
  console.error('Check failed:');
  problems.forEach(p => console.error('  • ' + p));
  process.exit(1);
}
console.log(`✓ ${ids.size} ids, ${paths.length} local assets, JS syntax OK.`);
