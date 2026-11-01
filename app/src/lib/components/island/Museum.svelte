<script lang="ts">
  // The museum (docs/design.md "Museum"): NH's upgraded museum, the map icon (one render family with the other
  // buildings), in おく between two oaks (world.ts BUILDINGS). It is a control, the door to the ずかん: a tap and Blathers (フータ) says a line in
  // NH's dialogue box (drowsy by day, lively at night, about the latest find when there's a recent one: blathers.ts),
  // and when the box closes (tapped away or read) the panel opens on きろく's ずかん. A second tap on the museum while he
  // talks opens it at once. Nothing counts: no ベル, no write.
  import OfficialArt from '../characters/OfficialArt.svelte';
  import { t } from '#lib/i18n/index.ts';
  import { jst, now } from '#lib/time/clock.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { ui } from '#lib/ui-state/ui.svelte.ts';
  import { u } from './scene.ts';
  import { BUILDINGS } from './world.ts';
  import { art as artOf } from '#lib/art.ts';
  import { useWorld } from './camera.svelte.ts';
  import { sceneSfx } from './sceneTaps.ts';
  import { RECENT_MS, blathersLine } from './blathers.ts';
  import { loadNames } from './catchLine.ts';

  interface Props {
    /** False in the gallery's thumbnails. */
    live: boolean;
    /** Say a line in the speech balloon (IslandScene's Talk). */
    say?: (name: string, parts: string | string[], from: Element, o?: { colour?: string; ondone?: () => void }) => void;
    /** Snow lies on its roof (winter: snow on the ground, as on the trees and the bushes). */
    snow?: boolean;
  }
  let { live, say, snow = false }: Props = $props();
  const M = BUILDINGS.find((b) => b.id === 'museum')!;
  const a = artOf(M.key);
  const W = a ? (M.h * a.w) / a.h : M.h * 1.37;
  const w = useWorld();

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

<div class="node" data-building="museum" {@attach w.at({ x: M.x, z: M.z, h: M.h })}>
  <button type="button" class="museum" data-scenery disabled={!live} data-sfx="self" aria-label={t('museum.label')} onclick={tap}
    style:width={u(W)} style:height={u(M.h)}>
    <span class="art" bind:this={art}>
      <OfficialArt key={M.key} width={u(W)} />
      {#if snow}
        <!-- snow on the roof's two slopes, in the icon's own units (293 × 214) -->
        <svg class="snow" viewBox="0 0 293 214" aria-hidden="true" data-roof-snow>
          <path d="M0 80 L146 1 L293 80 Q291 88 282 85 Q274 92 265 85 Q258 86 252 80 L146 20 L40 80 Q35 87 27 85 Q18 92 10 85 Q2 88 0 80 Z" />
        </svg>
      {/if}
    </span>
  </button>
</div>

<style>
  .node { width: 0; height: 0; transform-origin: 0 0; will-change: transform; }
  .museum {
    position: absolute; left: 0; bottom: 0; translate: -50% 0; padding: 0; margin: 0; border: 0; background: none;
    line-height: 0; cursor: pointer; -webkit-tap-highlight-color: transparent; border-radius: 12% 12% 4% 4%;
  }
  .museum:disabled { cursor: default; }
  .museum:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  .art { position: relative; display: block; transform-origin: 50% 100%; }
  .museum:active .art { transform: scale(.97, .98); }
  .art :global(.official) { max-width: none; }
  .snow { position: absolute; inset: 0; width: 100%; height: auto; fill: #FAFCFF; filter: drop-shadow(0 1.5px 0 #C9D6E6); pointer-events: none; }
</style>
