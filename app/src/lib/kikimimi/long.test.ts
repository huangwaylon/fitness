// まるごと 聞く's content (content/listen/s4-long-*.yaml; docs/curriculum.md "Long listening"): each real piece's
// provenance (where it's from, its file's hash, a licence we may ship it under and the credit line it asks for), each
// piece's length as played (2-6 minutes; a generated one 2-4), and the transcript against the audio: what whisper heard
// in each line's clip (align.json, scripts/kikimimi-real.ts --align) at that clip's hash, held to align.ts's bounds. The
// choice tells are tells.test's (`long`), the schema listen.ts checkLong's (content.test).
import { describe, expect, it } from 'vitest';
import { readListen } from './compile.ts';
import { itemDur } from './clips.ts';
import { listenClipIds, listenUnit, type ListenItem } from './listen.ts';
import { ALIGN_LINE, ALIGN_PIECE, alignWer, alignWords } from './align.ts';
import clipsJson from './clips.json';
import alignJson from './align.json';

type Long = Extract<ListenItem, { kind: 'long' }>;
const CLIPS = clipsJson as Record<string, { dur: number; hash: string }>;
const ALIGN = alignJson as unknown as Record<string, [hash: string, wer: number]>;
// (the shipped pieces: a draft file isn't voiced yet)
const FILES = readListen().map(({ raw }) => listenUnit(raw)).filter((u) => u.game === 'long' && u.status !== 'draft');
const PIECES: { file: string; status: string; it: Long }[] = FILES.flatMap((u) => u.items.flatMap((it) => (it.kind === 'long' ? [{ file: u.unit, status: u.status, it }] : [])));

/** The licences a real piece may ship under (the app is shared, non-commercial): each one's deed. */
const LICENCES: readonly [RegExp, RegExp][] = [
  [/^Public domain\b/, /^https:\/\/(www\.)?(nasa\.gov|nps\.gov|usa\.gov|copyright\.gov)\//],
  [/^CC BY 4\.0$/, /^https:\/\/creativecommons\.org\/licenses\/by\/4\.0\/?$/],
  [/^CC BY-SA 4\.0$/, /^https:\/\/creativecommons\.org\/licenses\/by-sa\/4\.0\/?$/],
  [/^CC BY-NC-SA 4\.0$/, /^https:\/\/creativecommons\.org\/licenses\/by-nc-sa\/4\.0\/?$/]
];

/** A piece as played, in s: its lines end to end (a real piece's) or with their gaps (a generated one's `at`). */
const secsOf = (it: Long): number => {
  const ids = listenClipIds(it);
  return itemDur({ id: it.id, lines: it.lines.map((l, n) => ({ ...l, clip: ids[n], at: it.source === 'real' ? 0 : l.at })) } as never, CLIPS) ?? NaN;
};

describe('まるごと 聞く: the pieces', () => {
  it('ten pieces, five real and five generated, each in a file of its source', () => {
    expect(PIECES.filter((p) => p.it.source === 'real')).toHaveLength(5);
    expect(PIECES.filter((p) => p.it.source === 'tts')).toHaveLength(5);
    for (const u of FILES) expect(new Set(u.items.map((it) => (it as Long).source)).size, u.unit).toBe(1);
  });

  it('a real piece: where it is from, its file’s hash, a licence we may ship, the credit line it asks for', () => {
    for (const { it } of PIECES.filter((p) => p.it.source === 'real')) {
      const c = it.credit!;
      expect(c, it.id).toBeDefined();
      expect(c.url, it.id).toMatch(/^https:\/\//);
      expect(c.file, it.id).toMatch(/^https?:\/\//);
      expect(c.sha256, it.id).toMatch(/^[0-9a-f]{64}$/);
      const lic = LICENCES.find(([name]) => name.test(c.licence));
      expect(lic, `${it.id}: ${c.licence}`).toBeDefined();
      expect(c.licenceUrl, it.id).toMatch(lic![1]);
      // (the credit line names its terms, a CC one its licence by name, and says it's an excerpt changed: CC's notice)
      expect(c.attribution.toLowerCase(), it.id).toContain(c.licence.startsWith('CC') ? c.licence.toLowerCase() : 'public domain');
      expect(c.attribution, it.id).toMatch(/Excerpt, loudness-normalized and re-encoded/);
      expect(c.end - c.start, it.id).toBeGreaterThan(90);
    }
  });

  it('a generated piece has no credit (its villagers speak, the cast’s own voices)', () => {
    for (const { it } of PIECES.filter((p) => p.it.source === 'tts')) expect(it.credit, it.id).toBeUndefined();
  });

  it('plays 2-6 minutes (a generated one 2-4), every line voiced', () => {
    for (const { it } of PIECES) {
      for (const id of listenClipIds(it)) expect(CLIPS[id], id).toBeDefined();
      const s = secsOf(it);
      expect(s, it.id).toBeGreaterThanOrEqual(120);
      expect(s, it.id).toBeLessThanOrEqual(it.source === 'real' ? 360 : 240);
    }
  });
});

describe('まるごと 聞く: the transcript against the audio (whisper)', () => {
  it('compares as said: numbers, fillers, a word said twice, whisper’s prices and times', () => {
    expect(alignWords('Um, I I think it’s 412, at 6:30.')).toEqual(['i', 'think', "it's", 'four', 'hundred', 'twelve', 'at', 'six', 'thirty']);
    expect(alignWer('It was four-fifty.', 'It was $4.50.')).toBe(0);
    expect(alignWer('We fly at nine.', 'We fly at nine.')).toBe(0);
    expect(alignWer('We fly at nine tonight.', 'We fly tonight.')).toBe(0.4);
  });

  it('every long line heard at its clip’s hash; each piece within ALIGN_PIECE, each line of 4 words or more within ALIGN_LINE', () => {
    const worst: string[] = [];
    for (const { it } of PIECES) {
      const ids = listenClipIds(it);
      let words = 0, errs = 0;
      it.lines.forEach((l, n) => {
        const a = ALIGN[ids[n]];
        expect(a?.[0], `${ids[n]}: run scripts/kikimimi-real.ts --align`).toBe(CLIPS[ids[n]].hash);
        const w = alignWords(l.en).length;
        words += w;
        errs += (a[1] / 100) * w;
        if (w >= 4 && a[1] / 100 > ALIGN_LINE) worst.push(`${ids[n]} ${a[1]} %`);
      });
      expect(errs / words, it.id).toBeLessThanOrEqual(ALIGN_PIECE);
    }
    expect(worst).toEqual([]);
  });
});
