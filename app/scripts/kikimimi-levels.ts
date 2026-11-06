// ききみみ クイズ: the levels compiled for the app (docs/kikimimi.md "Loading"): src/lib/kikimimi/compile.ts over the
// bank, the ladders, clips.json and words.json, written into src/lib/kikimimi/levels/ (index.json and parts/, the old
// parts removed). Run after changing an item or a ladder; the audio scripts run it at their end. levels.test fails while
// the committed files differ. Silent: no sound.
//   node scripts/kikimimi-levels.ts
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { compile } from '../src/lib/kikimimi/compile.ts';

const KIKI = join(import.meta.dirname, '../src/lib/kikimimi');
const OUT = join(KIKI, 'levels');

/** levels/ written from the current clips.json and words.json; its files and their sizes listed. */
export function writeLevels(quiet = false): void {
  const json = (f: string) => JSON.parse(readFileSync(join(KIKI, f), 'utf8'));
  const files = compile(json('clips.json'), json('words.json'));
  mkdirSync(join(OUT, 'parts'), { recursive: true });
  for (const f of readdirSync(join(OUT, 'parts'))) if (!files.has(`parts/${f}`)) rmSync(join(OUT, 'parts', f));
  for (const [path, text] of files) {
    writeFileSync(join(OUT, path), text);
    if (!quiet) console.log(`${path.padEnd(22)} ${(text.length / 1024).toFixed(1).padStart(6)} KB, ${(gzipSync(text).length / 1024).toFixed(1).padStart(5)} KB gzipped`);
  }
}

if (import.meta.main) writeLevels();
