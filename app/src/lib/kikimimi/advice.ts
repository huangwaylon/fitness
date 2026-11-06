// ききみみ クイズ's advice (docs/kikimimi.md "Recommendations and feedback"): what to practise next (each with a
// one-tap start) and しずえ's line after a game, from the stats (progress.ts) and the cards (srs.ts). Returns ids and
// numbers; the UI words them (i18n kiki.rec.*, kiki.fb.*). Pure.
import { levelRank, type Accent, type Level } from './bank.ts';
import type { Game, Speed, Stats } from './progress.ts';
import { MIN_SHOWN, isLadderGame } from './progress.ts';
import { entryOf } from './pool.ts';
import { SKILLS, featureSkill, skillsOf, tagsOf, type Skill } from './tags.ts';

export type Rec =
  /** Due cards piling up: にがて れんしゅう, every skill. */
  | { kind: 'review'; due: number }
  /** A weak skill: にがて れんしゅう of it. */
  | { kind: 'skill'; skill: Skill; m: number }
  /** A skill the offered levels have that I haven't been measured on: にがて れんしゅう of it. */
  | { kind: 'try'; skill: Skill }
  /** The current level is easy now: a game a level up. */
  | { kind: 'level'; lv: Level }
  /** The current level is hard: にがて れんしゅう before moving on. */
  | { kind: 'steady'; lv: Level }
  /** One accent well below the others: practice in it. */
  | { kind: 'accent'; accent: Accent }
  /** スピード はしご: never tried (`at` null, `tried` false), or the fastest comfortable speed below 1.2× (`at`). */
  | { kind: 'speed'; at: number | null; tried: boolean };

/** A skill is weak below this mastery (or the weakest one, below STRONG). */
const WEAK = 0.75;
const STRONG = 0.85;
const MAX_RECS = 3;
/** スピード はしご's nudge until this speed is comfortable (brisk: S2-S3's pace, curriculum §3). */
const SPEED_TARGET = 1.2;

/** The skills the offered levels' items train. */
function offeredSkills(levels: readonly Level[], bank: readonly { lv: Level; id: string }[]): Set<Skill> {
  const out = new Set<Skill>();
  for (const it of bank) {
    if (!levels.includes(it.lv)) continue;
    const x = entryOf(it.id);
    if (!x) continue;
    const s = skillsOf(x);
    out.add(s.primary);
    for (const a of s.also) out.add(a);
  }
  return out;
}

/**
 * What to practise next, at most 3, in this order: 「おさらい」 when ≥ 4 item cards are due; the weakest skills
 * (mastery < 0.75, or the lowest one below 0.85); a level nudge (the last 3 normal quiz games at the current level ≥ 85 %
 * right and a higher level offered: up; ≤ 50 %: steady); スピード はしご (offered: `ladder`), never tried after 3 quiz
 * games, or comfortable only below 1.2× once measured; an accent ≥ 15 points below the others (≥ 6 answers each); a
 * skill the offered levels train with < 3 answers (try it). Nothing before the first game.
 */
