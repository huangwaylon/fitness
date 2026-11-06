// しまの みち's model (docs/kikimimi-ux.md §6.3; docs/curriculum-units.md §1, §3; the UX review's sketch A): the stages
// as the spine (はまべ → かわ → もり → やま → ほし), each unit a stop on it with its lesson dots and stamps, a domain as a
// tag (an icon, a tint and a filter chip, never a second map), the anchor (glue) units first under 「はじめに おすすめ」,
// and the one current unit with 「つづける」. Every stage stays playable: one far above my level (みみ チェック's placed
// one, else きろく's comfortable one: progress.svelte.ts currentPath) is only shown softly; with a placement, every
// stage above the placed one is, and the placed one carries 「ここから」. A stage whose units I've all stamped, one by one,
// has its landmark (U7: cosmetic; the placement never clears a stage). Pure: the path index's lines, my unit states
// (stamps.ts) and my report's level and games in, the path out.
import type { LocalDate } from '../types.ts';
import { CORE, DOMAINS, LESSONS, STAGES, STAGE_IDS, stageAt, type Domain, type Lesson, type Stage } from './stages.ts';
import type { UnitState } from './stamps.ts';

/** The path's filter: every unit, or one domain's (the anchors stay: they're reused across domains). */
export type Filter = 'all' | Domain;

/** A unit as the path knows it: the index's path line (pool.ts PathEntry) or a loaded chunk's unit. */
export interface PathUnit {
  id: string;
  name: string;
  stage: string;
  domain: string;
  also?: readonly string[];
  host: string;
  status: string;
  lessons: readonly Lesson[];
  /** The can-do's one line (the stop's subtitle when there is one). */
  short?: string;
}

/** A path line's lessons (its bitmask, in LESSONS' order). */
export const lessonsOfMask = (mask: number): Lesson[] => LESSONS.filter((_, i) => mask & (1 << i));

export interface Stop extends PathUnit {
  state: UnitState | undefined;
  /** An anchor unit (glue): first in its stage, under 「はじめに おすすめ」. */
  anchor: boolean;
  /** The one unit 「つづける」 points at. */
  current: boolean;
  /** Filtered out: collapsed to a dot, so the stage's shape doesn't jump. */
  hidden: boolean;
  /** The lesson 「つづける」 / the unit page's primary starts. */
  next: Lesson;
}

interface StageRow {
  stage: Stage;
  /** ★ per step (はまべ ★ … ほし ★★★★★). */
  stars: number;
  stops: Stop[];
  /** Stamped of all (the filter never changes it). */
  stamped: number;
  /** Far above my comfortable level, or above the placed stage: shown softly (still playable). */
  soft: boolean;
  /** Every one of its units stamped by me (the day of the last stamp), else null: its landmark. Never by the
   *  placement, never by the partner's stamps; a stage with no units has none. */
  cleared: LocalDate | null;
}

export interface Path {
  stages: StageRow[];
  /** The current unit's id (null: nothing to do, or no units). */
  current: string | null;
  /** The domains the units carry, in DOMAINS' order (the chips after ぜんぶ). */
  chips: Domain[];
  /** The placed stage (みみ チェック's): 「ここから」; null before a check. */
  here: Stage | null;
  /** The stage open by default: the current unit's, else the placed one, else my comfortable one. */
  open: Stage;
}

/** The landmark a stage cleared unit by unit builds (docs/kikimimi-ux.md §7.2; cosmetic: no economy). */
export const LANDMARKS: Record<Stage, string> = { hama: '📻', kawa: '🛶', mori: '🏮', yama: '🔭', hoshi: '🌌' };

/** Each stage cleared unit by unit: every one of its units (≥ 1) stamped by me, on the day of the last stamp. The
 *  states are my stamps' (stamps.ts: a row of mine passing the チェック, solo or co-op); the partner's alone never count,
 *  and the placement isn't an input: a stage it skipped is open, not cleared. */
export function landmarksOf(units: readonly Pick<PathUnit, 'id' | 'stage'>[], states: ReadonlyMap<string, UnitState>): Map<Stage, LocalDate> {
  const out = new Map<Stage, LocalDate>();
  for (const stage of STAGE_IDS) {
    const days = units.filter((u) => u.stage === stage).map((u) => states.get(u.id)?.stamped ?? null);
    if (days.length && days.every((d) => d !== null)) out.set(stage, (days as LocalDate[]).reduce((a, b) => (b > a ? b : a)));
  }
  return out;
}

