// Group stretching's tape deck (docs/design.md "Group stretching"), after NH's ラジオ体操 in the plaza: it turns up on the
// lawn's world.ts TAPE_DECK, the layout's fixed piece (world3d/objects.ts: NH's boom box at the villagers' scale, there
// every day). Its tape is ready on a day either of us met 🍑 Exercise, or when the island is opened 06:00–08:00
// (stretching.ts): a tap plays it for everyone (the island's music stage, sound/stage.svelte.ts: NH's aerobics music on
// every phone outdoors from the same point, docs/sound-sync.md; unheard, the tape's little march) and both villagers,
// and the visitor if one is out and awake, do three of NH's stretches together (~6 s, motion/stretch.svelte.ts) on
// every phone as the song starts, ♪ rising from the deck; once a day (on each phone that saw it). Not ready, a tap says
// why not (done today, or when it plays); ready, a single ♪ floats up now and then (a tape deck: tap it). No ベル.
// No DOM of its own (R4 step 7): the 3D island draws its model and its ♪ (things3: emit 'notes'); SceneTaps loads this
// chunk and asks it about each tap (`tap`, client px). ?stretch (dev or test mode) brings the deck out now.
import { untrack } from 'svelte';
import { hookFlag } from '#lib/world/devHooks.ts';
import { TAPE_DECK } from '#lib/world/world.ts';
import { site } from './site.svelte.ts';
import type { World } from './camera.svelte.ts';
import { thing, things3 } from '../world3d/things3.ts';
import { sceneSfx } from './sceneTaps.ts';
import { MIN_HIT, SHOWN, drawn3, grow, inside, type Seen } from './hitbox.ts';
import { cutInSong, live, request } from '#lib/sound/stage.svelte.ts';
import { onStageStart } from '#lib/sound/stageStart.svelte.ts';
import { dayKey, jst, minuteNow } from '#lib/time/clock.ts';
import { POSES, POSE_MS, STRETCH_MS, deckOut, sawIsland, stretched, stretchedToday } from './stretching.ts';
import { t } from '#lib/i18n/index.ts';
import { groupStretch } from '../motion/stretch.svelte.ts';
import type { SaySpeaker } from '#lib/world/say.ts';

/** What SceneTaps asks of a prop (the deck, the cake). */
export type Prop = {
  tap(px: number, py: number, seen?: Seen): boolean;
  claims(px: number, py: number, seen?: Seen): boolean;
};
/** The deck as the e2e's hooks have it (things3 probes 'deck'; Island3D adds `shown` by its thing `id3`): on (playing),
 *  ready (its day), idle; `hint`: its ♪ asking for a tap; its model's box (till that's in, one its size on its foot). */
export interface DeckRow { state: 'on' | 'ready' | 'idle'; hint: boolean; id3: string; box: { left: number; top: number; width: number; height: number } }

/** Its height on the 3D island (u): NH's boom box (7.3 model units) at the villagers' scale (assets.json deco/tape-deck:
 *  5.4u a unit, as NH has it beside them), its tap area that high. */
const UP = 39.5;

/** A prop's box on screen (client px): its model's silhouette (drawn3), till that's in one `wd` × `ht` u on its foot. */
export function propBox(w: World, id: string, x: number, z: number, wd: number, ht: number) {
  const r = drawn3(w, id);
  if (r) return { left: r.left, top: r.top, width: r.width, height: r.height };
  const [cx, cy] = w.clientAt(x, z), k = w.scaleAt(x, z) * w.view.s;
  return { left: cx - (wd * k) / 2, top: cy - ht * k, width: wd * k, height: ht * k };
}
/** A box as a balloon's speaker (Talk's), there while `on`. */
export const boxSpeaker = (box: () => { left: number; top: number; width: number; height: number }, on: () => boolean): SaySpeaker => ({
  get isConnected() {
    return on();
  },
  getBoundingClientRect() {
    const b = box();
    return new DOMRect(b.left, b.top, b.width, b.height);
  }
});

