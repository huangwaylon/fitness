// Every clip's bank (docs/english.md "Content"; the review rubric's automated checks, review-rubric.md §4): the schema
// and ids, segments, the option-length and echo tells, duplicate stems, the banned words, the notes' lengths, a cue
// that leaks the key, dictations, coverage per bank, reveals, and draws over five plays. A lesson from before the
// banks (under 16 items) is held to the schema, segments, banned words, dictations and the draws only. A bank whose
// file has the line `// A2 REVIEW` (reviewed for the A1–A2 learner) is held to the A2 rules for size, coverage and
// levels (and a looser key-length tell); the others to the older ones until their review.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { bandsOf, CLIPS } from './clips/index.ts';
import { draw, GROUP_OF, seedOf, type History } from './draw.ts';
import { cleanLine } from '#lib/contract/text.ts';
import { notInTrimmedFont } from '../../../scripts/font-subsets.ts';
import type { Clip, Question } from './types.ts';

const SKILLS = Object.keys(GROUP_OF);
const BANNED = /不正解|誤り|間違い|ざんねん|残念|×/;
const JA = /[぀-ヿ㐀-鿿]/;
/** A bank, not a lesson from before them. */
const isBank = (c: Clip) => c.questions.length >= 16;

// the echo tell (kikimimi/tells.ts's contentWords): a choice's content words, stemmed
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
  ...notInTrimmedFont(t).map((ch) => `not in the font: ${ch}`)
];
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
    if (q.level !== 'C2' && !took.some((t) => t === q || clashes(t, q)) && n((t) => t.skill === q.skill) < (['dict', 'humor', 'predict'].includes(q.skill) ? 1 : 2) && !(q.level === 'C1' && n((t) => t.level === 'C1') >= 1)) took.push(q);
  return took.length - 1;
}
/** The clips reviewed for the A2 learner: their files' `// A2 REVIEW` line. */
const DIR = join(import.meta.dirname, 'clips');
const A2 = new Set(readdirSync(DIR).filter((f) => f.endsWith('.ts')).flatMap((f) => {
  const src = readFileSync(join(DIR, f), 'utf8');
  return /^\/\/ A2 REVIEW\b/m.test(src) ? [...src.matchAll(/^\s*id: '([^']+)'/gm)].map((m) => m[1]) : [];
}));

