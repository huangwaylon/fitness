// ききみみ クイズ's content on the phone (docs/kikimimi.md "Loading"): the compiled levels (compile.ts → levels/). The
// index comes with the sheet: each level's parts, the gates, the sound check's clip, and every item's id, level, type,
// accent and tags (ENTRIES: きろく's stats and advice, にがて れんしゅう's picks, with no level loaded). A level's items,
// clips and word timings are a chunk of their own (the ladders' too), loaded when a game needs them (`load`): the
// lobby's level, a heard `open`'s, にがて れんしゅう's picks (game.svelte.ts waits for them before a deck is built).
// Decks read only loaded levels (levelItems throws on one that isn't: a deck from half a bank would differ between phones).
import INDEX_JSON from './levels/index.json';
import type { Accent, Entry, Feature, Item, ItemType, Level, Tags } from './bank.ts';
import { addClips, type ChunkClip, type Words } from './clips.ts';
import type { Ladder } from './ladder.ts';

/** What a chunk holds: a level's items (or the ladders; a unit's: the unit, its lessons' items and ladders) and their
 *  clips and word timings. */
interface Part {
  unit?: unknown;
  items?: Item[];
  ladders?: Ladder[];
  /** The audio packs its clips are in (stems: `lv4-2.1a2b3c4d`). */
  packs: string[];
  clips: Record<string, ChunkClip>;
  words: Record<string, Words>;
}

/** A unit on the island path (docs/curriculum-units.md, units.ts): id, name, stage, domain, host, status, and its
 *  lessons as a bitmask in units.ts LESSONS' order (the 3 core always; 8 おと, 16 じっせん), and the can-do's one line when it has one. */
export type PathEntry = [id: string, name: string, stage: string, domain: string, host: string, status: string, lessons: number, short?: string];

/** levels/index.json (compile.ts). */
export interface Index {
  /** Each level's (and 'ladder''s, and each unit's) parts in order, its items (ladders) and its content version. */
  units: Record<string, { parts: string[]; n: number; cv: string }>;
  /** The levels the lobby offers (every clip of the items their mix draws). */
  offered: Level[];
  /** Level 4's dialogues are voiced (its mix draws them). */
  dialogues: boolean;
  /** スピード はしご is offered (every rung's clip). */
  ladder: boolean;
  /** The lobby's sound check: a clip from no game (the bank's first level-1 item), and its pack. */
  test: [string, ChunkClip, string[]];
  /** The units, in file order (units.ts's `status` gates them on the phone, a later step). */
  paths: PathEntry[];
  /** Every item, in the bank's order: id, level, type, accent, pragmatic layer, features. */
  items: [string, Level, ItemType, Accent, Tags['pragmatic'], Feature[]][];
  /** Every rung's id (`<ladder>-<n>`). */
  rungs: string[];
}

export const INDEX = INDEX_JSON as unknown as Index;

/** A chunk's owner: a level's items, the ladders, or a unit's (docs/curriculum-units.md: `<domain2>-<slug>`). */
export type Unit = Level | 'ladder' | `${string}-${string}`;

const PARTS = import.meta.glob<Part>('./levels/parts/*.json', { import: 'default' });

/** Every item as the index knows it, in the bank's order. */
export const ENTRIES: readonly Entry[] = INDEX.items.map(([id, lv, type, voice, pragmatic, features]) => ({ id, lv, type, voice, tags: { pragmatic, features } }));
const BY_ID: ReadonlyMap<string, Entry> = new Map(ENTRIES.map((e) => [e.id, e]));
/** An item of this build by id (a `listen` row's answer), loaded or not. */
export const entryOf = (id: string): Entry | undefined => BY_ID.get(id);

const RUNGS: ReadonlySet<string> = new Set(INDEX.rungs);
/** Whether an item id is a rung's (a ladder game's answers: `sp-…-n`). */
export const isRungId = (id: string): boolean => RUNGS.has(id);
/** A rung's ladder and place on it (1-4), from its id. */
export const rungAt = (id: string): { ladder: string; n: number } | undefined => {
  const m = RUNGS.has(id) ? /^(.*)-(\d+)$/.exec(id) : null;
  return m ? { ladder: m[1], n: Number(m[2]) } : undefined;
};

/** The unit an item's chunk is: its level's, or the ladders' for a rung. */
export const unitOf = (id: string): Unit | undefined => (RUNGS.has(id) ? 'ladder' : BY_ID.get(id)?.lv);

addClips(INDEX.test[2], { [INDEX.test[0]]: INDEX.test[1] }, {});
/** The sound check's clip id. */
export const TEST_CLIP = INDEX.test[0];

// ---- loading ----------------------------------------------------------------------------------------------------------

