// Near-duplicates across every bank (docs/kikimimi.md "Variety"): the user's "there's too much repetition". Every clip's
// English (an item's, a dialogue line's, a スピード はしご line's) against every other's by normalised token overlap
// (Jaccard over the content words: lower case, punctuation and the commonest function words out), and every written
// right answer (reply, mean, gist, next) against the others', the same normalisation. A pair over the threshold is
// the same sentence twice in the game: rewrite one of them (en and ja, before it's voiced).
import { describe, expect, it } from 'vitest';
import { BANK, isDialogue } from './bank.ts';
import { LADDERS } from './ladder.ts';

const STOP = new Set(('a an the to of and or but in on at for is are was were be been it its i you we he she they this that so just do did ' +
  'have has had my your our his her their me us them him').split(' '));
/** A sentence's content words. */
const tokens = (s: string): string[] => (s.toLowerCase().replace(/’/g, "'").match(/[a-z0-9']+/g) ?? []).filter((w) => !STOP.has(w));
const jaccard = (a: ReadonlySet<string>, b: ReadonlySet<string>): number => {
  let n = 0;
  for (const x of a) if (b.has(x)) n++;
  return n / (a.size + b.size - n);
};
/** Two sentences this alike (and each of at least MIN_WORDS content words) are one sentence twice. */
const THRESHOLD = 0.5;
const MIN_WORDS = 4;

/** Every clip's English: items, dialogue lines, and the ladders' own lines (a ladder climbing a level-4 item's line
 *  is that item: not counted twice). */
const clips: { id: string; en: string }[] = [
  ...BANK.flatMap((it) => (isDialogue(it) ? it.lines.map((l, n) => ({ id: `${it.id}-${n + 1}`, en: l.en })) : [{ id: it.id, en: it.en }])),
  ...LADDERS.filter((l) => !BANK.some((it) => it.en === l.line.en)).map((l) => ({ id: l.id, en: l.line.en }))
];

/** A num template's rows share their sentence frame on purpose (levels 1-3: `n2-price-1`, `n2-price-2`…). */
const family = (id: string) => (/^n[1-3]-/.test(id) ? id.replace(/-\d+$/, '') : id);

function nearPairs(list: readonly { id: string; en: string }[], th = THRESHOLD): [number, string, string][] {
  const t = list.map((c) => new Set(tokens(c.en)));
  const out: [number, string, string][] = [];
  for (let i = 0; i < list.length; i++)
    for (let j = i + 1; j < list.length; j++) {
      if (t[i].size < MIN_WORDS || t[j].size < MIN_WORDS || family(list[i].id) === family(list[j].id)) continue;
      const s = jaccard(t[i], t[j]);
      if (s >= th) out.push([Math.round(s * 100) / 100, list[i].id, list[j].id]);
    }
  return out;
}

describe('kikimimi near-duplicates across the banks', () => {
  it('the measure: the same sentence reworded a little is caught, a different one isn’t', () => {
    const p = nearPairs([
      { id: 'a', en: "I'd love to, but I'm kind of trying to be good this month." },
      { id: 'b', en: "Ooh, Friday... I'd love to, but I'm kind of trying to be good this month." },
      { id: 'c', en: 'The train to Shinjuku leaves from platform six.' }
    ]);
    expect(p.map(([, a, b]) => a + b)).toEqual(['ab']);
    expect(tokens("It's the train's, ISN'T it?")).toEqual(["it's", "train's", "isn't"]);
  });

  it(`no two clips' English over ${THRESHOLD} overlap`, () => {
    expect(clips.length).toBeGreaterThan(1000);
    expect(nearPairs(clips)).toEqual([]);
  });

  it('no two written right answers the same', () => {
    const seen = new Map<string, string>();
    const dup: string[] = [];
    for (const it of BANK.filter((it) => it.type === 'reply' || it.type === 'mean' || it.type === 'gist' || it.type === 'next')) {
      const k = tokens(it.choices[it.answer]).join(' ');
      if (seen.has(k)) dup.push(`${seen.get(k)} / ${it.id}: ${it.choices[it.answer]}`);
      else seen.set(k, it.id);
    }
    expect(dup).toEqual([]);
  });
});
