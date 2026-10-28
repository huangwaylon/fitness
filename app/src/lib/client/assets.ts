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
  /** Visible (non-transparent) box `[x, y, w, h]` in file pixels; only for renders with big margins. */
  box?: [number, number, number, number];
}

const FILES = manifest.files as Record<string, ArtEntry>;

// Renders whose figure sits in a padded canvas: <OfficialArt> crops to this box so `size` means
// "figure height" for every character. (Measured from the alpha channel; the rest are already tight.)
const BOX: Record<string, [number, number, number, number]> = {
  'host/isabelle-stand': [140, 42, 231, 428],
  'host/isabelle-bow': [140, 42, 231, 428],
  'villagers/hamlet': [28, 20, 329, 482]
};

/** Manifest entry for a key like 'villagers/raymond', or null when that art isn't on disk. */
export function art(key: string | null | undefined): ArtEntry | null {
  const e = (key && FILES[key]) || null;
  return e && key && BOX[key] ? { ...e, box: BOX[key] } : e;
}

/** Every manifest key (dev gallery). */
export function artKeys(): string[] {
  return Object.keys(FILES);
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

/** しまフォン launcher app → official icon key. `tile: true` = the icon is a full squircle tile
 *  (render it without our tile background); false = a loose item icon (keep our tile behind it). */
export type PhoneApp = 'help' | 'villager' | 'lang' | 'bell' | 'sync' | 'share';
const PHONE: Record<PhoneApp, { key: string; tile: boolean }> = {
  help: { key: 'phone/rescue', tile: true },
  villager: { key: 'phone/passport', tile: true },
  lang: { key: 'money/leaf', tile: false },
  bell: { key: 'phone/nook-miles', tile: true },
  sync: { key: 'phone/island-designer', tile: true },
  share: { key: 'phone/nook-shopping', tile: true }
};
export function phoneArt(app: PhoneApp | string): { key: string; tile: boolean } | null {
  return PHONE[app as PhoneApp] ?? null;
}
/** The NookPhone itself (launcher button). */
export const NOOKPHONE = 'phone/nookphone';

/** Money UI: 'bells' (Bells bag, = yen), 'miles' (Nook Miles), 'leaf'. */
export function moneyArt(kind: 'bells' | 'miles' | 'leaf' | 'ticket'): string {
  return { bells: 'money/bells', miles: 'money/nook-miles', leaf: 'money/leaf', ticket: 'money/nook-miles-ticket' }[kind];
}