const got = new Map<string, Part>();
const coming = new Map<string, Promise<void>>();
const ITEMS = new Map<string, Item>();
const LEVEL = new Map<Unit, Item[]>();
let LADDERS: Ladder[] | null = null;

/** Units put in at run time (addUnit: a test's or the dev hook's fixture, never a build's), by id → its chunk's name. */
const EXTRA = new Map<string, string>();

const partsOf = (u: Unit): readonly string[] => INDEX.units[u]?.parts ?? (EXTRA.has(String(u)) ? [EXTRA.get(String(u))!] : []);

/** Whether a unit's chunks are all in (a unit with none, a level this build hasn't: yes). */
export const loaded = (u: Unit): boolean => partsOf(u).every((p) => got.has(p));

function take(name: string, part: Part): void {
  got.set(name, part);
  addClips(part.packs, part.clips, part.words);
  for (const it of part.items ?? []) ITEMS.set(it.id, it);
  for (const l of part.ladders ?? []) for (const it of l.rungs) ITEMS.set(it.id, it);
}

function fetchPart(name: string): Promise<void> {
  if (got.has(name)) return Promise.resolve();
  let p = coming.get(name);
  if (!p) {
    const load = PARTS[`./levels/parts/${name}.json`];
    if (!load) return Promise.reject(new Error(`kikimimi: no chunk ${name}`));
    p = load().then((part) => take(name, part)).finally(() => coming.delete(name));
    coming.set(name, p);
  }
  return p;
}

/** The units' chunks loaded (each fetched once; a failed one is tried again next time). */
export async function load(...units: readonly Unit[]): Promise<void> {
  await Promise.all(units.flatMap((u) => partsOf(u).map(fetchPart)));
}

/** The chunks of these items loaded (にがて れんしゅう's picks, a test's deck). */
export const loadIds = (ids: readonly string[]): Promise<void> => load(...new Set(ids.map(unitOf).filter((u) => u !== undefined)));

/** Every chunk (tests). */
export const loadAll = (): Promise<void> => load(...Object.keys(INDEX.units).map((u): Unit => (/^\d+$/.test(u) ? (Number(u) as Level) : (u as Unit))));

/** A loaded level's items, in the bank's order (deck.ts's pool). */
export function levelItems(lv: Level): readonly Item[] {
  let items = LEVEL.get(lv);
  if (!items) {
    if (!loaded(lv)) throw new Error(`kikimimi: level ${lv} isn't loaded`);
    items = partsOf(lv).flatMap((p) => got.get(p)!.items ?? []);
    LEVEL.set(lv, items);
  }
  return items;
}

/** The ladders, loaded (ladder.ts ladderDeck's). */
export function ladders(): readonly Ladder[] {
  if (!LADDERS) {
    if (!loaded('ladder')) throw new Error("kikimimi: the ladders aren't loaded");
    LADDERS = partsOf('ladder').flatMap((p) => got.get(p)!.ladders ?? []);
  }
  return LADDERS;
}

/** A loaded unit's chunk (a lesson's deck: lesson.ts): the unit as compiled (compile.ts unitChunk) and its lessons'
 *  items and ladders, as authored; undefined while it isn't loaded or this build hasn't it. */
export function unitPart(id: string): { unit: unknown; items: readonly Item[]; ladders: readonly Ladder[] } | undefined {
  const names = partsOf(id as Unit);
  if (!names.length || !names.every((p) => got.has(p))) return undefined;
  const parts = names.map((p) => got.get(p)!);
  const unit = parts.find((p) => p.unit)?.unit;
  return unit ? { unit, items: parts.flatMap((p) => p.items ?? []), ladders: parts.flatMap((p) => p.ladders ?? []) } : undefined;
}

/** A unit's chunk put in at run time, as if loaded (the lessons' unit tests, the e2e's fixture through the dev hook:
 *  docs/curriculum-units.md §8 U2-U3). Its id must not be a build's. */
export function addUnit(id: string, part: { unit: unknown; items: Item[]; ladders?: Ladder[] }): void {
  if (INDEX.units[id]) throw new Error(`kikimimi: unit ${id} is this build's`);
  const name = `u-${id}`;
  EXTRA.set(id, name);
  take(name, { ...part, packs: [], clips: {}, words: {} });
}

/** The units this phone can play: the build's (the index's path lines) and any put in at run time (addUnit). */
export const unitIds = (): string[] => [...INDEX.paths.map((p) => p[0]), ...[...EXTRA.keys()].filter((id) => !INDEX.units[id])];

/** A loaded item by id (a rung too), as authored. */
export const itemOf = (id: string): Item | undefined => ITEMS.get(id);
