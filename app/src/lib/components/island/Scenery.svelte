<script lang="ts">
  // The island's still scenery (docs/design.md "World"): the trees that aren't goal trees (oaks, cedars, palms, bamboo),
  // the bushes (the hedge of the month, the plumeria at the beach, the campsite's hollies), the props (lamps, lanterns,
  // rocks) and the campsite's tent, each an upright world node at its feet: NH's own models rendered
  // (scripts/models.ts) where NH has one, standing on their feet (or door) point (models.json). An oak is two nodes (its trunk and its canopy, the canopy's depth 14u nearer), so a
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
  import PLACES from './models.json';

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

  /** An icon oak's trunk and canopy cut from its one image (a rendered oak has its own -trunk / -canopy layers). */
  const TRUNK = 'polygon(29% 53%, 71% 53%, 72% 84%, 88% 89%, 88% 100%, 12% 100%, 12% 89%, 28% 84%)';
  const CANOPY = 'polygon(0 0, 100% 0, 100% 67%, 66% 67%, 66% 56%, 34% 56%, 34% 67%, 0 67%)';
  const BUSH_H = 40;
  const hedge = $derived.by((): Scenery[] => {
    const [a, b] = hedgePair(month);
    return HEDGE_XS.map((x, i) => ({ id: `hedge-${i}`, kind: 'bush', key: `bushes/${i % 2 ? b : a}`, x, z: HEDGE_Z, h: BUSH_H }));
  });
  /** The winter look: a derived one (sceneryKey) or a render's own (<key>-winter: NH's snowy model). */
  const wintry = (k: string) => (season === 'winter' && !k.endsWith('-winter') && art(`${k}-winter`) ? `${k}-winter` : k);
  const keyOf = (s: Scenery) => (s.kind === 'oak' ? treeArt(foliage) : wintry(sceneryKey(s.key, season, month)));
  /** Lights: the windows and lamps, each in its lamp's (or building's) depth just in front of it, never tinted (camera.svelte.ts
   *  `light`): a tree in front of a lamp covers its glow. Their pools on the ground lie under every upright thing. */
  const lit = $derived(tod === 'night' ? 1 : tod === 'dusk' ? 0.7 : 0);
  /** A light's pool on the ground: over the ground's tint plane, under every upright thing. */
  const POOL_Z = 4;
  const lamps = SCENERY.filter((s) => GLOW_AT[s.key]);
  const winter = $derived(season === 'winter');
  const wOf = (key: string, h: number) => {
    const a = art(key);
    return a ? (h * a.w) / a.h : h;
  };
  /** A render stands on its feet (or door) point (scripts/models.ts: models.json), not its box's bottom centre. */
  const P = PLACES as unknown as Record<string, { ax: number; ay: number; inset?: [number, number, number, number] }>;
  const at3d = (key: string, h: number, flip = false): string | null => {
    const p = P[key];
    if (!p) return null;
    const wd = wOf(key, h);
    return `left:calc(${-(flip ? 1 - p.ax : p.ax) * wd} * var(--u));bottom:calc(${-(1 - p.ay) * h} * var(--u));translate:none`;
  };
  /** A layer's box clipped to what it shows (the canopy's clear lower half stands in front of no one). */
  const inset3d = (key: string, flip = false): string | null => {
    const i = P[key]?.inset;
    return i ? `inset(${i[0]}% ${flip ? i[3] : i[1]}% ${i[2]}% ${flip ? i[1] : i[3]}%)` : null;
  };
  /** The oak's trunk and canopy as their own renders (else the one image cut by TRUNK / CANOPY). */
  const layered = (key: string) => !!art(`${key}-trunk`);
  /** A tree's trunk tap area round its foot, as shares of its height (wide, tall): the trunk and its base down to the
   *  ground, at least 44px wide on screen (--inv); the leaves have their own (.hit). Unclipped by the layer's box. */
  const TRUNK_HIT: Partial<Record<Scenery['kind'], readonly [number, number]>> = { oak: [0.32, 0.6], cedar: [0.24, 0.42], palm: [0.3, 0.72] };
  const trunkHit = (s: Scenery, part: string) => (live && (part === 'trunk' || (part === 'body' && s.kind !== 'oak')) ? TRUNK_HIT[s.kind] : undefined);
</script>