export function recommend(o: {
  stats: Stats; games: readonly Game[]; dueItems: number; levels: readonly Level[]; bank: readonly { lv: Level; id: string }[]; speed?: Speed; ladder?: boolean;
}): Rec[] {
  const { stats, games } = o;
  if (!games.length) return [];
  const out: Rec[] = [];
  if (o.dueItems >= 4) out.push({ kind: 'review', due: o.dueItems });
  const shown = SKILLS.filter((s) => stats.skills[s].m !== null).sort((a, b) => stats.skills[a].m! - stats.skills[b].m!);
  shown.forEach((s, i) => {
    const m = stats.skills[s].m!;
    if (m < WEAK || (i === 0 && m < STRONG)) out.push({ kind: 'skill', skill: s, m });
  });
  const normal = games.filter((g) => !g.p && !isLadderGame(g));
  const lv = normal.at(-1)?.lv as Level | undefined;
  if (lv !== undefined) {
    const last = normal.filter((g) => g.lv === lv).slice(-3);
    const r = last.flatMap((g) => g.r);
    const right = r.length ? r.filter((a) => a.ok).length / r.length : 0;
    // the next stage up (the アナウンス pack sits beside level 4, never a step up)
    const up = o.levels.find((x) => levelRank(x) > levelRank(lv));
    if (last.length >= 3 && right >= 0.85 && up !== undefined) out.push({ kind: 'level', lv: up });
    else if (last.length >= 3 && right <= 0.5) out.push({ kind: 'steady', lv });
  }
  const sp = o.speed;
  if (o.ladder && sp) {
    if (!sp.ladders && normal.length >= 3) out.push({ kind: 'speed', at: null, tried: false });
    else if (!sp.measuring && (sp.comfort ?? 0) < SPEED_TARGET) out.push({ kind: 'speed', at: sp.comfort, tried: true });
  }
  const accents = (Object.entries(stats.byAccent) as [Accent, { n: number; right: number }][]).filter(([, a]) => a.n >= 6);
  if (accents.length >= 2) {
    const sorted = accents.sort((a, b) => a[1].right - b[1].right);
    const [worst, ...rest] = sorted;
    const others = rest.reduce((s, [, a]) => s + a.right, 0) / rest.length;
    if (others - worst[1].right >= 0.15) out.push({ kind: 'accent', accent: worst[0] });
  }
  const offered = offeredSkills(o.levels, o.bank);
  for (const s of SKILLS) if (offered.has(s) && stats.skills[s].n < MIN_SHOWN) out.push({ kind: 'try', skill: s });
  return out.slice(0, MAX_RECS);
}

/** しずえ's line after a game: the words (i18n `kiki.fb.<kind>`) and what fills them. */
export type Feedback =
  | { kind: 'perfect'; next: Rec | null }
  | { kind: 'up'; skill: Skill; next: Rec | null }
  | { kind: 'keep'; next: Rec | null };

/** The skill whose mastery rose most with this game (≥ +0.05, among those it touched), else an all-right game's
 *  praise or an encouragement; each with the first recommendation as what's next. */
export function feedback(o: { game: Game; before: Stats; after: Stats; recs: readonly Rec[] }): Feedback {
  const next = o.recs[0] ?? null;
  const touched = new Set<Skill>();
  for (const a of o.game.r) {
    const it = entryOf(a.id);
    if (!it) continue;
    const s = skillsOf(it);
    touched.add(s.primary);
    for (const x of s.also) touched.add(x);
  }
  let best: Skill | null = null, rise = 0.05;
  for (const s of touched) {
    const d = o.after.skills[s].raw - o.before.skills[s].raw;
    if (o.after.skills[s].m !== null && d >= rise) (best = s), (rise = d);
  }
  if (o.game.r.length && o.game.r.every((a) => a.ok)) return { kind: 'perfect', next };
  return best ? { kind: 'up', skill: best, next } : { kind: 'keep', next };
}

/** What tripped me in a game: each missed answer's features (`f:<feature>`), or its primary skill with none
 *  (`s:<skill>`), counted, most first, each with its skill. */
export function tripsOf(game: { r: readonly Pick<Game['r'][number], 'id' | 'ok'>[] }): { key: string; skill: Skill; n: number }[] {
  const n = new Map<string, { key: string; skill: Skill; n: number }>();
  for (const a of game.r) {
    if (a.ok) continue;
    for (const t of tripKeys(a.id)) {
      const x = n.get(t.key) ?? { ...t, n: 0 };
      x.n++;
      n.set(t.key, x);
    }
  }
  return [...n.values()].sort((a, b) => b.n - a.n || (a.key < b.key ? -1 : 1));
}

/** An item's trip keys (tripsOf): its features, else its primary skill. */
export function tripKeys(id: string): { key: string; skill: Skill }[] {
  const it = entryOf(id);
  if (!it) return [];
  const fs = tagsOf(it).features;
  return fs.length ? fs.map((f) => ({ key: `f:${f}`, skill: featureSkill(f) })) : [{ key: `s:${skillsOf(it).primary}`, skill: skillsOf(it).primary }];
}
