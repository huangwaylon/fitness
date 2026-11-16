// Every clip's bank (docs/english.md "Content"; the review rubric's automated checks, review-rubric.md §4): the schema
// and ids, segments, the option-length and echo tells, duplicate stems, the banned words, the notes' lengths, a cue
// that leaks the key, dictations, coverage per bank, reveals, and draws over five plays. A lesson from before the
// banks (under 16 items) is held to the schema, segments, banned words, dictations and the draws only.
import { describe, expect, it } from 'vitest';
import { CLIPS } from './clips/index.ts';
import { draw, GROUP_OF, seedOf, type History } from './draw.ts';
import { cleanLine } from '#lib/contract/text.ts';
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
/** Banks let off the level shares, and why (an ear check may bring them back). */
const LEVELS_RELAXED: Record<string, string> = { seatingchart: 'h1 (C1) retired pending its ear check, 2026-11-16: B1 6/17, C1 3/17' };

describe('the clips', () => {
  it('ids unique and short; the order a plain list', () => {
    expect(CLIPS.length).toBeGreaterThan(0);
    expect(new Set(CLIPS.map((c) => c.id)).size).toBe(CLIPS.length);
    for (const c of CLIPS) expect(c.id, c.id).toMatch(/^[a-z0-9][a-z0-9-]{0,11}$/);
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
          expect(['B1', 'B2', 'C1'], at).toContain(q.level);
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

      it.runIf(isBank(c))('a bank: the tells, the notes, coverage and levels', () => {
        const sets = qs.filter((q) => sentence(q) && !q.retired);
        let longest = 0, shortest = 0, least = 0;
        for (const q of sets) {
          const key = q.choices![q.a!], ds = q.choices!.filter((_, i) => i !== q.a);
          const L = Math.max(...ds.map(len)), S = Math.min(...ds.map(len));
          expect(len(key) <= 1.25 * L && len(key) >= 0.8 * S, `${q.id}: the key's length`).toBe(true);
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
          expect(n >= 80 && n <= 120, `${q.id}: said + mean + trap ${n}`).toBe(true);
          expect(len(q.cue), `${q.id}: cue`).toBeLessThanOrEqual(40);
          expect(q.use, `${q.id}: use`).toMatch(/（.+）/);
        }
        const live = qs.filter((q) => !q.retired);
        expect(live.length >= 16 && live.length <= 24, 'bank size').toBe(true);
        const by = (f: (q: Question) => boolean) => live.filter(f).length;
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
        const share = (l: string) => by((q) => q.level === l) / live.length;
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
            expect(d.length, at).toBe(Math.min(qs.filter((q) => !q.retired).length, c.dur < 90 ? 6 : c.dur < 180 ? 7 : 8));
            if (qs.some((q) => q.skill === 'gist')) expect(d[0].skill, at).toBe('gist');
            expect(d.slice(1).map((q) => q.seg[0]), at).toEqual(d.slice(1).map((q) => q.seg[0]).sort((a, b) => a - b));
            expect(d.filter((q) => q.skill === 'dict').length, at).toBeLessThanOrEqual(1);
            expect(d.filter((q) => q.skill === 'humor').length, at).toBeLessThanOrEqual(1);
            expect(d.filter((q) => q.skill === 'predict').length, at).toBeLessThanOrEqual(1);
            expect(new Set(d.map((q) => q.point)).size, at).toBe(d.length);
            for (const a of d) for (const b of d) if (a !== b) expect(a.reveals?.includes(b.point) ?? false, `${at}: ${a.id} reveals ${b.id}`).toBe(false);
            if (isBank(c)) for (const sk of SKILLS) expect(d.filter((q) => q.skill === sk).length, `${at} ${sk}`).toBeLessThanOrEqual(2);
            if (isBank(c) && play === 2) expect(d.filter((q) => prev.includes(q) && q.skill !== 'gist').length, `${at}: repeats`).toBeLessThanOrEqual(1);
            if (isBank(c) && play >= 2) expect(d.some((q) => q.level === 'C1'), `${at}: a C1`).toBe(true);
            for (const q of d) seen[q.id] = { play, ok: true };
            prev = d;
          }
        }
      });
    });
});