describe('the clips', () => {
  it('ids unique and short; the order a plain list', () => {
    expect(CLIPS.length).toBeGreaterThan(0);
    expect(new Set(CLIPS.map((c) => c.id)).size).toBe(CLIPS.length);
    for (const c of CLIPS) expect(c.id, c.id).toMatch(/^[a-z0-9][a-z0-9-]{0,11}$/);
  });

  it('bands: the library’s thirds by wpm (scripts/english-wpm.ts --write); the order by band', () => {
    const bands = bandsOf(CLIPS.map((c) => c.wpm));
    expect(CLIPS.map((c) => `${c.id} ${c.band}`)).toEqual(CLIPS.map((c, i) => `${c.id} ${bands[i]}`));
    const rank = { slow: 0, mid: 1, fast: 2 };
    const order = CLIPS.map((c) => rank[c.band]);
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  for (const c of CLIPS)
    describe(c.id, () => {
      const qs = c.questions;
      it('the schema: ids, skills, levels, choices, dictations, predicts', () => {
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
            expect(q.choices && q.choices.length >= (isBank(c) ? 3 : 2) && q.choices.length <= 4, at).toBe(true);
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

      it('segments inside the clip, in clip order; a predict’s continuation right after it', () => {
        for (const q of qs) {
          const at = `${c.id} ${q.id}`;
          expect(q.seg[0], at).toBeGreaterThanOrEqual(0);
          expect(q.seg[1], at).toBeGreaterThan(q.seg[0]);
          expect(q.seg[1], at).toBeLessThanOrEqual(c.dur);
          if (q.then) {
            expect(q.then[0], at).toBe(q.seg[1]);
            expect(q.then[1] - q.then[0], at).toBeLessThanOrEqual(10);
          }
          if (isBank(c)) {
            const d = q.seg[1] - q.seg[0];
            if (q.skill === 'gist') expect(d, at).toBeGreaterThanOrEqual(15);
            else if (q.skill === 'dict') expect(d >= 2 && d <= 8, `${at} ${d} s`).toBe(true);
          }
        }
        if (isBank(c)) expect(qs.map((q) => q.seg[0]), 'clip order').toEqual([...qs].map((q) => q.seg[0]).sort((a, b) => a - b));
      });

      it('never says incorrect; no Japanese in the English; stems unique', () => {
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

      it('the cue never names the key: no word only the right choice has', () => {
        for (const q of qs) {
          if (!q.choices || q.a === undefined) continue;
          const others = new Set(q.choices.filter((_, i) => i !== q.a).flatMap((x) => [...content(x)]));
          const only = [...content(q.choices[q.a])].filter((w) => !others.has(w));
          const cue = content(q.cue);
          expect(only.filter((w) => cue.has(w)), `${c.id} ${q.id}`).toEqual([]);
        }
      });

      it('reveals: an item quoting another’s key shares its point or says so', () => {
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

      const a2 = A2.has(c.id);
      it.runIf(isBank(c))(`a bank: the tells, the notes, coverage and levels${a2 ? ' (A2 rules)' : ''}`, () => {
        const sets = qs.filter((q) => sentence(q) && !q.retired);
        let longest = 0, shortest = 0, least = 0;
        for (const q of sets) {
          const key = q.choices![q.a!], ds = q.choices!.filter((_, i) => i !== q.a);
          const L = Math.max(...ds.map(len)), S = Math.min(...ds.map(len));
          // A2 choices are ≤ 6 words, where a ratio is a word or two: 6 characters of slack either way
          const ok = a2 ? len(key) <= Math.max(1.25 * L, L + 6) && len(key) >= Math.min(0.8 * S, S - 6) : len(key) <= 1.25 * L && len(key) >= 0.8 * S;
          expect(ok, `${q.id}: the key's length`).toBe(true);
          if (len(key) > L) longest++;
          if (len(key) < S) shortest++;
          const heard = content(q.line ?? '');
          if (heard.size && echo(key, heard) < Math.min(...ds.map((d) => echo(d, heard)))) least++;
        }
        if (sets.length) {
          expect(longest / sets.length, 'the key strictly longest').toBeLessThanOrEqual(0.4);
          expect(shortest / sets.length, 'the key strictly shortest').toBeLessThanOrEqual(0.4);
          expect(least / sets.length, 'the key echoing the clip least').toBeLessThanOrEqual(0.45);
        }
        for (const q of qs) {
          const n = len(q.said) + len(q.mean) + len(q.trap);
          const [lo, hi] = q.level === 'C2' ? [90, 140] : [80, 120];
          expect(n >= lo && n <= hi, `${q.id}: said + mean + trap ${n}`).toBe(true);
          expect(len(q.cue), `${q.id}: cue`).toBeLessThanOrEqual(40);
          expect(q.use, `${q.id}: use`).toMatch(/（.+）/);
        }
        const live = qs.filter((q) => !q.retired);
        const by = (f: (q: Question) => boolean) => live.filter(f).length;
        const c2 = live.filter((q) => q.level === 'C2');
        const core = live.filter((q) => q.level !== 'C2');
        const share = (l: string) => core.filter((q) => q.level === l).length / core.length;
        if (a2) {
          // the A2 rules (the 2026-11-17 panel): 12–24 live, form-heavy, little interpretation, C2 0–2, B1 the bulk
          expect(live.length >= 12 && live.length <= 24, `bank size ${live.length}`).toBe(true);
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
          return;
        }
        expect(live.length >= 16 && live.length <= 24, 'bank size').toBe(true);
        // the native tier (native-level.md §5): 0 or 2–4, ≤ 1 a point, its skills only; a stress item (a C2 sound) ships
        // retired until its ear check, then goes in HEARD
        expect(c2.length === 0 || (c2.length >= 2 && c2.length <= 4), `C2 ${c2.length}`).toBe(true);
        expect(new Set(c2.map((q) => q.point)).size, 'C2 a point').toBe(c2.length);
        for (const q of c2) expect(C2_SKILLS, `${q.id}: a C2 skill`).toContain(q.skill);
        for (const q of c2) if (q.skill === 'sound') expect(HEARD.has(`${c.id} ${q.id}`), `${q.id}: a stress item, not ear-checked`).toBe(true);
        for (const sk of SKILLS) expect(by((q) => q.skill === sk), sk).toBeLessThanOrEqual(4);
        expect(by((q) => q.skill === 'gist')).toBeGreaterThanOrEqual(2);
        expect(by((q) => GROUP_OF[q.skill] === 'L')).toBeGreaterThanOrEqual(4);
        expect(by((q) => GROUP_OF[q.skill] === 'I')).toBeGreaterThanOrEqual(6);
        expect(by((q) => q.skill === 'infer')).toBeGreaterThanOrEqual(2);
        expect(by((q) => q.skill === 'attitude')).toBeGreaterThanOrEqual(2);
        expect(by((q) => q.skill === 'pragma')).toBeGreaterThanOrEqual(1);
        expect(by((q) => GROUP_OF[q.skill] === 'F')).toBeGreaterThanOrEqual(4);
        for (const sk of ['phrase', 'sound', 'dict']) expect(by((q) => q.skill === sk), sk).toBeGreaterThanOrEqual(1);
        expect(by((q) => q.skill === 'predict')).toBeLessThanOrEqual(2);
        if (LEVELS_RELAXED[c.id]) return;
        // B1/B2/C1 shares over the items below the native tier
        expect(share('B1') >= 0.2 && share('B1') <= 0.35, `B1 ${share('B1')}`).toBe(true);
        expect(share('B2') >= 0.4 && share('B2') <= 0.55, `B2 ${share('B2')}`).toBe(true);
        expect(share('C1') >= 0.2 && share('C1') <= 0.35, `C1 ${share('C1')}`).toBe(true);
      });

      it('draws: five plays × 20 seeds, each well-formed; play 2 new when the bank allows', () => {
        for (let s = 0; s < 20; s++) {
          const seen: History = {};
          let prev: Question[] = [];
          for (let play = 1; play <= 5; play++) {
            const d = draw(c, seen, play, seedOf('A', c.id, play) + s);
            const at = `${c.id} play ${play} seed ${s}`;
            const size = c.dur < 90 ? 6 : c.dur < 180 ? 7 : 8, live = qs.filter((q) => !q.retired);
            if (!isBank(c)) expect(d.length, at).toBe(Math.min(live.length, size));
            else expect(d.length >= Math.min(size, 1 + fitting(live, d[0])) && d.length <= size, `${at}: ${d.length} items`).toBe(true);
            if (qs.some((q) => q.skill === 'gist')) expect(d[0].skill, at).toBe('gist');
            expect(d.slice(1).map((q) => q.seg[0]), at).toEqual(d.slice(1).map((q) => q.seg[0]).sort((a, b) => a - b));
            expect(d.filter((q) => q.skill === 'dict').length, at).toBeLessThanOrEqual(1);
            expect(d.filter((q) => q.skill === 'humor').length, at).toBeLessThanOrEqual(1);
            expect(d.filter((q) => q.skill === 'predict').length, at).toBeLessThanOrEqual(1);
            expect(new Set(d.map((q) => q.point)).size, at).toBe(d.length);
            for (const a of d) for (const b of d) if (a !== b) expect(a.reveals?.includes(b.point) ?? false, `${at}: ${a.id} reveals ${b.id}`).toBe(false);
            if (isBank(c)) for (const sk of SKILLS) expect(d.filter((q) => q.skill === sk).length, `${at} ${sk}`).toBeLessThanOrEqual(2);
            if (isBank(c) && play === 2) {
              // the unseen that may join this gist (no C2, one C1): a repeat beyond one only when too few
              const room = fitting(live.filter((q) => !seen[q.id] && q.skill !== 'gist'), d[0]);
              expect(d.filter((q) => prev.includes(q) && q.skill !== 'gist').length, `${at}: repeats`).toBeLessThanOrEqual(1 + Math.max(0, d.length - 1 - room));
            }
            expect(d.filter((q) => q.level === 'C1').length, `${at}: C1`).toBeLessThanOrEqual(1);
            for (const q of d) seen[q.id] = { play, ok: true };
            prev = d;
          }
        }
      });
    });

  for (const c of CLIPS)
    for (const harder of [false, true])
      it(`${c.id} draws${harder ? ', harder' : ''}: the C2 tier per play (none unless harder; then ≤ 1, one while one is unseen)`, () => {
        const has = c.questions.filter((q) => !q.retired && q.level === 'C2');
        for (let s = 0; s < 20; s++) {
          const seen: History = {};
          for (let play = 1; play <= 5; play++) {
            const d = draw(c, seen, play, seedOf('A', c.id, play) + s, { harder });
            const n = d.filter((q) => q.level === 'C2').length, at = `${c.id} play ${play} seed ${s}`;
            if (!harder) expect(n, at).toBe(0);
            else {
              expect(n, at).toBeLessThanOrEqual(1);
              if (has.some((q) => !seen[q.id] && !clashes(q, d[0]))) expect(n, at).toBe(1);
            }
            for (const q of d) seen[q.id] = { play, ok: true };
          }
        }
      });
});
