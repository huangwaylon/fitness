// Every clip's bank against the rules in docs/english.md "Content" (the A2 rules, the R4 rubric's coverage, density,
// context items, trap openers and swears, the review rubric's mechanical checks §4): schema, segments, tells, notes,
// coverage, levels, reveals, EXCLUDE/SKIP/SWEAR-OK header ranges, and that each bank gives five full, valid plays.
// The draw's own rules are tested once, on made-up banks, in draw.test.ts.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { bandsOf, CLIPS } from './clips/index.ts';
import { draw, GROUP_OF, seedOf, type History } from './draw.ts';
import { PLANNED } from './plan-order.ts';
import { cleanLine } from '#lib/contract/text.ts';
import { notInTrimmedFont } from '../../../scripts/font-subsets.ts';
import type { Clip, Question, TranscriptFile } from './types.ts';

const SKILLS = Object.keys(GROUP_OF);
const BANNED = /不正解|誤り|間違い|ざんねん|残念|×/;
/** The swears no item may play (the user, 2026-11-18; damn, hell, crap and sucks may): its `line` mustn't quote one either. */
const SWEAR = /\b((?:hard|bad|dumb|smart|kick|kiss|lard|jack|fat|wise|half|tight|candy)-?ass(?:es|ed)?|\w*shit\w*|bitch\w*|ass|asses|asshole\w*|asshat\w*|bastard\w*|dick\w*|fuck\w*|f\*+\w*|goddamn\w*|piss\w*|screw you|son of a b\w*)\b/i;
describe('SWEAR regex', () => {
  it('catches the compounds, not ordinary words', () => {
    for (const w of ['hardass', 'badass', 'dumbass', 'smartass', 'kickass', 'kiss-ass', 'lardass', 'jackass', 'half-assed', 'asshat', 'bullshit', 'dipshit', 'horseshit', 'apeshit', 'fat-ass', 'asses', 'piss off'])
      expect(SWEAR.test(`What ${w} now`), w).toBe(true);
    for (const w of ['class', 'pass', 'glass', 'grass', 'mass', 'assistant', 'assume', 'bass', 'embarrass', 'harass', 'Picasso', 'cassette', 'Massachusetts', 'shiitake', 'Mississippi', 'classes', 'passed', 'compass', 'brass'])
      expect(SWEAR.test(`the ${w} here`), w).toBe(false);
  });
});
const JA = /[぀-ヿ㐀-鿿]/;