/** The lesson to play next in a unit: the first core lesson not done; with the core done but no stamp, the チェック
 *  again; stamped, an extra not played yet, else the チェック (a stamped unit can always be played again). */
export function nextLesson(lessons: readonly Lesson[], s: UnitState | undefined): Lesson {
  const done = s?.done ?? [];
  if (!s?.stamped) return CORE.find((l) => lessons.includes(l) && !done.includes(l)) ?? 'check';
  return lessons.find((l) => !CORE.includes(l) && !done.includes(l)) ?? 'check';
}

/** Whether a unit shows under the filter. */
export const matches = (u: Pick<PathUnit, 'domain' | 'also'>, f: Filter): boolean =>
  f === 'all' || u.domain === 'glue' || u.domain === f || !!u.also?.includes(f);

/** The comfortable level (きろく's, on levelRank's scale) before any data: はまべ 2's. */
const START_LEVEL = 2.5;

/**
 * The path: the units by stage (STAGES' order; in a stage the anchors first, then as given: the index's file order),
 * each with its state and next lesson; the current unit is the one I played last that isn't stamped, else the first
 * unstamped unit from my comfortable stage up, else the first unstamped one anywhere. A stage more than a step above
 * my comfortable level is soft. `filter` hides (never removes) the units of other domains. Units of a stage this phone
 * doesn't know are left out.
 */
export function pathOf(o: {
  units: readonly PathUnit[];
  states: ReadonlyMap<string, UnitState>;
  /** きろく's comfortable level (null: still measuring). */
  level: number | null;
  /** みみ チェック's placed level on levelRank's scale (null: no check): the stages above it are soft, it is 「ここから」. */
  placed?: number | null;
  /** The units of my lessons, in the order played (my games' `u`). */
  played?: readonly string[];
  filter?: Filter;
}): Path {
  const filter = o.filter ?? 'all';
  const placed = o.placed ?? null;
  const level = placed ?? o.level ?? START_LEVEL;
  const here = placed === null ? null : stageAt(placed).id;
  const byStage = new Map<Stage, PathUnit[]>(STAGE_IDS.map((s) => [s, []]));
  for (const u of o.units) byStage.get(u.stage as Stage)?.push(u);
  const ordered = STAGE_IDS.flatMap((s) => {
    const us = byStage.get(s)!;
    return [...us.filter((u) => u.domain === 'glue'), ...us.filter((u) => u.domain !== 'glue')];
  });
  const open = (u: PathUnit) => !o.states.get(u.id)?.stamped;
  const known = new Set(ordered.map((u) => u.id));
  const last = [...(o.played ?? [])].reverse().find((id) => known.has(id) && open(ordered.find((u) => u.id === id)!));
  const comfy = [...STAGE_IDS].reverse().find((s) => STAGES[s].rank <= level + 0.5) ?? STAGE_IDS[0];
  const from = STAGE_IDS.indexOf(comfy);
  const current = last ?? ordered.find((u) => STAGE_IDS.indexOf(u.stage as Stage) >= from && open(u))?.id ?? ordered.find(open)?.id ?? null;
  const chips = DOMAINS.filter((d) => o.units.some((u) => u.domain === d || u.also?.includes(d)));
  const cleared = landmarksOf(ordered, o.states);
  const softFrom = here ? STAGES[here].rank : level + 1;
  const stages = STAGE_IDS.map((stage): StageRow => {
    const us = ordered.filter((u) => u.stage === stage);
    const stops = us.map((u): Stop => {
      const state = o.states.get(u.id);
      return { ...u, state, anchor: u.domain === 'glue', current: u.id === current, hidden: !matches(u, filter), next: nextLesson(u.lessons, state) };
    });
    return { stage, stars: STAGES[stage].stars, stops, stamped: stops.filter((s) => s.state?.stamped).length, soft: STAGES[stage].rank > softFrom, cleared: cleared.get(stage) ?? null };
  });
  const opened = (current ? (ordered.find((u) => u.id === current)!.stage as Stage) : null) ?? here ?? comfy;
  return { stages, current, chips, here, open: opened };
}
