<script lang="ts">
  // The Island scene (style guide v3 §5): sky, sea, a curved checkered island, two trees with the
  // official fruit ripening on them, the jar filling with coins, and the two villagers (official
  // renders) standing at the foot of their trees with their score pill.
  // Colours come from tokens.css (data-season / data-theme / data-tod on <html>); `season` / `night`
  // props override for the dev gallery. Everything scales with the container width: the SVG uses
  // viewBox 390×540 and the HTML overlays use cqw (1 unit = 1/3.9 cqw).
  import type { FruitKey, PersonId, PersonWeekView, WeekView } from '#lib/types.ts';
  import FruitRing from './FruitRing.svelte';
  import Villager from './Villager.svelte';
  import OfficialArt from './OfficialArt.svelte';
  import LeafCoin from './LeafCoin.svelte';
  import type { EmoteKind, Expression } from '#lib/villagers/species.ts';
  import { t, formatYen } from '#lib/i18n/index.ts';
  import { theme, type Season } from '#lib/client/theme.svelte.ts';

  interface Props {
    view: WeekView;
    /** Partner tapped: both cheer and the partner pops a ♥ (default when `onpartner` isn't set). */
    onhighfive?: () => void;
    /** Partner villager tapped (e.g. open the partner sheet). Replaces the built-in high-five. */
    onpartner?: () => void;
    /** My villager tapped (e.g. open 今夜のチェック). Without it, my villager just hops. */
    onme?: () => void;
    /** Jar tapped (e.g. go to 旅の壺). Without it, the jar wiggles. */
    onjar?: () => void;
    /** Override the villagers' expressions (default happy). */
    meExpression?: Expression;
    partnerExpression?: Expression;
    /** Show the expression's emote (or a specific one) above a villager. */
    meEmote?: boolean | EmoteKind;
    partnerEmote?: boolean | EmoteKind;
    /** Dev gallery: force a season / night instead of the theme clock. */
    season?: Season;
    night?: boolean;
  }
  let {
    view, onhighfive, onpartner, onme, onjar, meExpression, partnerExpression, meEmote = false, partnerEmote = false,
    season: seasonProp, night: nightProp
  }: Props = $props();

  const FRUITS: FruitKey[] = ['peach', 'coconut', 'apple', 'pear'];
  const me = $derived(view.people[view.me]);
  const partner = $derived(view.people[view.partner]);
  const night = $derived(nightProp ?? theme.night);
  const season = $derived(seasonProp ?? theme.season);
  const warm = $derived(!night && nightProp === undefined && (theme.tod === 'dawn' || theme.tod === 'dusk'));
  const TAG: Record<PersonId, string> = { A: 'var(--tag-apricot)', B: 'var(--tag-plum)' };

  // Tap partner (no onpartner) = high-five: both cheer, partner pops a ♥.
  let fiveAt = $state(0);
  let fiving = $state(false);
  let fiveTimer: ReturnType<typeof setTimeout> | null = null;
  function highFive() {
    fiveAt += 1;
    fiving = true;
    if (fiveTimer) clearTimeout(fiveTimer);
    fiveTimer = setTimeout(() => (fiving = false), 2200);
    onhighfive?.();
  }
  let meHop = $state(0);
  const meExpr = $derived<Expression>(fiving || meHop ? 'cheer' : (meExpression ?? 'happy'));
  const partnerExpr = $derived<Expression>(fiving ? 'cheer' : (partnerExpression ?? 'happy'));

  // Jar fill: share of the top rung (a little visible as soon as there is anything in it).
  const topYen = $derived(Math.max(1, ...view.jar.rungs.map((r) => r.yen), view.jar.nextRung?.yen ?? 0));
  const fill = $derived(view.jar.totalYen <= 0 ? 0 : Math.min(1, Math.max(0.12, Math.sqrt(view.jar.totalYen / topYen))));
  const coinTop = $derived(66 - fill * 44); // jar-local y of the coin surface (body spans y 18–66)
  let jarWiggle = $state(0);

  // Tree canopy: five overlapping circles (local coords, centred on the trunk at x 0).
  const CANOPY = [
    { x: -38, y: 18, r: 34 }, { x: 38, y: 18, r: 34 },
    { x: -22, y: -26, r: 38 }, { x: 22, y: -26, r: 38 }, { x: 0, y: 4, r: 46 }
  ];
  const BLOSSOM = [[-52, 6], [-30, -46], [8, -56], [44, -36], [56, 22], [-12, 40]];
  const TREES = [
    { x: 100, cy: 248, base: 382, delay: '0s' },
    { x: 290, cy: 248, base: 382, delay: '-2s' }
  ];
  const STARS = [[30, 60], [92, 34], [150, 82], [212, 40], [262, 112], [372, 50], [20, 170], [180, 150], [120, 210], [300, 190]];
  // Official flowers on the grass (viewBox x, foot y, art key); none in winter.
  const FLOWERS: [number, number, string][] = [
    [34, 420, 'flowers/white-cosmos'], [150, 486, 'flowers/red-tulips'], [244, 490, 'flowers/yellow-tulips'],
    [360, 420, 'flowers/red-roses'], [222, 372, 'flowers/white-cosmos'], [160, 374, 'flowers/yellow-tulips']
  ];
  const TUFTS = [[80, 476], [304, 478], [190, 458], [262, 372], [120, 400]];
  // Particles (spring petals, autumn leaves, winter snow); x, delay s, duration s.
  const PETALS = Array.from({ length: 8 }, (_, i) => ({ x: 20 + i * 47, d: -i * 1.7, s: 9 + (i % 3) * 2 }));
  const LEAVES = Array.from({ length: 4 }, (_, i) => ({ x: 70 + i * 82, d: -i * 2.3, s: 8 + (i % 2) * 2 }));
  const SNOW = Array.from({ length: 12 }, (_, i) => ({ x: 14 + i * 32, d: -i * 1.1, s: 7 + (i % 4) * 1.5, r: 1.8 + (i % 3) * 0.7 }));
  const FIREFLIES = [[60, 380], [150, 340], [240, 350], [330, 392], [200, 300]];

  /** viewBox units → cqw. */
  const cq = (u: number) => `${(u / 3.9).toFixed(2)}cqw`;
  const FOOT_Y = 446;
  const SPOTS: { side: 'mine' | 'theirs'; x: number }[] = [
    { side: 'mine', x: 64 },
    { side: 'theirs', x: 326 }
  ];
  const who = (side: 'mine' | 'theirs'): PersonWeekView => (side === 'mine' ? me : partner);

  function tapVillager(side: 'mine' | 'theirs') {
    if (side === 'theirs') return onpartner ? onpartner() : highFive();
    if (onme) return onme();
    meHop += 1;
    setTimeout(() => (meHop = Math.max(0, meHop - 1)), 900);
  }
  function tapJar() {
    if (onjar) onjar();
    else jarWiggle += 1;
  }
