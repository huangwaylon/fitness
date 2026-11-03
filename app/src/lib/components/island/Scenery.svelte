<script lang="ts">
  // The island's still scenery (docs/design.md "World"): the trees that aren't goal trees (oaks, cedars, palms, bamboo),
  // the bushes (the hedge of the month, the plumeria at the beach, the campsite's hollies), the props (lamps, lanterns,
  // rocks) and the campsite's tent, each an upright world node at its feet: the tap area over the 3D island's model
  // (world3d/), its art there only where the 3D island has no model for its key (m3off), standing on its feet (or door)
  // point (models.json). An oak is two nodes (its trunk and its canopy, the canopy's depth 14u nearer). The lights,
  // shadows and pools are the canvas's; the campfire's flames are the DOM's. A bush answers a tap (SceneTaps finds it
  // by data-bush), and so does a tree's leaves (data-tree: a rustle, three quick taps shake it); a building is a door
  // (`onbuilding`).
  import OfficialArt from '../characters/OfficialArt.svelte';
  import { art, treeArt } from '#lib/art.ts';
  import type { Season } from '#lib/ui-state/theme.svelte.ts';
  import type { Foliage } from '#lib/ui-state/season.ts';
  import { t } from '#lib/i18n/index.ts';
  import { ARCH, BUILDINGS, HEDGE_XS, HEDGE_Z, SCENERY, type BuildingId, type Scenery } from './world.ts';
  import { FIRE_AT, hedgePair, sceneryKey, type Tod } from './scene.ts';
  import { piecesOn, swapsOn } from './fixedDecor.ts';
  import { islandSeed } from './devHooks.ts';
  import { sceneSfx, shownNow } from './sceneTaps.ts';
  import { useWorld } from './camera.svelte.ts';
  import PLACES from './models.json';
  import { pose3d } from './echo3d.ts';
  import { site } from './site.svelte.ts';

  interface Props {
    season: Season;
    foliage: Foliage;
    month: number;
    /** False in the gallery's thumbnails (nothing answers a tap). */
    live?: boolean;
    /** The campsite's door was tapped (the art's element, for a balloon's tail). */
    onbuilding?: (id: BuildingId, el: HTMLElement) => void;
    /** At dusk and night the campfire burns. */
    tod?: Tod;
    /** The Tokyo date and hour: the decor's seasonal pieces (fixedDecor.ts). */
    date?: string;
    hour?: number;
  }
  let { season, foliage, month, live = true, onbuilding, tod = 'day', date, hour = 12 }: Props = $props();
  const w = useWorld();

  /** An icon oak's trunk and canopy cut from its one image (a rendered oak has its own -trunk / -canopy layers). */
  const TRUNK = 'polygon(29% 53%, 71% 53%, 72% 84%, 88% 89%, 88% 100%, 12% 100%, 12% 89%, 28% 84%)';
  const CANOPY = 'polygon(0 0, 100% 0, 100% 67%, 66% 67%, 66% 56%, 34% 56%, 34% 67%, 0 67%)';
  const BUSH_H = 40;
  // (world.ts's values follow the island's layout: site.rev)
  const hedge = $derived.by((): Scenery[] => {
    void site.rev;
    const [a, b] = hedgePair(month);
    return HEDGE_XS.map((x, i) => ({ id: `hedge-${i}`, kind: 'bush', key: `bushes/${i % 2 ? b : a}`, x, z: HEDGE_Z, h: BUSH_H }));
  });
  /** The fixed decor today (fixedDecor.ts): the decor's spots' pieces, and the scenery that takes a seasonal look. */
  const swaps = $derived(date ? swapsOn(date) : {});
  const pieces = $derived((void site.rev, date ? piecesOn(date, hour, islandSeed(), ARCH) : []));
  const fixtures = $derived(pieces.map((p): Scenery & { fixture: string } => ({ id: p.id, kind: 'prop', key: p.key, x: p.x, z: p.z, h: p.h, fixture: p.id })));
  const scenery = $derived((void site.rev, SCENERY).map((s) => (swaps[s.id] ? { ...s, key: swaps[s.id].key, h: swaps[s.id].h } : s)));
  // The shishi-odoshi (docs/design.md "Decor"): every 15–25 s while it's in view, and on a tap (SceneTaps), its tube
  // tips (NH's own model posed: deco/shishiodoshi-tip), spills and knocks back on the stone: "kon". Local and cosmetic.
  let tipped = $state(false);
  let shishiEl = $state<HTMLElement>();
  const TIP_MS = 700;
  function tip() {
    if (tipped) return;
    tipped = true;
    pose3d('shishi', 'deco/shishiodoshi-tip');
    setTimeout(() => {
      tipped = false;
      pose3d('shishi', null);
      if (shishiEl && shownNow(shishiEl)) sceneSfx('kon');
    }, TIP_MS);
  }
  $effect(() => {
    if (!live) return;
    let timer = 0;
    const idle = () => {
      const scene = shishiEl?.closest('.if-scene');
      return !shishiEl || document.hidden || !!scene?.matches('[data-paused], [data-covered]') || !shownNow(shishiEl);
    };
    const next = () => (timer = window.setTimeout(() => (idle() || tip(), next()), 15_000 + Math.random() * 10_000));
    next();
    document.addEventListener('island:shishi', tip);
    return () => (clearTimeout(timer), document.removeEventListener('island:shishi', tip));
  });
  /** The winter look: a derived one (sceneryKey) or a render's own (<key>-winter: NH's snowy model). */
  const wintry = (k: string) => (season === 'winter' && !k.endsWith('-winter') && art(`${k}-winter`) ? `${k}-winter` : k);
  const keyOf = (s: Scenery) => (s.kind === 'oak' ? treeArt(foliage) : wintry(sceneryKey(s.key, season, month)));
  /** The campfire burns at dusk and night (its flames the DOM's, never tinted: camera.svelte.ts `light`; its light the
   *  canvas's). */
  const lit = $derived(tod === 'night' ? 1 : tod === 'dusk' ? 0.7 : 0);
  const fires = $derived((void site.rev, SCENERY).filter((s) => FIRE_AT[s.key]));
  const buildings = $derived((void site.rev, BUILDINGS));
  const winter = $derived(season === 'winter');
  /** A render stands on its feet (or door) point (scripts/models.ts: models.json), not its box's bottom centre. */
  const P = PLACES as unknown as Record<string, { ax: number; ay: number; mu?: [number, number]; inset?: [number, number, number, number] }>;
  /** A node's width: its art's, else its model's box (models.json mu: a piece only the 3D island draws has no 2D art). */
  const wOf = (key: string, h: number) => {
    const a = art(key), m = P[key]?.mu;
    return a ? (h * a.w) / a.h : m ? (h * m[0]) / m[1] : h;
  };
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
  <div class="spr" data-scenery-id={s.id} data-kind={s.kind} data-part={part} {@attach w.at({ x: s.x, z: s.z, h: s.h, dz: part === 'canopy' ? -14 : 0, inv: !!th, model: true })}>
    <span class="art" data-look={key} class:flip={s.flip} class:snow={winter && s.kind === 'bush' && !P[key]} class:bush={s.kind === 'bush'} class:fire={live && !!FIRE_AT[s.key]}
      data-bush={s.kind === 'bush' ? s.id : undefined} data-campfire={FIRE_AT[s.key] ? s.id : undefined}
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
      <i class="hit-trunk" data-tree={s.id} data-tree-part="trunk" style:width="max(calc({th[0] * s.h} * var(--u)), calc(45px * var(--inv, 1)))" style:height="max(calc({th[1] * s.h} * var(--u)), calc(48px * var(--inv-y, 0)))"></i>
    {/if}
  </div>
{/snippet}

