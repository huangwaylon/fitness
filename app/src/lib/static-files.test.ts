// static/'s file count against its share of Pages' per-deploy cap (lib/static-budget.ts), and one file a picture.
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

import { BUILD_FILES, MARGIN_FILES, PAGES_MAX_FILES, STATIC_MAX_FILES } from './static-budget.ts';

const STATIC = join(import.meta.dirname, '../../static');

describe('static/', () => {
  it(`stays well under Pages’ ${PAGES_MAX_FILES} files a deploy (static/ ≤ ${STATIC_MAX_FILES}, the build's ${BUILD_FILES} and a margin on top)`, () => {
    const files = readdirSync(STATIC, { recursive: true, withFileTypes: true }).filter((d) => d.isFile() && d.name !== '.DS_Store');
    expect(files.length).toBeLessThanOrEqual(STATIC_MAX_FILES);
    expect(STATIC_MAX_FILES + BUILD_FILES + MARGIN_FILES).toBeLessThanOrEqual(PAGES_MAX_FILES);
  });

  it('holds no file twice (the same bytes under two names: its users point at one, as scripts/art-dedupe.ts)', () => {
    // kept: Tom Nook's and Isabelle's host/ copies (precached for the error page), the homes' per-colour albedos
    const KEPT = /^(art\/host\/|room\/homes\/)/;
    const bySize = new Map<number, string[]>();
    for (const d of readdirSync(STATIC, { recursive: true, withFileTypes: true })) {
      const f = join(d.parentPath, d.name), rel = relative(STATIC, f);
      if (!d.isFile() || d.name === '.DS_Store' || KEPT.test(rel)) continue;
      const n = statSync(f).size;
      bySize.set(n, [...(bySize.get(n) ?? []), rel]);
    }
    const seen = new Map<string, string>(), twice: string[] = [];
    for (const fs of bySize.values()) {
      if (fs.length < 2) continue;
      for (const rel of fs) {
        const h = createHash('sha256').update(readFileSync(join(STATIC, rel))).digest('hex');
        if (seen.has(h)) twice.push(`${rel} = ${seen.get(h)}`);
        else seen.set(h, rel);
      }
    }
    expect(twice).toEqual([]);
  });
});
