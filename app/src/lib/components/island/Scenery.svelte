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
  import { ARCH, BUILDINGS, DECOR_SLOTS, HEDGE_XS, HEDGE_Z, SCENERY, type BuildingId, type Scenery } from './world.ts';
  import { FIRE_AT, GLOW_AT, LIT_ART, hedgePair, sceneryKey, type Tod } from './scene.ts';
  import { LAMP_GLOW, piecesOn, swapsOn } from './fixedDecor.ts';
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
    /** At dusk and night the campsite's lantern and the lamps light up. */
    tod?: Tod;
    /** The Tokyo date and hour: the decor's seasonal pieces (fixedDecor.ts). */
    date?: string;
    hour?: number;
    /** The 3D island draws it (world3d/): its lights and shadows are the canvas's; the nodes are the tap areas. */
    r3?: boolean;
  }
  let { season, foliage, month, live = true, onbuilding, tod = 'day', date, hour = 12, r3 = false }: Props = $props();
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
  /** A piece whose shadow isn't baked into the ground (it comes and goes): its own soft shadow. */
  const BAKED = $derived((void site.rev, new Set(DECOR_SLOTS.filter((d) => d.key).map((d) => d.key))));
  const fixtures = $derived(pieces.map((p): Scenery & { fixture: string; shade: boolean } => ({ id: site.on ? p.id : `fx-${p.id}`, kind: 'prop', key: p.key, x: p.x, z: p.z, h: p.h, fixture: p.id, shade: !BAKED.has(p.key) })));
  const scenery = $derived((void site.rev, SCENERY).map((s) => (swaps[s.id] ? { ...s, key: swaps[s.id].key, h: swaps[s.id].h } : s)));
  const glowOf = (key: string) => GLOW_AT[key] ?? LAMP_GLOW[key] ?? (key === 'deco/illumi-tree' ? 0.5 : 0);
  // The shishi-odoshi (docs/design.md "Decor"): every 15–25 s while it's in view, and on a tap (SceneTaps), its tube
  // tips (NH's own model posed: deco/shishiodoshi-tip), spills and knocks back on the stone: "kon". Local and cosmetic.
  let tipped = $state(false);
  let shishiEl = $state<HTMLElement>();
  const TIP_MS = 700;
  function tip() {
    if (tipped) return;
    tipped = true;
    pose3d(site.on ? 'shishi' : 'fx-shishi', 'deco/shishiodoshi-tip');
    setTimeout(() => {
      tipped = false;
      pose3d(site.on ? 'shishi' : 'fx-shishi', null);
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
  /** Lights: the windows and lamps, each in its lamp's (or building's) depth just in front of it, never tinted (camera.svelte.ts
   *  `light`): a tree in front of a lamp covers its glow. Their pools on the ground lie under every upright thing. */
  const lit = $derived(tod === 'night' ? 1 : tod === 'dusk' ? 0.7 : 0);
  /** A light's pool on the ground: over the ground's tint plane, under every upright thing. */
  const POOL_Z = 4;
  const lamps = $derived([...scenery, ...fixtures].filter((s) => glowOf(s.key)));
  const fires = $derived((void site.rev, SCENERY).filter((s) => FIRE_AT[s.key]));
  const buildings = $derived((void site.rev, BUILDINGS));
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
  {#if f.shade && !r3}
    <div class="spr shade-node" {@attach w.at({ mode: 'flat', x: f.x + 2, z: f.z - 1, h: 4, zi: POOL_Z })}>
      <span class="shade" style:width="calc({wOf(f.key, f.h) * 0.95} * var(--u))"></span>
    </div>
  {/if}
{/each}

{#each buildings as b (b.id)}
  <div class="spr building" data-building={b.id} {@attach w.at({ x: b.x, z: b.z, h: b.h, model: true })}>
    <button type="button" class="door" disabled={!live} data-sfx="self" data-scenery aria-label={t(`world.building.${b.id}`)}
      style={at3d(b.key, b.h)} style:height="calc({b.h} * var(--u))" style:width="calc({b.w ?? wOf(b.key, b.h)} * var(--u))"
      onclick={(e) => onbuilding?.(b.id, e.currentTarget)}>
      <OfficialArt key={sceneryKey(b.key, season, month)} size="calc({b.h} * var(--u))" eager />
    </button>
  </div>
{/each}

{#if lit && !r3}
  {#each buildings as b (b.id)}
    {#if LIT_ART[b.key]}
      <div class="spr lit" data-lit={b.id} style:opacity={lit} {@attach w.at({ x: b.x, z: b.z, h: b.h, dz: -0.5, light: true })}>
        <span class="art" style={at3d(b.key, b.h)} style:height="calc({b.h} * var(--u))" style:width="calc({wOf(b.key, b.h)} * var(--u))">
          <OfficialArt key={LIT_ART[b.key]} size="calc({b.h} * var(--u))" />
        </span>
      </div>
    {/if}
  {/each}
  {#each lamps as l (l.id)}
    {@const k = Math.max(l.h, 24) / 46}
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
      <span class="halo" style:bottom="calc({l.h * glowOf(l.key) - 75 * k} * var(--u))" style:width="calc({150 * k} * var(--u))"></span>
      <span class="glow" style:bottom="calc({l.h * glowOf(l.key) - 30 * k} * var(--u))"><OfficialArt key="deco/lamp-glow" size="calc({60 * k} * var(--u))" /></span>
      <span class="core" style:bottom="calc({l.h * glowOf(l.key) - 11 * k} * var(--u))" style:width="calc({22 * k} * var(--u))"></span>
    </div>
    <div class="spr lit pool-node" data-pool={l.id} style:opacity={lit} {@attach w.at({ mode: 'flat', x: l.x + 2, z: l.z - 2, h: 4, zi: POOL_Z, light: true })}>
      <span class="pool" style:width="calc({140 * k} * var(--u))"></span>
    </div>
  {/each}
{/if}
{#if lit}
  {#each fires as f (f.id)}
    {@const k = f.h / 40}
    <!-- the campfire's flames (its render's emissive look) flickering, a warm halo round them and their light on the
         clearing; untinted, in the fire's depth, faded in at dusk -->
    <div class="spr lit" data-lit={f.id} style:opacity={lit} {@attach w.at({ x: f.x, z: f.z, h: f.h, dz: -0.4, light: true, m3: r3 ? { key: '', emit: { kind: 'flame', every: 120, lift: f.h * FIRE_AT[f.key] * 0.5, size: 0.9 } } : null })}>
      <span class="halo fire-halo" style:bottom="calc({f.h * FIRE_AT[f.key] - 60 * k} * var(--u))" style:width="calc({150 * k} * var(--u))"></span>
      <span class="art embers" style={at3d(`${f.key}-lit`, f.h, f.flip)} style:height="calc({f.h} * var(--u))" style:width="calc({wOf(`${f.key}-lit`, f.h)} * var(--u))">
        <OfficialArt key={`${f.key}-lit`} size="calc({f.h} * var(--u))" />
      </span>
      <!-- NH's flames over the logs: three tongues, each flickering out of step -->
      <span class="flames" data-m3art style:bottom="calc({f.h * FIRE_AT[f.key] - 8 * k} * var(--u))" style:--k={k}>
        <i class="tongue" style:--s="1" style:--x="0" style:--d="0s"></i>
        <i class="tongue" style:--s=".72" style:--x="-5" style:--d="-.4s"></i>
        <i class="tongue" style:--s=".66" style:--x="5" style:--d="-.9s"></i>
      </span>
    </div>
    <div class="spr lit pool-node" data-pool={f.id} style:opacity={lit} {@attach w.at({ mode: 'flat', x: f.x, z: f.z - 2, h: 4, zi: POOL_Z, light: true })}>
      <span class="pool fire-pool" style:width="calc({180 * k} * var(--u))"></span>
    </div>
  {/each}
  {#if !r3}
  {#each buildings as b (b.id)}
    {#if LIT_ART[b.key]}
      <!-- the light from the tent's lantern on the clearing in front of it -->
      <div class="spr lit pool-node" data-pool={b.id} style:opacity={lit} {@attach w.at({ mode: 'flat', x: b.x - 40, z: b.z - 10, h: 4, zi: POOL_Z, light: true })}>
        <span class="pool" style:width="calc(130 * var(--u))"></span>
      </div>
    {/if}
  {/each}
  {/if}
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
  /* a piece's soft contact shadow when it isn't baked into the ground (a seasonal one) */
  .shade-node { will-change: auto; }
  .shade { position: absolute; left: 0; aspect-ratio: 3.2; translate: -50% -50%; border-radius: 50%; background: radial-gradient(closest-side, rgba(40, 60, 30, .3), rgba(40, 60, 30, .14) 60%, rgba(40, 60, 30, 0)); filter: var(--tod-filter,); }
  /* the fire: its embers glow (the render's emissive look, breathing) and three tongues of flame flicker over the
     logs, each out of step, out of step with the halo too */
  .embers { opacity: .8; animation: embers 2.9s ease-in-out infinite; }
  @keyframes embers { 0%, 100% { opacity: .8; } 45% { opacity: .62; } }
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
  .fire-halo { background: radial-gradient(closest-side, rgba(255, 176, 84, .7), rgba(255, 140, 56, .36) 34%, rgba(255, 120, 40, .12) 64%, rgba(255, 120, 40, 0)); animation: fire-halo 2.3s ease-in-out infinite; }
  @keyframes fire-halo { 0%, 100% { opacity: 1; } 40% { opacity: .78; } 70% { opacity: .92; } }
  .fire-pool { background: radial-gradient(closest-side, rgba(255, 180, 90, .7), rgba(255, 150, 64, .38) 40%, rgba(255, 140, 56, .1) 75%, rgba(255, 140, 56, 0)); }
  :global(.if-scene:is([data-paused], [data-covered])) :is(.embers, .tongue, .fire-halo) { animation-play-state: paused; }
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
    filter: var(--tod-filter,) drop-shadow(0 1.5px 0 rgba(150, 175, 210, .5));
  }
</style>
