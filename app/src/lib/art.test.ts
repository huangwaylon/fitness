// The packed art manifest (vite.config.ts slimArtManifest) unpacks to exactly the file's keys and sizes.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { art, artKeys } from './art.ts';

const raw = JSON.parse(readFileSync(new URL('../../static/art/manifest.json', import.meta.url), 'utf8')) as { files: Record<string, { w: number; h: number }> };

describe('the art manifest as bundled', () => {
  it('every key with its size, nothing more', () => {
    expect(artKeys().sort()).toEqual(Object.keys(raw.files).sort());
    for (const [k, { w, h }] of Object.entries(raw.files)) expect(art(k), k).toMatchObject({ path: `${k}.webp`, w, h });
  });
});
