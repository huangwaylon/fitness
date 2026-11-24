// 保存した場所's search facets (docs/places.md "Search"): what the relay's details (each row's `det`: contract/places.ts
// PlaceDet, places-details.yml's daily scrape) say about every place that a search filters or ranks by — Google's
// kind, the rating and its count, the hours, whether there's a website or a phone — and the descriptions, as two
// tables built once per list (detTables). kinds.ts's table and romaji.ts's gazetteer are hashed build assets
// (`new URL(…, import.meta.url)`), never in the first load nor precached (the worker carries them once used:
// service-worker/caches.ts isFeatureChunk), fetched when the sheet opens (loadLexicon). Pure but for those fetches.
import { quiet } from '#lib/quiet.ts';
import type { Period, PlaceDet } from '../contract/places.ts';
import { setKinds } from './kinds.ts';
import { setGazetteer } from './romaji.ts';

/** One place's facets. hours: null unknown (or Google's explicit none). */
interface Facet {
  kind: string | null;
  r: number | null;
  rn: number;
  hours: Period[] | null;
  web: boolean;
  tel: boolean;
}

export interface FacetTable {
  get(id: string): Facet | undefined;
  readonly size: number;
}
export interface DescTable {
  get(id: string): string | undefined;
  readonly size: number;
}

/** The facets and the descriptions of the places with details (id → det). */
export function detTables(all: Readonly<Record<string, PlaceDet>>): { facets: FacetTable; descs: DescTable } {
  const facets = new Map<string, Facet>(), descs = new Map<string, string>();
  for (const [id, e] of Object.entries(all)) {
    facets.set(id, { kind: e.kind ?? null, r: e.r ?? null, rn: e.rn ?? 0, hours: e.hours?.length ? e.hours : null, web: !!e.web, tel: !!e.tel });
    if (e.desc) descs.set(id, e.desc);
  }
  return { facets, descs };
}

const fetchOf = <T>(url: string, read: (j: unknown) => T | null): Promise<T | null> =>
  quiet(fetch(url).then(async (r) => (r.ok ? read(await r.json()) : null)), 'places.facets', null);

// kinds.ts's table and romaji.ts's gazetteer: data assets of their own (their chunk was precached), the same lifecycle
const KINDS_URL = new URL('./data/places-kinds.json', import.meta.url).href;
const GAZETTEER_URL = new URL('./data/places-gazetteer.json', import.meta.url).href;
let lexicon: Promise<boolean> | null = null;

/** The kinds' table and the gazetteer, fetched once a session and set (true once both are in: the index rebuilds). */
export const loadLexicon = (): Promise<boolean> =>
  (lexicon ??= Promise.all([fetchOf(KINDS_URL, (j) => setKinds(j) || null), fetchOf(GAZETTEER_URL, (j) => setGazetteer(j) || null)]).then(([k, g]) => !!k && !!g));
