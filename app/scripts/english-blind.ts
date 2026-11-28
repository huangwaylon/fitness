// English Study's blind check (docs/english.md "Content", Rules; the 2026-11-28 panel's O7): can an item be answered
// from its stem and choices alone, with no transcript and no listening? A solver (an LLM) answers each live choice item
// of the plan's first clips from the text alone, with a confidence; an item it gets right with high confidence doesn't
// need the clip, and is rewritten so listening decides (or retired). Verdicts go to src/lib/english/blind.json
// ({clip: {id: 'ok' | 'fixed' | 'retired'}}) so a later run skips them.
//   node scripts/english-blind.ts export <items.json> [--first N] [--all]  → the items still without a verdict (--all:
//                                                                          every one), choices shuffled per item
//   node scripts/english-blind.ts score <items.json> <answers.json>        → the blind-answerable ones, and the rate
//   node scripts/english-blind.ts record <answers.json> [--fixed a:b,…]     → verdicts into blind.json: 'ok' for the
//                                                                          not blind-answerable, 'fixed' / 'retired'
//                                                                          for the ones rewritten / retired since
// answers.json: [{clip, id, pick (the shown choice's index), conf (0–1)}]. Blind-answerable: right and conf ≥ SURE.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { CLIPS } from '../src/lib/english/clips/index.ts';
import { PLANNED } from '../src/lib/english/plan-order.ts';
import type { Question } from '../src/lib/english/types.ts';

const SURE = 0.8;
const BLIND = join(import.meta.dirname, '../src/lib/english/blind.json');
type Verdict = 'ok' | 'fixed' | 'retired';
type Item = { clip: string; id: string; stem: string; choices: string[] };
type Answer = { clip: string; id: string; pick: number; conf: number };

/** A fixed shuffle of an item's choices (the app shuffles per player; the key's place shouldn't tell the solver). */
function order(clip: string, q: Question): number[] {
  let h = 2166136261;
  for (const ch of `${clip}:${q.id}:${q.stem}`) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  const ix = q.choices!.map((_, i) => i);
  if (q.keep) return ix;
  for (let i = ix.length - 1; i > 0; i--) {
    h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
    const j = h % (i + 1);
    [ix[i], ix[j]] = [ix[j], ix[i]];
  }
  return ix;
}

const verdicts = (): Record<string, Record<string, Verdict>> => (existsSync(BLIND) ? JSON.parse(readFileSync(BLIND, 'utf8')) : {});

/** The live choice items of the plan's first `n` clips, in plan order. */
function itemsOf(n: number): { clip: string; q: Question }[] {
  return PLANNED.slice(0, n).flatMap((id) => {
    const c = CLIPS.find((x) => x.id === id);
    return c ? c.questions.filter((q) => !q.retired && q.choices && q.a !== undefined).map((q) => ({ clip: id, q })) : [];
  });
}

const shown = (clip: string, q: Question): Item => ({ clip, id: q.id, stem: q.stem, choices: order(clip, q).map((i) => q.choices![i]) });
const keyOf = (clip: string, q: Question) => order(clip, q).indexOf(q.a!);

if (import.meta.url === `file://${process.argv[1]}`) {
  const [cmd, a, b, ...rest] = process.argv.slice(2);
  const flag = (k: string) => [a, b, ...rest].indexOf(k);
  const first = flag('--first') >= 0 ? +[a, b, ...rest][flag('--first') + 1] : 60;
  const all = itemsOf(first), v = verdicts();
  if (cmd === 'export' && a) {
    const items = all.filter(({ clip, q }) => flag('--all') >= 0 || !v[clip]?.[q.id]).map(({ clip, q }) => shown(clip, q));
    writeFileSync(a, JSON.stringify(items, null, 1));
    console.log(`${items.length} items of ${all.length} live choice items in the plan's first ${first} clips → ${a}`);
  } else if (cmd === 'score' && a && b) {
    const items: Item[] = JSON.parse(readFileSync(a, 'utf8')), ans: Answer[] = JSON.parse(readFileSync(b, 'utf8'));
    const by = new Map(ans.map((x) => [`${x.clip}:${x.id}`, x]));
    let right = 0, sure = 0, missing = 0;
    const out: string[] = [];
    for (const it of items) {
      const c = CLIPS.find((x) => x.id === it.clip)!, q = c.questions.find((x) => x.id === it.id)!, x = by.get(`${it.clip}:${it.id}`);
      if (!x) {
        missing++;
        continue;
      }
      const ok = x.pick === keyOf(it.clip, q);
      if (ok) right++;
      if (ok && x.conf >= SURE) sure++, out.push(`${it.clip}:${it.id} (${q.skill}, ${x.conf}) ${q.stem} — ${q.choices![q.a!]}`);
    }
    console.log(out.join('\n'));
    console.log(`\n${items.length} items, ${missing} unanswered; right ${right} (${Math.round((100 * right) / items.length)} %); blind-answerable (right, conf ≥ ${SURE}): ${sure} (${((100 * sure) / items.length).toFixed(1)} %)`);
  } else if (cmd === 'record' && a) {
    const ans: Answer[] = JSON.parse(readFileSync(a, 'utf8'));
    const fixed = new Set((flag('--fixed') >= 0 ? [a, b, ...rest][flag('--fixed') + 1] : '').split(',').filter(Boolean));
    for (const x of ans) {
      const c = CLIPS.find((y) => y.id === x.clip), q = c?.questions.find((y) => y.id === x.id);
      if (!c || !q) continue;
      const key = `${x.clip}:${x.id}`;
      const verdict: Verdict | undefined = q.retired ? 'retired' : fixed.has(key) ? 'fixed' : x.pick === keyOf(x.clip, q) && x.conf >= SURE ? undefined : 'ok';
      if (verdict) (v[x.clip] ??= {})[x.id] = verdict;
    }
    const sorted = Object.fromEntries(Object.keys(v).sort().map((k) => [k, Object.fromEntries(Object.entries(v[k]).sort())]));
    writeFileSync(BLIND, JSON.stringify(sorted, null, 1) + '\n');
    console.log(`blind.json: ${Object.values(sorted).reduce((n, o) => n + Object.keys(o).length, 0)} verdicts`);
  } else {
    console.error('usage: node scripts/english-blind.ts export <items.json> [--first N] [--all] | score <items.json> <answers.json> | record <answers.json> [--fixed clip:id,…]');
    process.exit(1);
  }
}
