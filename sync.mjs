#!/usr/bin/env node
/**
 * Mirror den's own plugin catalogs into this repository.
 *
 * Every den serves its plugins itself: /.claude-plugin/marketplace.json lists den and one plugin per marketplace kind
 * that ships as a product (den-household, …), each as a zip archive built by the Lambda from the listing. Claude Code
 * installs straight from that catalog. claude.ai adds a marketplace from a git repository, so this repo is the same
 * catalog as files: run this, commit, push, and claude.ai has what the Lambda has. Nothing here is written by hand.
 *
 *   node sync.mjs            # production and staging
 *   node sync.mjs <origin>…  # only those dens
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const origins = process.argv.slice(2).length ? process.argv.slice(2) : ['https://den.pkslabs.com', 'https://den-staging.pkslabs.com'];
const plugins = [];
for (const origin of origins) {
  const cat = await fetch(`${origin}/.claude-plugin/marketplace.json`).then((r) => { if (!r.ok) throw new Error(`${origin}: catalog ${r.status}`); return r.json(); });
  for (const p of cat.plugins) {
    const zip = Buffer.from(await fetch(p.source.url).then((r) => { if (!r.ok) throw new Error(`${p.source.url}: ${r.status}`); return r.arrayBuffer(); }));
    const dir = join('plugins', p.name); rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true });
    const tmp = mkdtempSync(join(tmpdir(), 'den-plugin-')); const file = join(tmp, 'p.zip'); writeFileSync(file, zip);
    execFileSync('unzip', ['-q', '-o', file, '-d', dir]); rmSync(tmp, { recursive: true, force: true });
    plugins.push({ name: p.name, description: p.description, author: { name: 'pkslabs' }, homepage: p.homepage, category: p.category, keywords: p.keywords, source: `./${dir}` });
    console.log(`${p.name} ← ${origin} (${readdirSync(dir).length} entries, ${p.source.sha256.slice(0, 12)})`);
  }
}
writeFileSync('.claude-plugin/marketplace.json', `${JSON.stringify({ name: 'den', description: 'den — the versioned store of record for a team, a household and their AI agents. den itself, and one plugin per kind on its marketplace: the same tools in that kind\'s words.', owner: { name: 'pkslabs', url: 'https://pkslabs.com' }, plugins }, null, 2)}\n`);
console.log(`${plugins.length} plugins in .claude-plugin/marketplace.json`);
