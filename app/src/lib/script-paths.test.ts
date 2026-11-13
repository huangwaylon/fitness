// The asset scripts (app/scripts/*.ts) read and write the app's committed data under src/ by literal paths: a folder
// move that misses one leaves the script writing a stray file while the real one goes stale (scripts/models.ts and
// layout.ts after lib/world's move). Every all-literal `join(APP, 'src', …)` names a file that's there.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const APP = join(import.meta.dirname, '../..');
const SCRIPTS = join(APP, 'scripts');

describe('the scripts’ src paths', () => {
  it('each names an existing file or folder', () => {
    const paths = readdirSync(SCRIPTS).filter((f) => f.endsWith('.ts')).flatMap((f) =>
      [...readFileSync(join(SCRIPTS, f), 'utf8').matchAll(/join\((?:APP|import\.meta\.dirname, '\.\.'), ((?:'[^']*'(?:, )?)+)\)/g)]
        .map((m) => [...m[1].matchAll(/'([^']*)'/g)].map((x) => x[1]))
        .filter((parts) => parts[0] === 'src')
        .map((parts) => `${f}: ${parts.join('/')}`)
    );
    expect(paths.length).toBeGreaterThan(20); // the scan found them (models.ts' and layout.ts' among them)
    expect(paths).toContain('models.ts: src/lib/world/models.json');
    expect(paths).toContain('layout.ts: src/lib/world/scatter.json');
    expect(paths.filter((p) => !existsSync(join(APP, p.split(': ')[1])))).toEqual([]);
  });
});