{#snippet sprite(s: Scenery, clip: string | null = null, part = 'body')}
  {@const base = keyOf(s)}
  {@const key = part !== 'body' && layered(base) ? `${base}-${part}` : base}
  {@const th = trunkHit(s, part)}
  <div class="spr" data-scenery-id={s.id} data-kind={s.kind} data-part={part} {@attach w.at({ x: s.x, z: s.z, h: s.h, dz: part === 'canopy' ? -14 : 0, inv: !!th })}>
    <span class="art" class:flip={s.flip} class:snow={winter && s.kind === 'bush' && !P[key]} class:bush={s.kind === 'bush'} data-bush={s.kind === 'bush' ? s.id : undefined}
      style={at3d(key, s.h, s.flip)} style:height="calc({s.h} * var(--u))" style:width="calc({wOf(key, s.h)} * var(--u))"
      style:clip-path={layered(base) ? inset3d(key, s.flip) : clip}>
      <OfficialArt {key} size="calc({s.h} * var(--u))" eager={s.z < 1080} />
      {#if live && (s.kind === 'cedar' || s.kind === 'palm' || part === 'canopy')}
        <!-- its leaves answer a tap (SceneTaps: a rustle; three quick taps shake it) -->
        <i class="hit {s.kind}" data-tree={s.id}></i>
      {/if}
    </span>
    {#if th}
      <!-- its trunk and base answer a tap too (the same tree) -->
      <i class="hit-trunk" data-tree={s.id} data-tree-part="trunk" style:width="max(calc({th[0] * s.h} * var(--u)), calc(45px * var(--inv, 1)))" style:height="calc({th[1] * s.h} * var(--u))"></i>
    {/if}
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
      style={at3d(b.key, b.h)} style:height="calc({b.h} * var(--u))" style:width="calc({wOf(b.key, b.h)} * var(--u))"
      onclick={(e) => onbuilding?.(b.id, e.currentTarget)}>
      <OfficialArt key={sceneryKey(b.key, season, month)} size="calc({b.h} * var(--u))" eager />
    </button>
  </div>
{/each}

{#if lit}
  {#each BUILDINGS as b (b.id)}
    {#if LIT_ART[b.key]}
      <div class="spr lit" data-lit={b.id} style:opacity={lit} {@attach w.at({ x: b.x, z: b.z, h: b.h, dz: -0.5, light: true })}>
        <span class="art" style={at3d(b.key, b.h)} style:height="calc({b.h} * var(--u))" style:width="calc({wOf(b.key, b.h)} * var(--u))">
          <OfficialArt key={LIT_ART[b.key]} size="calc({b.h} * var(--u))" />
        </span>
      </div>
    {/if}
  {/each}
  {#each lamps as l (l.id)}
    {@const k = l.h / 46}
    {#if art(`${l.key}-lit`)}
      <!-- the lamp's own head lit (its render's -lit look), under the glow -->
      <div class="spr lit" data-lit={l.id} style:opacity={lit} {@attach w.at({ x: l.x, z: l.z, h: l.h, dz: -0.4, light: true })}>
        <span class="art" style={at3d(`${l.key}-lit`, l.h, l.flip)} style:height="calc({l.h} * var(--u))" style:width="calc({wOf(`${l.key}-lit`, l.h)} * var(--u))">
          <OfficialArt key={`${l.key}-lit`} size="calc({l.h} * var(--u))" />
        </span>
      </div>
    {/if}
    <!-- a lamp at night (NH's warm point light): its head lit (a bright core in the lamp-glow), a wide soft halo round
         it, and a pool of light on the ground at its foot; untinted, in the lamp's depth, faded in at dusk -->
    <div class="spr lit" data-glow={l.id} style:opacity={lit} {@attach w.at({ x: l.x, z: l.z, h: l.h, dz: -0.5, light: true })}>
      <span class="halo" style:bottom="calc({l.h * GLOW_AT[l.key] - 75 * k} * var(--u))" style:width="calc({150 * k} * var(--u))"></span>
      <span class="glow" style:bottom="calc({l.h * GLOW_AT[l.key] - 30 * k} * var(--u))"><OfficialArt key="deco/lamp-glow" size="calc({60 * k} * var(--u))" /></span>
      <span class="core" style:bottom="calc({l.h * GLOW_AT[l.key] - 11 * k} * var(--u))" style:width="calc({22 * k} * var(--u))"></span>
    </div>
    <div class="spr lit pool-node" data-pool={l.id} style:opacity={lit} {@attach w.at({ mode: 'flat', x: l.x + 2, z: l.z - 2, h: 4, zi: POOL_Z, light: true })}>
      <span class="pool" style:width="calc({140 * k} * var(--u))"></span>
    </div>
  {/each}
  {#each BUILDINGS as b (b.id)}
    {#if LIT_ART[b.key]}
      <!-- the light from the tent's lantern on the clearing in front of it -->
      <div class="spr lit pool-node" data-pool={b.id} style:opacity={lit} {@attach w.at({ mode: 'flat', x: b.x - 40, z: b.z - 10, h: 4, zi: POOL_Z, light: true })}>
        <span class="pool" style:width="calc(130 * var(--u))"></span>
      </div>
    {/if}
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
  .hit { position: absolute; pointer-events: auto; cursor: pointer; left: 8%; right: 8%; top: 2%; bottom: 40%; border-radius: 42%; }
  .hit.cedar { left: 16%; right: 16%; top: 2%; bottom: 32%; }
  .hit.palm { left: 6%; right: 6%; top: 0; bottom: 58%; }
  /* the trunk and its base, down to a little below the foot */
  .hit-trunk { position: absolute; left: 0; bottom: calc(-4 * var(--u)); translate: -50% 0; pointer-events: auto; cursor: pointer; border-radius: 40% 40% 30% 30%; }
  .art.flip :global(.official) { transform: scaleX(-1); }
  .lit { transition: opacity 1.2s ease; }
  .glow { position: absolute; left: 0; translate: -50% 0; line-height: 0; mix-blend-mode: screen; }
  .glow :global(.official) { max-width: none; }
  /* the lamp's head: a warm white core; round it a soft wide halo; at its foot a pool of light on the ground (flat) */
  .core, .halo, .pool { position: absolute; left: 0; aspect-ratio: 1; border-radius: 50%; pointer-events: none; }
  /* (plain alpha: each node is its own layer, so a blend mode would only blend within it) */
  .core { translate: -50% 0; background: radial-gradient(closest-side, #FFFDF2 0 42%, #FFE596 62%, rgba(255, 196, 80, .6) 78%, rgba(255, 190, 70, 0)); }
  .halo { translate: -50% 0; background: radial-gradient(closest-side, rgba(255, 214, 110, .78), rgba(255, 186, 72, .42) 30%, rgba(255, 170, 60, .16) 60%, rgba(255, 170, 60, 0)); }
  .pool-node { will-change: auto; }
  .pool { translate: -50% -50%; background: radial-gradient(closest-side, rgba(255, 210, 110, .72), rgba(255, 186, 76, .4) 40%, rgba(255, 170, 64, .12) 75%, rgba(255, 170, 64, 0)); }
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