</script>

<div class="scene" class:night data-season-art={season}>
  <svg class="art" viewBox="0 0 390 540" aria-hidden="true">
    <defs>
      <linearGradient id="isl-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" class="sky-top" /><stop offset="1" class="sky-bottom" />
      </linearGradient>
      <pattern id="isl-check" width="28" height="28" patternUnits="userSpaceOnUse"
        patternTransform="translate(195 430) scale(1 .55) rotate(45)">
        <rect width="28" height="28" class="g1" />
        <rect width="14" height="14" class="g2" /><rect x="14" y="14" width="14" height="14" class="g2" />
      </pattern>
      <radialGradient id="isl-round" cx=".5" cy=".38" r=".62">
        <stop offset=".55" stop-color="#fff" stop-opacity="0" />
        <stop offset="1" stop-color="#1E3A1E" stop-opacity=".16" />
      </radialGradient>
      <radialGradient id="isl-shine" cx=".5" cy=".5" r=".5">
        <stop offset="0" stop-color="#fff" stop-opacity=".22" /><stop offset="1" stop-color="#fff" stop-opacity="0" />
      </radialGradient>
      <clipPath id="isl-jarbody">
        <path d="M13 18 Q4 24 4 36 V58 Q4 66 12 66 H42 Q50 66 50 58 V36 Q50 24 41 18 Z" />
      </clipPath>
    </defs>

    <!-- sky -->
    <rect width="390" height="340" fill="url(#isl-sky)" />
    {#if night}
      <g class="stars">
        {#each STARS as [x, y], i (i)}
          <path d="M{x} {y - 3.4} Q{x + .6} {y - .6} {x + 3.4} {y} Q{x + .6} {y + .6} {x} {y + 3.4} Q{x - .6} {y + .6} {x - 3.4} {y} Q{x - .6} {y - .6} {x} {y - 3.4} Z"
            style="animation-delay:{-i * 0.4}s" />
        {/each}
      </g>
      <circle cx="336" cy="96" r="34" class="moonhalo" />
      <path d="M332 72 a24 24 0 1 0 24 34 a19 19 0 1 1 -24 -34 z" class="moon" />
    {:else}
      <circle cx="336" cy="96" r="31" class="sunhalo" />
      <circle cx="336" cy="96" r="20" class="sun" />
      <g class="cloud">
        <path d="M30 128 Q30 112 48 114 Q54 98 74 104 Q90 96 98 112 Q114 112 112 128 Z" />
      </g>
      <g class="cloud c2">
        <path d="M200 70 Q200 60 212 61 Q218 51 232 56 Q244 52 248 62 Q258 63 256 72 Z" />
      </g>
    {/if}

    <!-- sea -->
    <rect y="300" width="390" height="240" class="sea" />
    <rect y="300" width="390" height="12" class="seadeep" />
    <g class="foam">
      <path d="M24 334 q8 -5 16 0 q8 5 16 0" />
      <path d="M318 328 q8 -5 16 0 q8 5 16 0" style="animation-delay:-1.4s" />
      <path d="M8 496 q8 -5 16 0 q8 5 16 0" style="animation-delay:-.7s" />
      <path d="M340 500 q8 -5 16 0 q8 5 16 0" style="animation-delay:-2.1s" />
    </g>

    <!-- island: beach ring, cliff band, curved checkered top -->
    <ellipse cx="195" cy="448" rx="198" ry="100" class="beach" />
    <ellipse cx="195" cy="442" rx="186" ry="92" class="cliff" />
    <ellipse cx="195" cy="430" rx="186" ry="92" fill="url(#isl-check)" />
    <ellipse cx="195" cy="430" rx="186" ry="92" fill="url(#isl-round)" />
    <ellipse cx="195" cy="430" rx="186" ry="92" class="rim" />

    {#each TUFTS as [x, y], i (i)}
      <path d="M{x - 6} {y} q2 -7 3 -1 q2 -9 4 0 q2 -7 4 1" class="tuft" />
    {/each}

    <!-- trees -->
    {#each TREES as tr (tr.x)}
      <ellipse cx={tr.x} cy={tr.base + 2} rx="34" ry="7" class="shadow" />
      <g class="sway" style="transform-origin:{tr.x}px {tr.base}px; animation-delay:{tr.delay}">
        <path d="M{tr.x - 14} {tr.base} Q{tr.x - 7} {tr.base - 5} {tr.x - 9} {tr.base - 30} L{tr.x - 10} {tr.cy + 30} H{tr.x + 10} L{tr.x + 9} {tr.base - 30} Q{tr.x + 7} {tr.base - 5} {tr.x + 13} {tr.base} Z" class="trunk" />
        <path d="M{tr.x - 2} {tr.base - 8} Q{tr.x - 3} {tr.base - 40} {tr.x - 1} {tr.cy + 44}" class="bark" />
        <g transform="translate({tr.x} {tr.cy}) scale(1.1)">
          <g class="ink">{#each CANOPY as c, i (i)}<circle cx={c.x} cy={c.y} r={c.r + 1.6} />{/each}</g>
          <g class="leaf2">{#each CANOPY as c, i (i)}<circle cx={c.x} cy={c.y} r={c.r - 1} />{/each}</g>
          <g class="leaf1">{#each CANOPY as c, i (i)}<circle cx={c.x} cy={c.y - 7} r={c.r - 5} />{/each}</g>
          <ellipse cx="-24" cy="-50" rx="16" ry="9" transform="rotate(-24 -24 -50)" class="hilite" />
          <ellipse cx="-50" cy="0" rx="9" ry="6" transform="rotate(-40 -50 0)" class="hilite" />
          {#if season === 'spring'}
            {#each BLOSSOM as [x, y], i (i)}
              <g transform="translate({x} {y})" class="blossom">
                {#each [0, 72, 144, 216, 288] as a (a)}<circle cx={Math.cos((a * Math.PI) / 180) * 3.4} cy={Math.sin((a * Math.PI) / 180) * 3.4} r="3" />{/each}
                <circle r="1.8" fill="#F5A623" />
              </g>
            {/each}
          {:else if season === 'winter'}
            <path d="M-56 -26 Q-58 -60 -22 -64 Q0 -84 22 -64 Q58 -60 56 -26 Q48 -38 36 -34 Q26 -48 12 -40 Q0 -54 -12 -40 Q-26 -48 -36 -34 Q-48 -38 -56 -26 Z" class="snowcap" />
          {/if}
        </g>
      </g>
    {/each}

    <!-- jar (centre 195, 405): glass, coins up to the fill line, yuzu lid -->
    <ellipse cx="195" cy="438" rx="28" ry="5" class="shadow" />
    {#key jarWiggle}
      <g class="jar" class:wiggle={jarWiggle > 0} transform="translate(168 372)">
        <path d="M13 18 Q4 24 4 36 V58 Q4 66 12 66 H42 Q50 66 50 58 V36 Q50 24 41 18 Z" class="glass" />
        <g clip-path="url(#isl-jarbody)">
          {#if fill > 0}
            <rect x="0" y={coinTop + 3} width="54" height="70" fill="#F7C548" />
            {#each Array.from({ length: Math.ceil((66 - coinTop) / 6) + 1 }) as _, row (row)}
              {#each [0, 1, 2, 3] as col (col)}
                <ellipse cx={8 + col * 13 + (row % 2) * 6} cy={coinTop + 3 + row * 6} rx="6.4" ry="2.8" class="coin" />
              {/each}
            {/each}
          {/if}
        </g>
        <path d="M13 18 Q4 24 4 36 V58 Q4 66 12 66 H42 Q50 66 50 58 V36 Q50 24 41 18 Z" class="glass-line" />
        <path d="M10 30 Q8.6 38 10 46" class="glint" />
        <rect x="11" y="9" width="32" height="11" rx="4" class="lid" />
        <path d="M14 12.5 H40" class="lidline" />
        <path d="M27 9 Q29 2 36 2.6 Q33 9 27 9 Z" fill="#7BC67E" stroke="#4A3A2C" stroke-width="1.6" stroke-linejoin="round" />
      </g>
    {/key}

    <!-- villager ground shadows (the villagers themselves are HTML overlays) -->
    {#each SPOTS as v (v.side)}<ellipse cx={v.x} cy={FOOT_Y} rx="20" ry="4.6" class="shadow" />{/each}

    <!-- seasonal particles -->
    <g class="particles">
      {#if season === 'spring'}
        {#each PETALS as p, i (i)}
          <ellipse cx={p.x} cy="-10" rx="3.4" ry="2.2" class="petal" style="animation-delay:{p.d}s; animation-duration:{p.s}s" />
        {/each}
      {:else if season === 'autumn'}
        {#each LEAVES as p, i (i)}
          <path d="M{p.x} 150 q5 -7 11 -3 q-4 8 -11 3 z" class="fall-leaf" style="animation-delay:{p.d}s; animation-duration:{p.s}s" />
        {/each}
      {:else if season === 'winter'}
        {#each SNOW as p, i (i)}
          <circle cx={p.x} cy="-8" r={p.r} class="flake" style="animation-delay:{p.d}s; animation-duration:{p.s}s" />
        {/each}
      {:else if night}
        {#each FIREFLIES as [x, y], i (i)}
          <circle cx={x} cy={y} r="2.2" class="firefly" style="animation-delay:{-i * 0.9}s" />
        {/each}
      {/if}
    </g>
    {#if warm}<rect width="390" height="540" class="dim" />{/if}
  </svg>

  {#if season !== 'winter'}
    {#each FLOWERS as [x, y, key], i (i)}
      <span class="flower" style:left={cq(x)} style:top={cq(y)}><OfficialArt {key} size="6.4cqw" /></span>
    {/each}
  {/if}

  <button type="button" class="jartap" aria-label={t('island.jar', { yen: formatYen(view.jar.totalYen) })} onclick={tapJar}></button>

  {#each SPOTS as v (v.side)}
    {@const p = who(v.side)}
    {@const mine = v.side === 'mine'}
    <div class="treefr {v.side}">
      {#each FRUITS as f (f)}<FruitRing fruit={f} view={p.fruits[f]} size="11.8cqw" onTree eager />{/each}
    </div>
    <button
      type="button"
      class="vil {v.side}"
      style:left={cq(v.x)}
      style:top={cq(FOOT_Y)}
      aria-label={mine
        ? t('island.score', { name: p.villagerName, score: p.score })
        : t('island.highfive', { name: p.villagerName })}
      onclick={() => tapVillager(v.side)}
    >
      <Villager
        person={p.person}
        villager={p.villager}
        size="23cqw"
        eager
        expression={mine ? meExpr : partnerExpr}
        emote={mine ? (fiving ? true : meHop ? true : meEmote) : fiving ? 'heart' : partnerEmote}
        replay={mine ? fiveAt + meHop : fiveAt}
      />
    </button>
    <div class="pill {v.side}" style:left={cq(v.x)} style:--tag={TAG[p.person]}
      aria-label={t('island.score', { name: p.villagerName, score: p.score })}>
      <span class="tag">{p.villagerName}</span>
      <b class="money">{p.score}</b>
    </div>
  {/each}

  <div class="jarsign" aria-hidden="true">
    <LeafCoin size="5.4cqw" eager /><span class="money">{formatYen(view.jar.totalYen)}</span>
  </div>
</div>

<style>
  .scene { position: relative; width: 100%; aspect-ratio: 390 / 540; container-type: inline-size; overflow: hidden; }
  .art { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }

  .sky-top { stop-color: var(--sky-top); }
  .sky-bottom { stop-color: var(--sky-bottom); }
  .sun { fill: var(--sun-disc); }
  .sunhalo { fill: var(--sun-disc); opacity: .35; }
  .moon { fill: var(--moon); }
  .moonhalo { fill: var(--moon); opacity: .12; }
  .stars path { fill: #FFF6D6; animation: twinkle 3s var(--ease-idle) infinite; }
  .cloud { fill: #fff; opacity: .92; animation: cloud 60s linear infinite; }
  .cloud.c2 { opacity: .8; animation-duration: 80s; animation-delay: -30s; }
  .sea { fill: var(--sea); }
  .seadeep { fill: var(--sea-deep); }
  .foam path { fill: none; stroke: var(--foam); stroke-width: 3; stroke-linecap: round; opacity: .85; animation: foam 3s var(--ease-idle) infinite; }
  .beach { fill: var(--beach); stroke: var(--beach-edge); stroke-width: 3; }
  .cliff { fill: var(--grass-edge); }
  .rim { fill: none; stroke: rgba(255, 255, 255, .28); stroke-width: 3; }
  .g1 { fill: var(--grass); }
  .g2 { fill: var(--grass-2); }
  .tuft { fill: none; stroke: var(--grass-edge); stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }
  .shadow { fill: var(--sh-ground); }

  .trunk { fill: var(--trunk); stroke: #4A3A2C; stroke-width: 2.6; stroke-linejoin: round; }
  .bark { fill: none; stroke: #4A3A2C; stroke-width: 1.6; stroke-linecap: round; opacity: .25; }
  .ink { fill: #4A3A2C; }
  .leaf2 { fill: var(--tree-leaf-2); }
  .leaf1 { fill: var(--tree-leaf); }
  .hilite { fill: #fff; opacity: .18; }
  .blossom circle:not(:last-child) { fill: var(--season-accent); stroke: #E79AB0; stroke-width: .6; }
  .snowcap { fill: #fff; stroke: #C9D8E8; stroke-width: 1.6; stroke-linejoin: round; }
  .night .snowcap { fill: #E6ECF5; }
  .sway { transform-box: view-box; animation: sway 5s var(--ease-idle) infinite; }

  .glass { fill: #DDF2FB; fill-opacity: .75; }
  .night .glass { fill: #9FB4D6; fill-opacity: .45; }
  .glass-line { fill: none; stroke: #4A3A2C; stroke-width: 2.6; stroke-linejoin: round; }
  .coin { fill: #F7C548; stroke: #D9962A; stroke-width: 1.2; }
  .glint { fill: none; stroke: #fff; stroke-width: 3; stroke-linecap: round; opacity: .85; }
  .lid { fill: var(--c-yuzu); stroke: #4A3A2C; stroke-width: 2.4; }
  .lidline { stroke: var(--c-yuzu-lip); stroke-width: 1.6; stroke-linecap: round; }
  .jar { transform-box: fill-box; transform-origin: 50% 100%; }
  .jar.wiggle { animation: if-wiggle 420ms var(--ease-soft) 1; }

  .petal { fill: var(--season-accent); animation: fall 10s linear infinite; }
  .fall-leaf { fill: var(--season-accent); stroke: #8A4A2A; stroke-width: .8; animation: fall-leaf 9s linear infinite; }
  .flake { fill: #fff; opacity: .9; animation: fall 8s linear infinite; }
  .firefly { fill: var(--firefly); animation: glow 2.6s var(--ease-idle) infinite; }
  .dim { fill: #7A4A6A; mix-blend-mode: multiply; opacity: var(--scene-dim); pointer-events: none; }

  @keyframes sway { 0%, 100% { transform: rotate(-1.2deg); } 50% { transform: rotate(1.2deg); } }
  @keyframes cloud { from { transform: translateX(-130px); } to { transform: translateX(420px); } }
  @keyframes foam { 0%, 100% { transform: translateX(-4px); } 50% { transform: translateX(4px); } }
  @keyframes twinkle { 0%, 100% { opacity: 1; } 50% { opacity: .3; } }
  @keyframes glow { 0%, 100% { opacity: .2; transform: translateY(0); } 50% { opacity: 1; transform: translateY(-6px); } }
  @keyframes fall {
    from { transform: translate(0, 0) rotate(0); }
    50% { transform: translate(-14px, 280px) rotate(160deg); }
    to { transform: translate(6px, 560px) rotate(320deg); }
  }
  @keyframes fall-leaf {
    from { transform: translate(0, 0) rotate(0); opacity: 0; }
    10% { opacity: 1; }
    50% { transform: translate(-22px, 140px) rotate(140deg); }
    to { transform: translate(10px, 300px) rotate(300deg); opacity: 0; }
  }
  .petal, .flake, .fall-leaf, .firefly { transform-box: fill-box; transform-origin: center; }

  @media (prefers-reduced-motion: reduce) {
    .sway, .cloud, .foam path, .stars path, .jar.wiggle { animation: none; }
    .particles { display: none; }
  }

  .treefr {
    position: absolute; z-index: 4; top: 50.8cqw; display: grid; grid-template-columns: repeat(2, 11.8cqw);
    gap: 1.6cqw 2.6cqw; justify-items: center;
  }
  .treefr.mine { left: 12.3cqw; }
  .treefr.theirs { left: 61cqw; }

  .jartap {
    position: absolute; z-index: 3; left: 42.5cqw; top: 94.5cqw; width: 15cqw; height: 18cqw;
    appearance: none; background: transparent; border: 0; border-radius: 30%; cursor: pointer;
  }
  .jartap:focus-visible, .vil:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }

  /* Official flowers stand on the grass (anchor = stem foot). */
  .flower { position: absolute; z-index: 1; transform: translate(-50%, -88%); pointer-events: none; }

  /* Villagers: feet on the grass at (left, top); the whole figure + 8px is the tap target. */
  .vil {
    position: absolute; z-index: 5; transform: translate(-50%, calc(-100% + 2px));
    appearance: none; background: none; border: 0; padding: 8px 8px 0; margin: 0; cursor: pointer;
    border-radius: 40% 40% 20% 20%; -webkit-tap-highlight-color: transparent; min-width: 64px;
    display: flex; justify-content: center;
  }
  .vil:active :global(.villager) { transform: scale(1.06, .92); transition: transform var(--dur-tap) var(--ease-squash); }
  .vil.theirs { --bob-delay: -1.2s; }
  .night :global(.official) { filter: brightness(.9); }

  /* Score pill under each villager: name tag + score. */
  .pill {
    position: absolute; z-index: 6; top: 115.6cqw; transform: translateX(-50%);
    display: inline-flex; align-items: center; gap: 1.4cqw; white-space: nowrap;
    padding: .9cqw 2.6cqw .9cqw .9cqw; border-radius: 999px;
    background: var(--bubble); color: var(--c-ink); border: 2px solid var(--c-ink);
    box-shadow: 0 3px 0 var(--lip);
  }
  .pill .tag {
    background: var(--tag); border-radius: 999px; padding: .8cqw 2.2cqw;
    font-size: min(.8125rem, 3.3cqw); font-weight: 700; line-height: 1;
  }
  .pill b { font-family: var(--font-num); font-weight: 700; font-size: min(1.5rem, 6.2cqw); line-height: 1; }

  .jarsign {
    position: absolute; z-index: 5; top: 114.9cqw; left: 50%; transform: translateX(-50%);
    display: inline-flex; align-items: center; gap: 1cqw;
    background: var(--paper); color: var(--ink); border: 2px solid var(--bark); border-radius: var(--r-sm);
    padding: .6cqw 2.4cqw .6cqw 1.4cqw; font-size: min(1.05rem, 4.3cqw); font-weight: 600;
    box-shadow: 0 3px 0 var(--sand-deep); white-space: nowrap;
  }
</style>
