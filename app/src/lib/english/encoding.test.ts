// No U+FFFD (�) in any scenes, transcripts or clips file: the mark of a multi-byte character (a kana, a kanji, a ’)
// cut mid-bytes on the way in, as an import once left ~110 of them.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('English Study files', () => {
  for (const dir of ['scenes', 'transcripts', 'clips']) {
    it(`${dir}: no U+FFFD`, () => {
      const path = join(import.meta.dirname, dir);
      const bad = readdirSync(path).flatMap((f) =>
        readFileSync(join(path, f), 'utf8').split('\n').flatMap((l, i) => (l.includes('�') ? [`${f}:${i + 1}`] : [])));
      expect(bad).toEqual([]);
    });
  }
});
