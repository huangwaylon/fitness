// static/'s file count against its share of Pages' per-deploy cap (lib/static-budget.ts).
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { BUILD_FILES, MARGIN_FILES, PAGES_MAX_FILES, STATIC_MAX_FILES } from './static-budget.ts';

const STATIC = join(import.meta.dirname, '../../static');

describe('static/', () => {
  it(`stays well under Pages’ ${PAGES_MAX_FILES} files a deploy (static/ ≤ ${STATIC_MAX_FILES}, the build's ${BUILD_FILES} and a margin on top)`, () => {
    const files = readdirSync(STATIC, { recursive: true, withFileTypes: true }).filter((d) => d.isFile() && d.name !== '.DS_Store');
    expect(files.length).toBeLessThanOrEqual(STATIC_MAX_FILES);
    expect(STATIC_MAX_FILES + BUILD_FILES + MARGIN_FILES).toBeLessThanOrEqual(PAGES_MAX_FILES);
  });
});