/** The tape deck on island `w`: its effects in a root of their own (`stop` with the scene). */
export function useDeck(w: World, o: {
  /** Live, not covered by a sheet, page visible. */
  enabled: () => boolean;
  /** Either of us met 🍑 Exercise today. */
  exercise: () => boolean;
  /** A line in a balloon from the deck (Talk's). */
  say?: (name: string, parts: string | string[], from: SaySpeaker, o?: { colour?: string }) => void;
}): Prop & { stop: () => void } {
  const { enabled } = o;
  let api!: Prop;
  const stop = $effect.root(() => {
    const want = hookFlag('stretch');
    const clock = $derived(minuteNow());
    const date = $derived(dayKey(clock));
    /** Bumped when today's stretch is done (the deck re-derives). */
    let bump = $state(0);
    /** The stretch's song on the island's stage (events.ts `aerobics`, looped for the routine), playing (anyone's tap). */
    const SONG = cutInSong('aerobics');
    const playing = $derived(live('isl')?.song === SONG);
    $effect(() => sawIsland(date, jst(clock).hour));
    /** Ready to play: not played today, and an Exercise day or a morning (or the dev hook's). */
    const ready = $derived.by(() => {
      void bump;
      void clock;
      return playing || (want && bump === 0) || deckOut(date, jst(clock).hour, o.exercise());
    });
    /** Its spot (world x, z): the layout's (re-read as the layout changes). */
    const spot = $derived((void site.rev, TAPE_DECK));

    // the stretch's record starts (my tap or another's): done for today here too, and the routine as the song starts (a
    // phone opening a second or more into it only sees the deck play); unheard here, the tape's little tune
    onStageStart(SONG, 'stretch', (fresh) => {
      stretched(date);
      bump++;
      if (fresh) groupStretch(POSES, POSE_MS);
    });

    // its model, ♪ rising while it plays, a single ♪ now and then while it's ready
    $effect(() => {
      const [x, z] = spot, emit = playing ? { kind: 'notes', every: 1300, lift: UP * 0.8 } : ready ? { kind: 'notes', v: 'one', every: 4500, lift: UP * 0.9 } : undefined;
      return untrack(() => thing(w, { x, z, h: UP + 22, m3: { key: 'deco/tape-deck', id: 'tape-deck', emit } })());
    });
    const box = () => propBox(w, 'tape-deck', spot[0], spot[1], UP * 1.3, UP);

    /** Whether a tap at client (px, py) is the deck's (no side effect: SceneTaps' claims, the 3D pick's oracle): on its
     *  model grown to MIN_HIT, 6 px round it, in view. */
    function claims(px: number, py: number, seen: Seen = SHOWN): boolean {
      if (!enabled() || !w.inView(spot[0], spot[1]) || !seen(spot[0], spot[1])) return false;
      return inside(grow(box(), MIN_HIT, 6), px, py);
    }
    /** A tap on the scene (client px): true when the deck took it. Not ready (the layout's deck, every day): a line
     *  saying why. */
    function tap(px: number, py: number, seen: Seen = SHOWN): boolean {
      if (!claims(px, py, seen)) return false;
      if (playing) return true;
      if (ready) request('isl', SONG, { ms: STRETCH_MS });
      else {
        sceneSfx('decor');
        o.say?.(t('world.deck'), t(stretchedToday(date) ? 'world.deck.done' : 'world.deck.when'), boxSpeaker(box, () => true), { colour: '#FFF1C9' });
      }
      return true;
    }

    // The e2e's row (things3 probes 'deck') and box ('deck').
    $effect(() => {
      const r = things3(w);
      const row = (): DeckRow => ({ state: playing ? 'on' : ready ? 'ready' : 'idle', hint: !playing && ready, id3: 'tape-deck', box: box() });
      const b = () => ({ ...box(), foot: [...w.clientAt(spot[0], spot[1])] as [number, number] });
      r.probes.set('deck', row);
      r.boxes.set('deck', b);
      return () => {
        if (r.probes.get('deck') === row) r.probes.delete('deck');
        if (r.boxes.get('deck') === b) r.boxes.delete('deck');
      };
    });
    api = { tap, claims };
  });
  return Object.assign(api, { stop });
}