// the echo tell: a choice's content words, stemmed
const STOP = new Set(('a an the and or but so if of to in on at for with from by up out off over about into as is am are was were be been being do does did done have has had i me my you your he him his she her it its we us our they them their this that these those there here what which who when where why how not no yes just very really too also then than can could will would should may might must oh um uh well okay yeah all some any one get got go going want like now right').split(' '));
const stem = (w: string) => w.replace(/'s$/, '').replace(/(ies)$/, 'y').replace(/(ing|ed|es|s)$/, '') || w;
const content = (t: string) => new Set((t.toLowerCase().replace(/[’‘]/g, "'").match(/[a-z0-9][a-z0-9']*/g) ?? []).filter((w) => !STOP.has(w) && w.length > 2).map(stem));
const echo = (choice: string, heard: Set<string>) => [...content(choice)].filter((w) => heard.has(w)).length;
const words = (t: string) => t.toLowerCase().replace(/[’']/g, "'").replace(/[^a-z' ]/g, ' ').split(/\s+/).filter(Boolean);
const starred = (line: string) => [...line.matchAll(/\*([^*]+)\*/g)].map((m) => m[1]).join(' ');
const sentence = (q: Question) => q.choices && q.skill !== 'number' && q.skill !== 'sound';
const len = (t: string) => [...t].length;
/** What's wrong with a Japanese field (a stem's or a choice's `ja`): none, if trimmed, 1–`max` long, Japanese, clean, no
 *  banned word and every character in the trimmed font. */
const jaOk = (t: string, max: number): string[] => [
  ...(t.trim() === t && len(t) >= 1 && len(t) <= max ? [] : [`1–${max} characters, trimmed: ${len(t)}`]),
  ...(JA.test(t) ? [] : ['no Japanese']),
  ...(cleanLine(t, 400) === t ? [] : ['not a clean line']),
  ...(BANNED.test(t) ? ['a banned word'] : []),
  ...[...t].filter((ch) => !inFont(ch)).map((ch) => `not in the font: ${ch}`)
];
/** A character in the trimmed font, each looked up once (the font's ranges, scanned a character at a time, were most of
 *  the schema check's 4.7 s). */
const FONT = new Map<string, boolean>();
const inFont = (ch: string) => FONT.get(ch) ?? (FONT.set(ch, !notInTrimmedFont(ch).length), FONT.get(ch)!);
/** The A2 ramp (review 11-24 #8: first-try data showed A2 learners picking the distractor that carried the words they
 *  heard): a `// A2 RAMP` header line marks the plan's first RAMP banks. There a detail or gist key may reuse one clearly
 *  heard content word of the line (the rubric's "the key never the one echoing the line" is lifted for them; the right
 *  meaning still decides, and no distractor equally supported), and at most one distractor carries a heard word the key
 *  doesn't. Every other rule, the length and the echo-least tally included, holds as everywhere. */
const RAMP = 30, RAMP_TAG = /^\/\/ A2 RAMP\b/m, RAMP_SKILLS = ['detail', 'gist'];
/** Banks let off the level shares, and why (an ear check may bring them back). */
const LEVELS_RELAXED: Record<string, string> = { seatingchart: 'h1 (C1) retired pending its ear check, 2026-11-16: B1 6/17, C1 3/17' };
/** The native tier's skills (native-level.md §5). */
const C2_SKILLS = ['infer', 'attitude', 'pragma', 'humor', 'sound', 'dict'];
/** C2 stress items (`sound`) the user has ear-checked, `<clip> <id>`: the others ship retired. */
const HEARD = new Set<string>([]);
/** Whether two items can't share a draw: one point, or one reveals the other's. */
const clashes = (a: Question, b: Question) => a.point === b.point || !!a.reveals?.includes(b.point) || !!b.reveals?.includes(a.point);
/** How many of `items` a greedy pass fits beside the gist `head` under the draw's limits (one a point, no reveals,
 *  ≤ 2 a skill, ≤ 1 dict, humor, predict and C1, no C2): a lower bound on what the draw can take. */
function fitting(items: Question[], head: Question): number {
  const took: Question[] = [head];
  const n = (f: (q: Question) => boolean) => took.filter(f).length;
  for (const q of items)
    if (q.level !== 'C2' && !took.some((t) => t === q || clashes(t, q)) && n((t) => t.skill === q.skill) < (['dict', 'humor', 'predict', 'pragma'].includes(q.skill) ? 1 : 2) && !(q.level === 'C1' && n((t) => t.level === 'C1') >= 1)) took.push(q);
  return took.length - 1;
}
const DIR = join(import.meta.dirname, 'clips');
/** Each clip file's source, by its video. */
const SRC = new Map(readdirSync(DIR).filter((f) => f.endsWith('.ts')).flatMap((f) => {
  const src = readFileSync(join(DIR, f), 'utf8'), v = src.match(/video: '([\w-]{11})'/)?.[1];
  return v ? [[v, src] as const] : [];
}));
type Span = readonly [number, number];
/** A header's `// <tag> a–b[, c–d][: why]` ranges (en dash or hyphen), and whether each line gave a why. */
const ranges = (src: string, tag: string) => [...src.matchAll(new RegExp(`^// ${tag} ([^:\\n]*)(:\\s*\\S)?`, 'gm'))].map((m) => ({
  spans: [...m[1].matchAll(/(\d+(?:\.\d+)?)\s*[–-]\s*(\d+(?:\.\d+)?)/g)].map((r) => [+r[1], +r[2]] as Span), why: !!m[2]
}));
/** Seconds of [a, b] the spans cover (spans may overlap). */
function covered([a, b]: Span, spans: readonly Span[]): number {
  let n = 0, at = a;
  for (const [x, y] of [...spans].sort((p, q) => p[0] - q[0])) {
    const from = Math.max(x, at), to = Math.min(y, b);
    if (to > from) (n += to - from), (at = to);
  }
  return n;
}
const overlaps = (s: Span, spans: readonly Span[]) => spans.some(([x, y]) => s[0] < y && s[1] > x);
const f1 = (n: number) => +n.toFixed(1);
/** A context item's line: its turns, `A: … / B: …` (rubric R4 §3). */
const turns = (line: string) => line.split(' / ').filter((t) => t.trim()).length;

/** Five plays of a clip's draw, one seed (`harder`: with the C2 tier), each checked against the bank: what a bank can't
 *  fill shows in one; the draw's own rules over many seeds are draw.test.ts's. */
function plays(c: Clip, harder: boolean) {
  const live = c.questions.filter((q) => !q.retired), c2s = live.filter((q) => q.level === 'C2');
  const size = c.dur < 90 ? 6 : c.dur < 180 ? 7 : 8;
  for (let s = 0; s < 1; s++) {
    const seen: History = {};
    let prev: Question[] = [];
    for (let play = 1; play <= 5; play++) {
      const d = draw(c, seen, play, seedOf('A', c.id, play) + s, { harder });
      const at = `${c.id} play ${play} seed ${s}`;
      const g = d.find((q) => q.skill === 'gist') ?? d[0];
      expect(d.length >= Math.min(size, 1 + fitting(live, g)) && d.length <= size, `${at}: ${d.length} items`).toBe(true);
      if (c.questions.some((q) => q.skill === 'gist')) expect(g.skill, at).toBe('gist');
      expect(d[0].skill, `${at}: the opening`).not.toBe('dict');
      expect(d.slice(1).map((q) => q.seg[0]), at).toEqual(d.slice(1).map((q) => q.seg[0]).sort((a, b) => a - b));
      for (const sk of ['dict', 'humor', 'predict', 'pragma']) expect(d.filter((q) => q.skill === sk).length, `${at} ${sk}`).toBeLessThanOrEqual(1);
      for (const sk of SKILLS) expect(d.filter((q) => q.skill === sk).length, `${at} ${sk}`).toBeLessThanOrEqual(2);
      expect(new Set(d.map((q) => q.point)).size, at).toBe(d.length);
      for (const a of d) for (const b of d) if (a !== b) expect(a.reveals?.includes(b.point) ?? false, `${at}: ${a.id} reveals ${b.id}`).toBe(false);
      expect(d.filter((q) => q.level === 'C1').length, `${at}: C1`).toBeLessThanOrEqual(1);
      const n2 = d.filter((q) => q.level === 'C2').length;
      if (!harder) expect(n2, `${at}: C2`).toBe(0);
      else {
        expect(n2, `${at}: C2`).toBeLessThanOrEqual(1);
        if (c2s.some((q) => !seen[q.id] && !clashes(q, g))) expect(n2, `${at}: an unseen C2`).toBe(1);
      }
      if (play === 2) {
        // the unseen that may join this gist (no C2, one C1): a repeat beyond one only when too few
        const room = fitting(live.filter((q) => !seen[q.id] && q.skill !== 'gist'), g);
        expect(d.filter((q) => prev.includes(q) && q.skill !== 'gist').length, `${at}: repeats`).toBeLessThanOrEqual(1 + Math.max(0, d.length - 1 - room));
      }
      for (const q of d) seen[q.id] = { play, ok: true };
      prev = d;
    }
  }
}

describe('the clips', () => {
  it('ids unique and short; every file in clips/ one clip', () => {
    expect(CLIPS.length).toBeGreaterThan(0);
    expect(new Set(CLIPS.map((c) => c.id)).size).toBe(CLIPS.length);
    for (const c of CLIPS) expect(c.id, c.id).toMatch(/^[a-z0-9][a-z0-9-]{0,11}$/);
    expect(CLIPS.length).toBe(readdirSync(DIR).filter((f) => f.endsWith('.ts') && f !== 'index.ts').length);
  });

  it('bands: the library’s thirds by wpm (scripts/english-wpm.ts --write)', () => {
    const bands = bandsOf(CLIPS.map((c) => c.wpm));
    expect(CLIPS.map((c) => `${c.id} ${c.band}`)).toEqual(CLIPS.map((c, i) => `${c.id} ${bands[i]}`));
  });

  it(`\`// A2 RAMP\` marks the plan's first ${RAMP} banks, no others`, () => {
    const marked = CLIPS.filter((c) => RAMP_TAG.test(SRC.get(c.video) ?? '')).map((c) => c.id);
    expect(marked.sort()).toEqual([...PLANNED.slice(0, RAMP)].sort());
  });

  it('choices kept in order only for numbers (else the key sits where it was written: 150 were all first)', () => {
    const bad = CLIPS.flatMap((c) => c.questions.filter((q) => !q.retired && q.keep && q.skill !== 'number').map((q) => `${c.id}:${q.id}`));
    expect(bad).toEqual([]);
  });

  // each check one test over every clip (a row a clip a check was 5,000 rows), each clip's first problem listed
  const checks = new Map<string, [string, () => void][]>();
  let cur = '';
  const each = (name: string, f: () => void) => checks.set(name, [...(checks.get(name) ?? []), [cur, f]]);
  for (const c of CLIPS) {
    cur = c.id;
    {
      const qs = c.questions;
      each('the schema: ids, skills, levels, choices, dictations, predicts', () => {
        expect(c.video).toMatch(/^[\w-]{11}$/);
        expect(['slow', 'mid', 'fast']).toContain(c.band);
        expect(new Set(qs.map((q) => q.id)).size, 'ids unique').toBe(qs.length);
        for (const q of qs) {
          const at = `${c.id} ${q.id}`;
          expect(q.id, at).toMatch(/^[a-z0-9]{1,8}$/);
          expect(SKILLS, at).toContain(q.skill);
          expect(['B1', 'B2', 'C1', 'C2'], at).toContain(q.level);
          expect(q.point.length, at).toBeGreaterThan(0);
          if (q.skill === 'dict') {
            expect(q.choices, at).toBeUndefined();
            expect(q.answer, at).toMatch(/^[a-z']+( [a-z']+){0,5}$/);
            // the line's starred words, as said
            if (q.line) expect(words(starred(q.line)).join(' '), at).toBe(q.answer);
          } else {
            expect(q.answer, at).toBeUndefined();
            expect(q.choices && q.choices.length >= 3 && q.choices.length <= 4, at).toBe(true);
            expect(new Set(q.choices).size, at).toBe(q.choices!.length);
            expect(q.a !== undefined && q.a >= 0 && q.a < q.choices!.length, at).toBe(true);
          }
          if (q.skill === 'predict') expect(q.then, at).toBeDefined();
          for (const k of ['stem', 'cue', 'said', 'mean', 'trap', 'use'] as const) expect(q[k].trim().length, `${at} ${k}`).toBeGreaterThan(0);
          // what a flag quotes is clean enough for the record (contract/eflag.ts)
          for (const t of [q.stem, q.line ?? '']) expect(cleanLine(t, 400), at).toBe(t);
          // the stem's and the choices' Japanese, when written: one a choice, in its order; short, Japanese, the font's
          if (q.ja !== undefined) expect(jaOk(q.ja, 60), `${at} ja`).toEqual([]);
          if (q.choicesJa !== undefined) {
            expect(q.choicesJa.length, `${at} choicesJa: one a choice`).toBe(q.choices?.length ?? -1);
            for (const t of q.choicesJa) expect(jaOk(t, 40), `${at} choicesJa`).toEqual([]);
          }
        }
      });

      each('segments inside the clip, in clip order; a predict’s continuation right after it', () => {
        for (const q of qs) {
          const at = `${c.id} ${q.id}`;
          expect(q.seg[0], at).toBeGreaterThanOrEqual(0);
          expect(q.seg[1], at).toBeGreaterThan(q.seg[0]);
          expect(q.seg[1], at).toBeLessThanOrEqual(c.dur);
          if (q.then) {
            expect(q.then[0], at).toBe(q.seg[1]);
            expect(q.then[1] - q.then[0], at).toBeLessThanOrEqual(10);
          }
          const d = q.seg[1] - q.seg[0];
          if (q.skill === 'gist') expect(d, at).toBeGreaterThanOrEqual(15);
          else if (q.skill === 'dict') expect(d >= 2 && d <= 8, `${at} ${d} s`).toBe(true);
        }
        expect(qs.map((q) => q.seg[0]), 'clip order').toEqual([...qs].map((q) => q.seg[0]).sort((a, b) => a - b));
      });

      each('never says incorrect; no Japanese in the English; stems unique', () => {
        for (const q of qs) {
          for (const k of ['cue', 'said', 'mean', 'trap', 'use'] as const) expect(q[k], `${c.id} ${q.id} ${k}`).not.toMatch(BANNED);
          for (const t of [q.stem, ...(q.choices ?? [])]) expect(t, `${c.id} ${q.id}`).not.toMatch(JA);
        }
        const norm = (t: string) => words(t).join(' ');
        expect(new Set(qs.map((q) => norm(q.stem))).size, 'stems unique').toBe(qs.length);
        for (const [i, a] of qs.entries())
          for (const b of qs.slice(i + 1)) {
            const x = new Set(words(a.stem)), y = new Set(words(b.stem));
            const j = [...x].filter((w) => y.has(w)).length / new Set([...x, ...y]).size;
            expect(j, `${a.id} ~ ${b.id}`).toBeLessThan(0.8);
          }
      });

      each('the cue never names the key: no word only the right choice has', () => {
        for (const q of qs) {
          if (!q.choices || q.a === undefined) continue;
          const others = new Set(q.choices.filter((_, i) => i !== q.a).flatMap((x) => [...content(x)]));
          const only = [...content(q.choices[q.a])].filter((w) => !others.has(w));
          const cue = content(q.cue);
          expect(only.filter((w) => cue.has(w)), `${c.id} ${q.id}`).toEqual([]);
        }
      });

      each('reveals: an item quoting another’s key shares its point or says so', () => {
        for (const k of qs) {
          const key = k.skill === 'dict' ? k.answer : k.skill === 'sound' || k.skill === 'number' ? k.choices?.[k.a ?? 0] : undefined;
          if (!key || key.length < 3) continue;
          for (const q of qs) {
            if (q === k || q.point === k.point || q.reveals?.includes(k.point) || k.reveals?.includes(q.point)) continue;
            const text = `${q.stem} ${(q.line ?? '').replace(/\*/g, '')}`.toLowerCase();
            expect(text.includes(key.toLowerCase()), `${q.id} quotes ${k.id}'s key "${key}"`).toBe(false);
          }
        }
      });

      each('a bank: the tells, the notes, coverage and levels (the A2 rules)', () => {
        const sets = qs.filter((q) => sentence(q) && !q.retired);
        let longest = 0, shortest = 0, least = 0;
        const ramp = RAMP_TAG.test(SRC.get(c.video) ?? '');
        for (const q of sets) {
          const key = q.choices![q.a!], ds = q.choices!.filter((_, i) => i !== q.a);
          const L = Math.max(...ds.map(len)), S = Math.min(...ds.map(len));
          // A2 choices are ≤ 6 words, where a ratio is a word or two: 6 characters of slack either way
          const ok = len(key) <= Math.max(1.25 * L, L + 6) && len(key) >= Math.min(0.8 * S, S - 6);
          expect(ok, `${q.id}: the key's length`).toBe(true);
          if (len(key) > L) longest++;
          if (len(key) < S) shortest++;
          const heard = content(q.line ?? '');
          if (heard.size && echo(key, heard) < Math.min(...ds.map((d) => echo(d, heard)))) least++;
          // the A2 ramp: the key may carry a heard word, and a heard word only a distractor carries is in one at most
          if (ramp && RAMP_SKILLS.includes(q.skill)) {
            const mine = content(key), lures = ds.filter((d) => [...content(d)].some((w) => heard.has(w) && !mine.has(w)));
            expect(lures.length, `${q.id}: A2 RAMP, distractors alone echoing the line: ${lures.join(' / ')}`).toBeLessThanOrEqual(1);
          }
        }
        if (sets.length) {
          expect(longest / sets.length, 'the key strictly longest').toBeLessThanOrEqual(0.4);
          expect(shortest / sets.length, 'the key strictly shortest').toBeLessThanOrEqual(0.4);
          expect(least / sets.length, 'the key echoing the clip least').toBeLessThanOrEqual(0.45);
        }
        for (const q of qs) {
          const n = len(q.said) + len(q.mean) + len(q.trap);
          // A2 notes spell an idiom out (literal, then here): room up to 160
          const [lo, hi] = q.level === 'C2' ? [90, 160] : [60, 160];
          expect(n >= lo && n <= hi, `${q.id}: said + mean + trap ${n}`).toBe(true);
          expect(len(q.cue), `${q.id}: cue`).toBeLessThanOrEqual(40);
          expect(q.use, `${q.id}: use`).toMatch(/（.+）/);
        }
        const live = qs.filter((q) => !q.retired);
        const by = (f: (q: Question) => boolean) => live.filter(f).length;
        const c2 = live.filter((q) => q.level === 'C2');
        const core = live.filter((q) => q.level !== 'C2');
        const share = (l: string) => core.filter((q) => q.level === l).length / core.length;
        // the A2 rules (the 2026-11-17 panel): 12–24 live, form-heavy, little interpretation, C2 0–2, B1 the bulk
        expect(live.length >= 12 && live.length <= 24, `bank size ${live.length}`).toBe(true);
        // a gist's segment ≤ 45 s; 3 choices (a number 3–4)
        for (const q of live) {
          if (q.skill === 'gist') expect(q.seg[1] - q.seg[0], `${q.id}: a gist's segment`).toBeLessThanOrEqual(45);
          const n = q.choices?.length;
          if (n !== undefined) expect(q.skill === 'number' ? n >= 3 && n <= 4 : n === 3, `${q.id}: ${n} choices`).toBe(true);
        }
        expect(by((q) => q.skill === 'gist'), 'gist').toBeGreaterThanOrEqual(2);
        expect(by((q) => GROUP_OF[q.skill] === 'L'), 'L').toBeGreaterThanOrEqual(4);
        expect(by((q) => GROUP_OF[q.skill] === 'F'), 'F').toBeGreaterThanOrEqual(4);
        expect(by((q) => q.skill === 'phrase'), 'phrase').toBeGreaterThanOrEqual(1);
        expect(by((q) => q.skill === 'sound' || q.skill === 'dict'), 'sound + dict').toBeGreaterThanOrEqual(1);
        const i = by((q) => GROUP_OF[q.skill] === 'I');
        expect(i >= 2 && i <= 0.4 * live.length, `I ${i}/${live.length}`).toBe(true);
        expect(by((q) => q.skill === 'humor'), 'humor').toBeLessThanOrEqual(1);
        expect(by((q) => q.skill === 'predict'), 'predict').toBeLessThanOrEqual(1);
        for (const sk of SKILLS) expect(by((q) => q.skill === sk), sk).toBeLessThanOrEqual(5);
        expect(c2.length, `C2 ${c2.length}`).toBeLessThanOrEqual(2);
        expect(new Set(c2.map((q) => q.point)).size, 'C2 a point').toBe(c2.length);
        for (const q of c2) expect(C2_SKILLS, `${q.id}: a C2 skill`).toContain(q.skill);
        for (const q of c2) if (q.skill === 'sound') expect(HEARD.has(`${c.id} ${q.id}`), `${q.id}: a stress item, not ear-checked`).toBe(true);
        if (LEVELS_RELAXED[c.id]) return;
        expect(share('B1') >= 0.45 && share('B1') <= 0.65, `B1 ${share('B1')}`).toBe(true);
        expect(share('B2') >= 0.25 && share('B2') <= 0.45, `B2 ${share('B2')}`).toBe(true);
        expect(share('C1') <= 0.15, `C1 ${share('C1')}`).toBe(true);
      });

      const src = SRC.get(c.video) ?? '';
      const live = qs.filter((q) => !q.retired);
      each('no live item plays a header `// EXCLUDE a–b` line', () => {
        const ex = ranges(src, 'EXCLUDE').flatMap((r) => r.spans);
        const bad = live.flatMap((q) => [q.seg, ...(q.then ? [q.then] : [])].filter((s) => overlaps(s, ex)).map((s) => `${q.id} [${s.join(', ')}]`));
        expect(bad.length, `${c.id}: segments over EXCLUDE ${ex.map((s) => s.join('–')).join(', ')}: ${bad.join('; ')}`).toBe(0);
      });

      // the R4 rules (rubric-r4.md §2–§5)
      {
        const skips = ranges(src, 'SKIP');
        const skip = skips.flatMap((r) => r.spans);
        /** The speech span: the transcript's first spoken line to its last (music-only ♪ lines aside), within the clip. */
        const speech = (): Span => {
          const all = (JSON.parse(readFileSync(join(import.meta.dirname, 'transcripts', `${c.video}.en.json`), 'utf8')) as TranscriptFile).lines;
          const lines = all.filter((l) => !/^[♪\s]*$/.test(l.en));
          return [lines[0].t[0], Math.min(lines.at(-1)!.t[1], c.dur)];
        };
        each('R4: coverage: the speech span’s quarters, and gaps ≥ 25 s under `// SKIP a–b: why`', () => {
          expect(skips.every((r) => r.why && r.spans.length), `${c.id}: a SKIP line is \`// SKIP a–b: why\``).toBe(true);
          const [lo, hi] = speech(), q4 = (hi - lo) / 4;
          const starts = live.filter((q) => q.skill !== 'gist').map((q) => q.seg[0]);
          const bad: string[] = [];
          for (let i = 0; i < 4; i++) {
            const quarter: Span = [lo + i * q4, lo + (i + 1) * q4];
            // an item before the first line counts in the first quarter, after the last in the last
            const n = starts.filter((s) => (i === 0 || s >= quarter[0]) && (i === 3 || s < quarter[1])).length;
            const at = `Q${i + 1} ${f1(quarter[0])}–${f1(quarter[1])} s`;
            if (n < 2 && covered(quarter, skip) < q4 / 2) bad.push(`${at}: ${n} non-gist starts (≥ 2, or SKIP ≥ half of it)`);
            if (n > 0.4 * starts.length) bad.push(`${at}: ${n} of ${starts.length} non-gist starts (≤ 40 %)`);
          }
          const all = [lo, ...live.map((q) => q.seg[0]).filter((s) => s > lo && s < hi).sort((a, b) => a - b), hi];
          for (let i = 1; i < all.length; i++) {
            const gap: Span = [all[i - 1], all[i]], d = gap[1] - gap[0];
            if (d >= 25 && covered(gap, skip) < 0.8 * d) bad.push(`no item start ${f1(gap[0])}–${f1(gap[1])} s (${f1(d)} s): SKIP covers ${f1(covered(gap, skip))} s (≥ 80 %)`);
          }
          expect(bad.length, `${c.id}: speech ${f1(lo)}–${f1(hi)} s: ${bad.join('; ')}`).toBe(0);
        });

        each('R4: ≤ 3 live item starts in any 10 s (≤ 4 when the speech span is under 80 s)', () => {
          const [lo, hi] = speech(), k = hi - lo < 80 ? 4 : 3;
          const s = live.map((q) => q.seg[0]).sort((a, b) => a - b);
          const bad = s.flatMap((x, i) => (s[i + k] !== undefined && s[i + k] - x < 10 ? [`${s.slice(i, i + k + 1).join(', ')} s`] : []));
          expect(bad.length, `${c.id}: over ${k} starts within 10 s (speech ${f1(hi - lo)} s): ${bad.join('; ')}`).toBe(0);
        });

        each('R4: context items: ≥ 3 and ≥ 15 % of live, seg 6–18 s, a line of ≥ 2 turns (`A: … / B: …`)', () => {
          const ctx = live.filter((q) => q.ctx);
          expect(ctx.length >= 3 && ctx.length >= 0.15 * live.length, `${c.id}: ctx ${ctx.length} of ${live.length} live (≥ 3, ≥ ${Math.ceil(0.15 * live.length)})`).toBe(true);
          const bad = ctx.flatMap((q) => {
            const d = f1(q.seg[1] - q.seg[0]);
            return [...(d >= 6 && d <= 18 ? [] : [`${q.id}: seg ${d} s (6–15, ≤ 18)`]), ...(!q.line || turns(q.line) >= 2 ? [] : [`${q.id}: line of ${turns(q.line)} turn (turns split by ' / ')`])];
          });
          expect(bad.length, `${c.id}: context items: ${bad.join('; ')}`).toBe(0);
        });

        each('R4: no live item plays or quotes a swear (a transcript line not under EXCLUDE; `// SWEAR-OK a–b: why` for a name)', () => {
          const ex = ranges(src, 'EXCLUDE').flatMap((r) => r.spans), ok = ranges(src, 'SWEAR-OK').flatMap((r) => r.spans);
          const lines = (JSON.parse(readFileSync(join(import.meta.dirname, 'transcripts', `${c.video}.en.json`), 'utf8')) as TranscriptFile).lines;
          // a line is shut when a range covers it to within half a second at each end (whisper's timing), or an EXCLUDE
          // reaches one end of it, the end the swear is at (ronfire's “…than a wishy-washy kiss-ass”), the rest playable
          const shut = (t: Span) =>
            [ex, ok].some((sp) => sp.some(([a, b]) => a <= t[0] + 0.5 && b >= t[1] - 0.5)) ||
            ex.some(([a, b]) => (a <= t[0] + 0.5 && b > t[0]) || (b >= t[1] - 0.5 && a < t[1]));
          const bad = lines.flatMap((l) => {
            const w = l.en.match(SWEAR)?.[0];
            if (!w || shut(l.t)) return [];
            const ids = live.filter((q) => [q.seg, ...(q.then ? [q.then] : [])].some((s) => overlaps(s, [l.t]))).map((q) => q.id);
            return ids.length ? [`${ids.join(', ')} play ${f1(l.t[0])}–${f1(l.t[1])} s “${w}”`] : [];
          });
          for (const q of live) {
            const w = q.line?.match(SWEAR)?.[0];
            if (w && !overlaps(q.seg, ok)) bad.push(`${q.id}'s line quotes “${w}”`);
          }
          expect(bad.length, `${c.id}: swears (add \`// EXCLUDE a–b\` over the line and trim the seg): ${bad.join('; ')}`).toBe(0);
        });

        each('R4: trap opener 「思いやすい」 in ≤ ⌈live / 3⌉ traps', () => {
          const n = live.filter((q) => q.trap.includes('思いやすい')).length, max = Math.ceil(live.length / 3);
          expect(n, `${c.id}: 思いやすい in ${n} traps (≤ ${max}; rotate 〜と考えがち, 〜に聞こえるが, 〜と勘違いしやすい, 〜を連想しやすい)`).toBeLessThanOrEqual(max);
        });
      }

      each('draws: five plays, each full and well-formed, no C2; play 2 new when the bank allows', () => plays(c, false));
      if (qs.some((q) => !q.retired && q.level === 'C2'))
        each('draws, harder: the same, and the C2 tier ≤ 1 a play, one while one is unseen', () => plays(c, true));
    }
  }
  for (const [name, fs] of checks)
    it(name, () => {
      const bad: string[] = [];
      for (const [id, f] of fs)
        try {
          f();
        } catch (e) {
          bad.push(`${id}: ${(e as Error).message.split('\n')[0]}`);
        }
      expect(bad).toEqual([]);
    }, 60_000); // a sweep over every bank (the draws ~2 s idle): CPU-bound and deterministic, so a loaded Mac only slows it
});
