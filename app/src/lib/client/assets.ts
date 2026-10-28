// Official New Horizons art (static/art/, fetched by `npm run assets:fetch`; see docs/ops/runbook.md).
// The manifest is bundled at build time, so keys, sizes and aspect ratios are known synchronously:
// no fetch, no auth. Render through <OfficialArt>, which falls back to our fan-art on error / missing key.
import { asset } from '$app/paths';
import manifest from '../../../static/art/manifest.json';
import type { FruitKey } from '#lib/types.ts';

export interface ArtEntry {
  path: string;
  w: number;
  h: number;
  source: string;
}

const FILES = manifest.files as Record<string, ArtEntry>;

/** Manifest entry for a key like 'villagers/raymond', or null when that art isn't on disk. */
export function art(key: string | null | undefined): ArtEntry | null {
  return (key && FILES[key]) || null;
}

/** URL for a key (base-path aware, so the Pages `/fitness` base works), or null when missing. */
export function artUrl(key: string | null | undefined): string | null {
  const e = art(key);
  return e ? asset(`art/${e.path}` as Parameters<typeof asset>[0]) : null;
}

/** Roster villager → full-body render, or the round head icon. Unknown ids → null (use fan-art). */
export function villagerArt(id: string | null | undefined, icon = false): string | null {
  if (!id) return null;
  const key = `villagers/${id}${icon ? '-icon' : ''}`;
  return FILES[key] ? key : null;
}

export type HostPose = 'wave' | 'stand' | 'bow' | 'winter' | 'icon';
const HOST: Record<HostPose, string> = {
  wave: 'host/isabelle',
  stand: 'host/isabelle-stand',
  bow: 'host/isabelle-bow',
  winter: 'host/isabelle-winter',
  icon: 'host/isabelle-icon'
};
/** Isabelle: 'wave' (cheerful, default), 'stand' (calm), 'bow' (sorry / thanks), 'winter', 'icon'. */
export function hostArt(pose: HostPose = 'wave'): string {
  return HOST[pose];
}

/** One of the four fruit-ring fruits → inventory icon key. */
export function fruitArt(fruit: FruitKey): string {
  return `fruit/${fruit}`;
}

/** Money UI: 'bells' (Bells bag, = yen), 'miles' (Nook Miles), 'leaf'. */
export function moneyArt(kind: 'bells' | 'miles' | 'leaf' | 'ticket'): string {
  return { bells: 'money/bells', miles: 'money/nook-miles', leaf: 'money/leaf', ticket: 'money/nook-miles-ticket' }[kind];
}
