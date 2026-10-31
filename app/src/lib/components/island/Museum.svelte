<script lang="ts">
  // The museum (docs/design.md "Museum"): NH's museum, the official render, on the back of the island in the middle,
  // scaled down to a small building. It is a control, the door to the ずかん: a tap and Blathers (フータ) says a line in
  // NH's dialogue box (drowsy by day, lively at night, about the latest find when there's a recent one: blathers.ts),
  // and when the box closes (tapped away or read) the panel opens on きろく's ずかん. A second tap on the museum while he
  // talks opens it at once. Nothing counts: no ベル, no write.
  import OfficialArt from '../characters/OfficialArt.svelte';
  import { t } from '#lib/i18n/index.ts';
  import { jst, now } from '#lib/time/clock.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { ui } from '#lib/ui-state/ui.svelte.ts';
  import { MUSEUM, u } from './scene.ts';
  import { sceneSfx } from './sceneTaps.ts';
  import { RECENT_MS, blathersLine } from './blathers.ts';
  import { loadNames } from './catchLine.ts';

  interface Props {
    /** False in the gallery's thumbnails. */
    live: boolean;
    /** Say a line in the speech balloon (IslandScene's Talk). */
    say?: (name: string, parts: string | string[], from: Element, o?: { colour?: string; ondone?: () => void }) => void;
    /** Snow lies on its roof (winter: snow on the ground, as on the trees and the hedge). */
    snow?: boolean;
  }
  let { live, say, snow = false }: Props = $props();

  /** Blathers' NH colour (the roster's), for his name tag. */
  const COLOUR = '#7D593C';
  let art = $state<HTMLElement>();
  let talking = false;
  let last: string | undefined;

  /** The latest find of either of us within RECENT_MS, as its name (with the catalogue's article in English; the names'
   *  own catalog loads with it). */
  async function recentFind(): Promise<string | null> {
    const s = week.model?.state, at = now().getTime();
    const f = s?.finds.reduce<(typeof s.finds)[number] | null>((a, b) => (!a || b.at > a.at ? b : a), null);
    if (!f || at - f.at > RECENT_MS) return null;
    await loadNames().catch(() => {});
    return t(f.kind === 'fish' || f.kind === 'bug' ? `critter.name.${f.id}` : `beach.name.${f.id}`);
  }

  const openZukan = () => {
    talking = false;
    ui.zukan = true;
  };

  async function tap() {
    if (!live) return;
    if (talking) return openZukan(); // he's still talking: straight in
    sceneSfx('museum');
    talking = true;
    const name = await recentFind();
    last = blathersLine(jst(now()).hour, !!name, Math.random, last);
    if (!say || !art) return openZukan();
    say(t('museum.blathers'), t(last, { name }), art, { colour: COLOUR, ondone: () => talking && openZukan() });
  }
</script>

<button type="button" class="museum" data-scenery style:left={u(MUSEUM.x)} style:top={u(MUSEUM.base)} style:--w={u(MUSEUM.w)} disabled={!live}
  data-sfx="self" aria-label={t('museum.label')} onclick={tap}>
  <span class="art" bind:this={art}>
    <OfficialArt key="deco/museum" width={u(MUSEUM.w)} />
    {#if snow}
      <!-- snow on the pediment's slopes and its ledge, in the render's own units (360 × 197) -->
      <svg class="snow" viewBox="0 0 360 197" aria-hidden="true" data-roof-snow>
        <path d="M34 64 L180 0 L326 64 Q324 70 316 68 Q309 73 302 67 Q296 66 292 61 L180 11 L68 61 Q64 66 58 67 Q51 73 44 68 Q36 70 34 64 Z" />
        <path d="M50 64 H310 Q312 70 304 70 Q296 74 288 70 H72 Q64 74 56 70 Q48 70 50 64 Z" />
      </svg>
    {/if}
  </span>
</button>

<style>
  /* on the back of the island: its plaza slab's front edge at `base`; behind the trees, the jar and everyone (z under
     the hedge's 20, so a bush in front of it overlaps its foot like NH's camera) */
  .museum {
    position: absolute; z-index: 18; width: var(--w); translate: -50% -100%; padding: 0; margin: 0; border: 0; background: none;
    line-height: 0; cursor: pointer; -webkit-tap-highlight-color: transparent; border-radius: 12% 12% 4% 4%;
  }
  .museum:disabled { cursor: default; }
  .museum:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  .art { display: block; filter: drop-shadow(1px 2px 1.5px rgba(70, 50, 25, .3)); transform-origin: 50% 100%; }
  .museum:active .art { transform: scale(.97, .98); }
  .art :global(.official) { max-width: none; }
  .art { position: relative; }
  .snow { position: absolute; inset: 0; width: 100%; height: auto; fill: #FAFCFF; filter: drop-shadow(0 1.5px 0 #C9D6E6); pointer-events: none; }
</style>
