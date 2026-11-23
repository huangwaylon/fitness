// トレイル's list images (scripts/hiking-thumbs.ts): every trail photo has its row thumb and its 予定 band, small.
import { describe, expect, it } from 'vitest';
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const STATIC = join(import.meta.dirname, '../../../static/hiking');

describe('the trails’ list images', () => {
  const photos = readdirSync(join(STATIC, 'photos')).filter((f) => f.endsWith('.webp')).sort();
  for (const [dir, max] of [['thumbs', 12_000], ['bands', 140_000]] as const) {
    it(`${dir}: one per photo, each under ${max / 1000} KB (else: npm run hiking:thumbs)`, () => {
      expect(readdirSync(join(STATIC, dir)).filter((f) => f.endsWith('.webp')).sort()).toEqual(photos);
      for (const f of photos) expect(statSync(join(STATIC, dir, f)).size, f).toBeLessThan(max);
    });
  }
});
