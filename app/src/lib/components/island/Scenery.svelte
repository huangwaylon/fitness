<script lang="ts">
  // The island's still scenery (docs/design.md "World"): the trees that aren't goal trees (oaks, cedars, palms, bamboo),
  // the bushes (the hedge of the month, the plumeria at the beach, the campsite's hollies), the props (lamps, lanterns,
  // meadow clumps, rocks) and the campsite's tent (an NH map icon), each an upright world node at its feet. An oak is two nodes (its trunk and its canopy, the canopy's depth 14u nearer), so a
  // villager just in front of the trunk covers it while the leaves cover their head. Contact shadows are baked into the
  // ground. A bush answers a tap (SceneTaps finds it by data-bush), and so does a tree's leaves (data-tree: a rustle,
  // three quick taps shake it); a building is a door (`onbuilding`).
  import OfficialArt from '../characters/OfficialArt.svelte';
  import { art, treeArt } from '#lib/art.ts';
  import type { Season } from '#lib/ui-state/theme.svelte.ts';
  import type { Foliage } from '#lib/ui-state/season.ts';
  import { t } from '#lib/i18n/index.ts';
  import { BUILDINGS, HEDGE_XS, HEDGE_Z, SCENERY, type BuildingId, type Scenery } from './world.ts';
  import { GLOW_AT, LIT_ART, hedgePair, sceneryKey, type Tod } from './scene.ts';
  import { useWorld } from './camera.svelte.ts';

  interface Props {
    season: Season;
    foliage: Foliage;
    month: number;
    /** False in the gallery's thumbnails (nothing answers a tap). */
    live?: boolean;
    /** The campsite's door was tapped (the art's element, for a balloon's tail). */
    onbuilding?: (id: BuildingId, el: HTMLElement) => void;
    /** At dusk and night the campsite's lantern and the lamps light up. */
    tod?: Tod;
  }
  let { season, foliage, month, live = true, onbuilding, tod = 'day' }: Props = $props();
  const w = useWorld();

  /** The oak render's trunk and canopy (the summer render and the seasonal ones share the shape). */
  const TRUNK = 'polygon(29% 53%, 71% 53%, 72% 84%, 88% 89%, 88% 100%, 12% 100%, 12% 89%, 28% 84%)';
  const CANOPY = 'polygon(0 0, 100% 0, 100% 67%, 66% 67%, 66% 56%, 34% 56%, 34% 67%, 0 67%)';
  const BUSH_H = 40;
  const hedge = $derived.by((): Scenery[] => {
    const [a, b] = hedgePair(month);
    return HEDGE_XS.map((x, i) => ({ id: `hedge-${i}`, kind: 'bush', key: `bushes/${i % 2 ? b : a}`, x, z: HEDGE_Z, h: BUSH_H }));
  });
  const keyOf = (s: Scenery) => (s.kind === 'oak' ? treeArt(foliage) : sceneryKey(s.key, season, month));
  /** Lights: the windows and lamps (over the time-of-day tint, as the fireflies: between --z-tint and --z-taps). */
  const lit = $derived(tod === 'night' ? 1 : tod === 'dusk' ? 0.7 : 0);
  const NIGHT_Z = 60000081;
  const lamps = SCENERY.filter((s) => GLOW_AT[s.key]);
  const winter = $derived(season === 'winter');
  const wOf = (key: string, h: number) => {
    const a = art(key);
    return a ? (h * a.w) / a.h : h;
  };
</script>

