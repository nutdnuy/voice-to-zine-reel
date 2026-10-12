// dump window.SFX_EVENTS from a built piece: node dump_sfx.mjs <piece dir> <out.json>
import { createRequire } from 'node:module'; import { execSync } from 'node:child_process'; import fs from 'node:fs'; import path from 'node:path'; import { pathToFileURL } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium } = (() => { try { return require('playwright'); } catch { return require(path.join(execSync('npm root -g').toString().trim(), 'playwright')); } })();
const [dir, out] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage();
await p.goto(pathToFileURL(path.resolve(dir, 'index.html')).href + '?export=1');
await p.waitForFunction(() => window.SFX_EVENTS && window.renderFrame, null, { timeout: 30000 });
fs.writeFileSync(out, JSON.stringify(await p.evaluate(() => ({ events: window.SFX_EVENTS, duration: window.TIMELINE.duration, music: window.MUSIC_CUES }))));
await b.close(); console.log('wrote', out);