{#each [...scenery, ...hedge] as s (s.id)}
  {#if s.kind === 'oak'}
    {@render sprite(s, TRUNK, 'trunk')}
    {@render sprite(s, CANOPY, 'canopy')}
  {:else}
    {@render sprite(s)}
  {/if}
{/each}

{#each fixtures as f (f.id + f.key)}
  <!-- the fixed decor (fixedDecor.ts): a tap answers where it stands (SceneTaps: data-fixture) -->
  <div class="spr" data-scenery-id={f.id} data-kind="decor" data-part="body" {@attach w.at({ x: f.x, z: f.z, h: f.h, model: true })}>
    {#if f.fixture === 'shishi'}
      <span class="art fixture shishi" class:tipped bind:this={shishiEl} data-fixture={live ? f.fixture : undefined} data-look={f.key} data-tipped={tipped || undefined}
        style={at3d(f.key, f.h)} style:height="calc({f.h} * var(--u))" style:width="calc({wOf(f.key, f.h)} * var(--u))">
        <span class="frame rest"><OfficialArt key={f.key} size="calc({f.h} * var(--u))" eager /></span>
        <span class="frame tip"><OfficialArt key={`${f.key}-tip`} size="calc({f.h} * var(--u))" eager /></span>
      </span>
    {:else}
      <span class="art fixture" data-fixture={live ? f.fixture : undefined} data-look={f.key}
        style={at3d(f.key, f.h)} style:height="calc({f.h} * var(--u))" style:width="calc({wOf(f.key, f.h)} * var(--u))">
        <OfficialArt key={f.key} size="calc({f.h} * var(--u))" eager={f.z < 1080} />
      </span>
    {/if}
  </div>
{/each}

{#each buildings as b (b.id)}
  <div class="spr building" data-building={b.id} {@attach w.at({ x: b.x, z: b.z, h: b.h, model: true })}>
    <button type="button" class="door" disabled={!live} data-sfx="self" data-scenery data-look={sceneryKey(b.key, season, month)} aria-label={t(`world.building.${b.id}`)}
      style={at3d(b.key, b.h)} style:height="calc({b.h} * var(--u))" style:width="calc({b.w ?? wOf(b.key, b.h)} * var(--u))"
      onclick={(e) => onbuilding?.(b.id, e.currentTarget)}>
      <OfficialArt key={sceneryKey(b.key, season, month)} size="calc({b.h} * var(--u))" eager />
    </button>
  </div>
{/each}

{#if lit}
  {#each fires as f (f.id)}
    {@const k = f.h / 40}
    <!-- the campfire's flames flickering (its glow, halo, pool and point light are the canvas's); untinted, in the fire's
         depth, faded in at dusk; the 3D island's flame cards rise from it (fx3d 'flame') -->
    <div class="spr lit" data-lit={f.id} style:opacity={lit} {@attach w.at({ x: f.x, z: f.z, h: f.h, dz: -0.4, light: true, m3: { key: '', emit: { kind: 'flame', every: 120, lift: f.h * FIRE_AT[f.key] * 0.5, size: 0.9 } } })}>
      <!-- NH's flames over the logs: three tongues, each flickering out of step -->
      <span class="flames" data-m3art style:bottom="calc({f.h * FIRE_AT[f.key] - 8 * k} * var(--u))" style:--k={k}>
        <i class="tongue" style:--s="1" style:--x="0" style:--d="0s"></i>
        <i class="tongue" style:--s=".72" style:--x="-5" style:--d="-.4s"></i>
        <i class="tongue" style:--s=".66" style:--x="5" style:--d="-.9s"></i>
      </span>
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
  .art.bush, .art.fire, .art.fixture[data-fixture] { pointer-events: auto; cursor: pointer; }
  /* the shishi-odoshi's two frames: at rest, and tipped while it spills */
  .shishi .frame { position: absolute; inset: 0; display: flex; justify-content: center; align-items: flex-end; line-height: 0; }
  .shishi .tip { opacity: 0; }
  .shishi.tipped .tip { opacity: 1; }
  .shishi.tipped .rest { opacity: 0; }
  /* the fire: three tongues of flame flicker over the logs, each out of step */
  .flames { position: absolute; left: 0; width: 0; height: 0; }
  .tongue {
    position: absolute; left: calc(var(--x) * var(--k) * var(--u)); bottom: 0;
    width: calc(14 * var(--s) * var(--k) * var(--u)); height: calc(14 * var(--s) * var(--k) * var(--u)); translate: -50% 0;
    border-radius: 50% 0 50% 50%; rotate: -45deg; transform-origin: 50% 50%;
    background: radial-gradient(circle at 62% 38%, #FFF6C4 0 16%, #FFD45C 36%, #FF9A2E 62%, #F2601C 88%);
    box-shadow: 0 0 calc(5 * var(--k) * var(--u)) rgba(255, 150, 60, .8);
    animation: tongue 1.1s ease-in-out var(--d) infinite;
  }
  @keyframes tongue { 0%, 100% { transform: scale(1, 1); opacity: .95; } 30% { transform: scale(.88, 1.1); opacity: 1; } 60% { transform: scale(1.06, .9); opacity: .85; } 80% { transform: scale(.94, 1.04); } }
  :global(.if-scene:is([data-paused], [data-covered])) .tongue { animation-play-state: paused; }
  /* a tree's tap area: its leaves (not the art's whole box: the sand and grass round it stay the ground's) */
  .hit { position: absolute; pointer-events: auto; cursor: pointer; left: 8%; right: 8%; top: 2%; bottom: 40%; border-radius: 42%; }
  .hit.cedar { left: 16%; right: 16%; top: 2%; bottom: 32%; }
  .hit.palm { left: 6%; right: 6%; top: 0; bottom: 58%; }
  /* the trunk and its base, down to a little below the foot */
  .hit-trunk { position: absolute; left: 0; bottom: calc(-4 * var(--u)); translate: -50% 0; pointer-events: auto; cursor: pointer; border-radius: 40% 40% 30% 30%; }
  .art.flip :global(.official) { transform: scaleX(-1); }
  .lit { transition: opacity 1.2s ease; }
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
    filter: var(--tod-filter,) drop-shadow(0 1.5px 0 rgba(150, 175, 210, .5));
  }
</style>
