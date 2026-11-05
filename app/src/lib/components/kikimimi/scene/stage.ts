// ききみみ's scene card (docs/kikimimi.md "Visuals"): which items it stages, who stands in it, and the next question's
// art fetched ahead (with its clip: game.svelte.ts). Loaded with the sheet only.
import { channelOf, isDialogue, type Item } from '#lib/kikimimi/bank.ts';
import { artUrl, villagerArt } from '#lib/art.ts';
import type { RosterId } from '#lib/villagers/roster.ts';

/** A scene's backdrop: its art key (static/art/scene/<id>.webp, painted by scripts/scenes/scenes.ts). */
export const sceneArt = (id: string): string => `scene/${id}`;

/** A backdrop's srcset: the 1x file and its @2x and @3x beside it (only the 1x is in the art manifest). */
export function sceneSrcset(id: string): string | null {
  const u = artUrl(sceneArt(id));
  return u && `${u} 1x, ${u.replace(/\.webp$/, '@2x.webp')} 2x, ${u.replace(/\.webp$/, '@3x.webp')} 3x`;
}

/** The card's width: the sheet's, at most 393 css px (img `sizes`: the phone picks its scale's file). */
export const SCENE_SIZES = '(max-width: 520px) 100vw, 393px';

/** Whether the scene card stands in for the plain stage while the clip plays: a scene, or a phone, PA or video call. */
export const isStaged = (it: Item): boolean => !!it.scene || channelOf(it) !== 'live';

/** Who speaks, in order of first line (a dialogue's two, else the speaker). */
export const speakersOf = (it: Item): RosterId[] => (isDialogue(it) ? [...new Set(it.lines.map((l) => l.who))] : [it.speaker]);

/** A video call's others (never the speakers): who fills its 2×2 grid, the same for an item on every phone. */
const CALLERS: readonly RosterId[] = ['judy', 'sherb', 'apollo', 'goldie', 'raymond', 'bunnie', 'marshal', 'fauna'];
export function videoTiles(it: Item): RosterId[] {
  const who = speakersOf(it);
  let h = 0;
  for (const c of it.id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const others = CALLERS.filter((c) => !who.includes(c));
  const out = [...who];
  for (let k = 0; out.length < 4; k++) out.push(others[(h + k) % others.length]);
  return out;
}

/** Fetch an item's card art into the image cache before it shows: its backdrop at the phone's scale (and, standing in
 *  the scene face to face, its speakers' full-body art). One question ahead, as its clip is. */
export function preloadStage(it: Item | undefined): void {
  if (!it || !isStaged(it) || typeof Image === 'undefined') return;
  if (it.scene) {
    const img = new Image();
    img.decoding = 'async';
    img.sizes = SCENE_SIZES;
    img.srcset = sceneSrcset(it.scene) ?? '';
  }
  if (channelOf(it) === 'live')
    for (const who of speakersOf(it)) {
      const src = artUrl(villagerArt(who));
      if (src) new Image().src = src;
    }
}
