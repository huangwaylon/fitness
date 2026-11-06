// What a deploy uploads (docs/ops/runbook.md §1): Cloudflare Pages takes at most 20,000 files a deployment, and the
// build adds Kit's chunks (~400) and the 404 copy to static/. ききみみ's 1,559 loose clips went into packs (increment
// 9: docs/kikimimi.md "Audio") when static/ stood at 12,969; this keeps static/ well under the cap, so content can grow
// for a while without a deploy failing: past 15,000, move something into a pack or off to R2 first.
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const STATIC = join(import.meta.dirname, '../../static');
/** Pages' cap on a deployment's files. */
const PAGES_MAX_FILES = 20_000;
/** static/'s share of it: the build's own files and growth on top stay under the cap. */
const STATIC_MAX_FILES = 15_000;

describe('static/', () => {
  it(`stays well under Pages’ ${PAGES_MAX_FILES} files a deploy (≤ ${STATIC_MAX_FILES}: the build adds its chunks)`, () => {
    const files = readdirSync(STATIC, { recursive: true, withFileTypes: true }).filter((d) => d.isFile() && d.name !== '.DS_Store');
    expect(files.length).toBeLessThanOrEqual(STATIC_MAX_FILES);
    expect(STATIC_MAX_FILES).toBeLessThan(PAGES_MAX_FILES * 0.8);
  });
});
