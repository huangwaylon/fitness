// しまの みち's model (docs/kikimimi-ux.md §6.3; docs/curriculum-units.md §1, §3; the UX review's sketch A): the stages
// as the spine (はまべ → かわ → もり → やま → ほし), each unit a stop on it with its lesson dots and stamps, a domain as a
// tag (an icon, a tint and a filter chip, never a second map), the anchor (glue) units first under 「はじめに おすすめ」,
// and the one current unit with 「つづける」. Every stage stays playable: one far above my comfortable level is only shown
// softly (the stage gate is placement's, みみ チェック, not built yet). Pure: the path index's lines, my unit states
// (stamps.ts) and my report's level and games in, the path out.
import { LESSONS, STAGES, type Lesson, type Stage } from './stages.ts';
import type { UnitState } from './stamps.ts';

/** The nine domains (plan §1) and the anchors' `glue`, each with its icon and tint (a theme token: day and night). */
export const DOMAINS = {
  glue: { icon: '💬', tint: 'var(--c-yuzu)' },
  tomodachi: { icon: '👥', tint: 'var(--c-coral)' },
  ie: { icon: '🏠', tint: 'var(--person-b)' },
  tabemono: { icon: '🍙', tint: 'var(--c-leaf)' },
  kaimono: { icon: '🛍️', tint: 'var(--c-lilac)' },
  tabi: { icon: '✈️', tint: 'var(--c-mint)' },
  shigoto: { icon: '💼', tint: 'var(--person-a)' },
  ibento: { icon: '🎉', tint: 'var(--c-yuzu)' },
  machi: { icon: '🏙️', tint: 'var(--c-mint)' },
  karada: { icon: '🩹', tint: 'var(--c-coral)' }
} as const;
export type Domain = keyof typeof DOMAINS;
export const isDomain = (d: string): d is Domain => d in DOMAINS;

/** The path's filter: every unit, or one domain's (the anchors stay: they're reused across domains). */
export type Filter = 'all' | Exclude<Domain, 'glue'>;

const STAGE_ORDER = Object.keys(STAGES) as Stage[];
/** The lessons that make a unit's stamp (plan §3): であい, ばめん, チェック; おと and じっせん are extras. */
export const CORE: readonly Lesson[] = ['deai', 'bamen', 'check'];

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
  /** Far above my comfortable level: shown softly (still playable). */
  soft: boolean;
}

export interface Path {
  stages: StageRow[];
  /** The current unit's id (null: nothing to do, or no units). */
  current: string | null;
  /** The domains the units carry, in DOMAINS' order (the chips after ぜんぶ). */
  chips: Exclude<Domain, 'glue'>[];
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
  /** The units of my lessons, in the order played (my games' `u`). */
  played?: readonly string[];
  filter?: Filter;
}): Path {
  const filter = o.filter ?? 'all';
  const level = o.level ?? START_LEVEL;
  const byStage = new Map<Stage, PathUnit[]>(STAGE_ORDER.map((s) => [s, []]));
  for (const u of o.units) byStage.get(u.stage as Stage)?.push(u);
  const ordered = STAGE_ORDER.flatMap((s) => {
    const us = byStage.get(s)!;
    return [...us.filter((u) => u.domain === 'glue'), ...us.filter((u) => u.domain !== 'glue')];
  });
  const open = (u: PathUnit) => !o.states.get(u.id)?.stamped;
  const known = new Set(ordered.map((u) => u.id));
  const last = [...(o.played ?? [])].reverse().find((id) => known.has(id) && open(ordered.find((u) => u.id === id)!));
  const comfy = [...STAGE_ORDER].reverse().find((s) => STAGES[s].rank <= level + 0.5) ?? STAGE_ORDER[0];
  const from = STAGE_ORDER.indexOf(comfy);
  const current = last ?? ordered.find((u) => STAGE_ORDER.indexOf(u.stage as Stage) >= from && open(u))?.id ?? ordered.find(open)?.id ?? null;
  const chips = (Object.keys(DOMAINS) as Domain[]).filter(
    (d): d is Exclude<Domain, 'glue'> => d !== 'glue' && o.units.some((u) => u.domain === d || u.also?.includes(d))
  );
  const stages = STAGE_ORDER.map((stage, i): StageRow => {
    const us = ordered.filter((u) => u.stage === stage);
    const stops = us.map((u): Stop => {
      const state = o.states.get(u.id);
      return { ...u, state, anchor: u.domain === 'glue', current: u.id === current, hidden: !matches(u, filter), next: nextLesson(u.lessons, state) };
    });
    return { stage, stars: i + 1, stops, stamped: stops.filter((s) => s.state?.stamped).length, soft: STAGES[stage].rank > level + 1 };
  });
  return { stages, current, chips };
}