{#snippet sprite(s: Scenery, clip: string | null = null, part = 'body')}
  {@const key = keyOf(s)}
  <div class="spr" data-scenery-id={s.id} data-kind={s.kind} data-part={part} {@attach w.at({ x: s.x, z: s.z, h: s.h, dz: part === 'canopy' ? -14 : 0 })}>
    <span class="art" class:flip={s.flip} class:snow={winter && s.kind === 'bush'} class:bush={s.kind === 'bush'} data-bush={s.kind === 'bush' ? s.id : undefined}
      style:height="calc({s.h} * var(--u))" style:width="calc({wOf(key, s.h)} * var(--u))" style:clip-path={clip}>
      <OfficialArt {key} size="calc({s.h} * var(--u))" eager={s.z < 1080} />
      {#if live && (s.kind === 'cedar' || s.kind === 'palm' || part === 'canopy')}
        <!-- its leaves answer a tap (SceneTaps: a rustle; three quick taps shake it) -->
        <i class="hit {s.kind}" data-tree={s.id}></i>
      {/if}
    </span>
  </div>
{/snippet}

{#each [...SCENERY, ...hedge] as s (s.id)}
  {#if s.kind === 'oak'}
    {@render sprite(s, TRUNK, 'trunk')}
    {@render sprite(s, CANOPY, 'canopy')}
  {:else}
    {@render sprite(s)}
  {/if}
{/each}

{#each BUILDINGS as b (b.id)}
  <div class="spr building" data-building={b.id} {@attach w.at({ x: b.x, z: b.z, h: b.h })}>
    <button type="button" class="door" disabled={!live} data-sfx="self" data-scenery aria-label={t(`world.building.${b.id}`)}
      style:height="calc({b.h} * var(--u))" style:width="calc({wOf(b.key, b.h)} * var(--u))"
      onclick={(e) => onbuilding?.(b.id, e.currentTarget)}>
      <OfficialArt key={sceneryKey(b.key, season, month)} size="calc({b.h} * var(--u))" eager />
    </button>
  </div>
{/each}

{#if lit}
  {#each BUILDINGS as b (b.id)}
    {#if LIT_ART[b.key]}
      <div class="spr lit" data-lit={b.id} style:opacity={lit} {@attach w.at({ x: b.x, z: b.z, h: b.h, zi: NIGHT_Z })}>
        <span class="art" style:height="calc({b.h} * var(--u))" style:width="calc({wOf(b.key, b.h)} * var(--u))">
          <OfficialArt key={LIT_ART[b.key]} size="calc({b.h} * var(--u))" />
        </span>
      </div>
    {/if}
  {/each}
  {#each lamps as l (l.id)}
    <div class="spr lit" data-glow={l.id} style:opacity={lit} {@attach w.at({ x: l.x, z: l.z, h: l.h, zi: NIGHT_Z })}>
      <span class="glow" style:bottom="calc({l.h * GLOW_AT[l.key] - 22} * var(--u))"><OfficialArt key="deco/lamp-glow" size="calc(44 * var(--u))" /></span>
    </div>
  {/each}
{/if}

<style>
  .spr { width: 0; height: 0; transform-origin: 0 0; will-change: transform; pointer-events: none; }
  .art, .door {
    position: absolute; left: 0; bottom: 0; translate: -50% 0; display: flex; justify-content: center; align-items: flex-end;
    line-height: 0; pointer-events: none;
  }
  .art :global(.official), .door :global(.official) { max-width: none; }
  .art.bush { pointer-events: auto; cursor: pointer; }
  /* a tree's tap area: its leaves (not the art's whole box: the sand and grass round it stay the ground's) */
  .hit { position: absolute; pointer-events: auto; cursor: pointer; left: 18%; right: 18%; top: 4%; bottom: 46%; border-radius: 45%; }
  .hit.cedar { left: 26%; right: 26%; top: 6%; bottom: 30%; }
  .hit.palm { left: 14%; right: 14%; top: 0; bottom: 62%; }
  .art.flip :global(.official) { transform: scaleX(-1); }
  .lit { transition: opacity 1.2s ease; }
  .glow { position: absolute; left: 0; translate: -50% 0; line-height: 0; mix-blend-mode: screen; }
  .glow :global(.official) { max-width: none; }
  .door {
    appearance: none; border: 0; padding: 0; margin: 0; background: none; cursor: pointer; pointer-events: auto;
    -webkit-tap-highlight-color: transparent; border-radius: 10% 10% 4% 4%;
  }
  .door:disabled { cursor: default; pointer-events: none; }
  .door:active :global(.official) { transform: scale(.98, .985); transform-origin: 50% 100%; }
  .door:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  /* winter: snow settles on the bushes' tops */
  .art.snow::after {
    content: ''; position: absolute; left: 6%; right: 6%; top: -3%; height: 30%;
    background:
      radial-gradient(ellipse 24% 48% at 24% 66%, #FFF 92%, transparent 100%),
      radial-gradient(ellipse 30% 56% at 50% 50%, #FFF 92%, transparent 100%),
      radial-gradient(ellipse 24% 48% at 76% 66%, #FFF 92%, transparent 100%);
    filter: drop-shadow(0 1.5px 0 rgba(150, 175, 210, .5));
  }
</style>
