<script lang="ts">
  // The Island scene (style guide v2 §5): sky, sea, a curved checkered island, two trees whose
  // four fruit rings ripen with pct, the jar filling with coins, and the two villagers by their trees.
  // Colours come from tokens.css (data-season / data-theme / data-tod on <html>).
  // Everything scales with the container width (viewBox 390×540, HTML overlays in cqw).
  import type { FruitKey, PersonId, WeekView } from '#lib/types.ts';
  import FruitRing from './FruitRing.svelte';
  import VillagerArt from '#lib/villagers/VillagerArt.svelte';
  import { resolveVillager, SHIRT, SHIRT_PATTERN, type EmoteKind, type Expression } from '#lib/villagers/species.ts';
  import { t, formatYen } from '#lib/i18n/index.ts';
  import { theme } from '#lib/client/theme.svelte.ts';

  interface Props {
    view: WeekView;
    onhighfive?: () => void;
    /** Override the villagers' expressions (default: happy, sleepy on a のんびりデー). */
    meExpression?: Expression;
    partnerExpression?: Expression;
    /** Show the expression's emote above a villager. */
    meEmote?: boolean | EmoteKind;
    partnerEmote?: boolean | EmoteKind;
  }
  let { view, onhighfive, meExpression, partnerExpression, meEmote = false, partnerEmote = false }: Props = $props();

  const FRUITS: FruitKey[] = ['peach', 'coconut', 'apple', 'pear'];
  const me = $derived(view.people[view.me]);
  const partner = $derived(view.people[view.partner]);
  const night = $derived(theme.night);
  const season = $derived(theme.season);
  const warm = $derived(!night && (theme.tod === 'dawn' || theme.tod === 'dusk'));

  const look = (p: { person: PersonId; villagerSpecies: string | null; villagerColor: string | null }) =>
    resolveVillager(p.villagerSpecies, p.villagerColor, p.person);
  const meV = $derived(look(me));
  const partnerV = $derived(look(partner));

  // Tap partner = high-five: both cheer, partner pops a ♥.
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
  const restExpr = (p: { isCozyToday: boolean }): Expression => (p.isCozyToday ? 'sleepy' : 'happy');
  const meExpr = $derived<Expression>(fiving ? 'cheer' : (meExpression ?? restExpr(me)));
  const partnerExpr = $derived<Expression>(fiving ? 'cheer' : (partnerExpression ?? restExpr(partner)));

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
  const STARS = [[30, 60], [92, 34], [150, 82], [212, 40], [262, 112], [372, 50], [20, 170], [180, 150]];
  const FLOWERS: [number, number, string][] = [
    [40, 418, '#fff'], [152, 470, '#F28BA8'], [236, 476, '#FFD66B'], [352, 416, '#F28BA8'], [214, 360, '#fff'], [126, 368, '#FFD66B']
  ];
  const TUFTS = [[80, 470], [304, 472], [178, 448], [258, 366]];
  // Particles (spring petals, autumn leaves, winter snow); left %, delay s, duration s.
  const PETALS = Array.from({ length: 8 }, (_, i) => ({ x: 20 + i * 47, d: -i * 1.7, s: 9 + (i % 3) * 2 }));
  const LEAVES = Array.from({ length: 4 }, (_, i) => ({ x: 70 + i * 82, d: -i * 2.3, s: 8 + (i % 2) * 2 }));
  const SNOW = Array.from({ length: 12 }, (_, i) => ({ x: 14 + i * 32, d: -i * 1.1, s: 7 + (i % 4) * 1.5, r: 1.8 + (i % 3) * 0.7 }));
  const FIREFLIES = [[60, 380], [150, 340], [240, 350], [330, 392], [200, 300]];

  // Villager placement: feet on the grass at the tree foot, 64u tall.
  const VH = 64;
  const k = VH / 116;
  const place = (cx: number, foot: number) => `translate(${cx - 50 * k} ${foot - 116 * k}) scale(${k})`;
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

    {#each season === 'winter' ? [] : FLOWERS as [x, y, c], i (i)}
      <g transform="translate({x} {y})">
        {#each [0, 72, 144, 216, 288] as a (a)}
          <circle cx={Math.cos((a * Math.PI) / 180) * 3} cy={Math.sin((a * Math.PI) / 180) * 3 * 0.7} r="2.4" fill={c} />
        {/each}
        <circle r="1.6" fill="#F5A623" />
      </g>
    {/each}
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

    <!-- villagers -->
    <ellipse cx="62" cy="446" rx="18" ry="4" class="shadow" />
    <ellipse cx="328" cy="446" rx="18" ry="4" class="shadow" />
    <g transform={place(62, 446)}>
      <VillagerArt species={meV.species} colourway={meV.colourway} expression={meExpr}
        shirt={SHIRT[me.person]} pattern={SHIRT_PATTERN[me.person]} lw={3}
        emote={fiving ? true : meEmote} replay={fiveAt} />
    </g>
    <g transform={place(328, 446)}>
      <VillagerArt species={partnerV.species} colourway={partnerV.colourway} expression={partnerExpr}
        shirt={SHIRT[partner.person]} pattern={SHIRT_PATTERN[partner.person]} lw={3}
        emote={fiving ? 'heart' : partnerEmote} replay={fiveAt} />
    </g>

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

  <button type="button" class="hf" aria-label={t('island.highfive', { name: partner.villagerName })} onclick={highFive}></button>
  <button type="button" class="jartap" aria-label={t('island.jar', { yen: formatYen(view.jar.totalYen) })} onclick={() => (jarWiggle += 1)}></button>

  <div class="treefr mine">
    {#each FRUITS as f (f)}<FruitRing fruit={f} view={me.fruits[f]} size="11.8cqw" onTree />{/each}
  </div>
  <div class="treefr theirs">
    {#each FRUITS as f (f)}<FruitRing fruit={f} view={partner.fruits[f]} size="11.8cqw" onTree />{/each}
  </div>

  <div class="score left" aria-label={t('island.score', { name: me.villagerName, score: me.score })}>
    <span class="big">{me.score}<small>/100</small></span>
  </div>
  <div class="score right" aria-label={t('island.score', { name: partner.villagerName, score: partner.score })}>
    <span class="big">{partner.score}<small>/100</small></span>
  </div>
  <div class="jarsign money" aria-hidden="true">{formatYen(view.jar.totalYen)}</div>
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

  .hf {
    position: absolute; z-index: 3; left: 74.4cqw; top: 93cqw; width: 19cqw; height: 22cqw;
    appearance: none; background: transparent; border: 0; border-radius: 40%; cursor: pointer;
  }
  .jartap {
    position: absolute; z-index: 3; left: 42.5cqw; top: 94.5cqw; width: 15cqw; height: 18cqw;
    appearance: none; background: transparent; border: 0; border-radius: 30%; cursor: pointer;
  }
  .hf:focus-visible, .jartap:focus-visible { outline: 3px solid var(--focus); }

  .score { position: absolute; z-index: 5; top: 115.9cqw; width: 38.5cqw; text-align: center; color: var(--ink); }
  .night .score { color: var(--night-ink); }
  .score.left { left: 2.05cqw; }
  .score.right { right: 2.05cqw; }
  .score .big { font-family: var(--font-num); font-size: min(2.6rem, 10.7cqw); font-weight: 700; text-shadow: 0 2px 0 rgba(255, 255, 255, .5); }
  .night .score .big { text-shadow: 0 2px 0 rgba(0, 0, 0, .3); }
  .score small { font-size: min(1rem, 4.1cqw); color: var(--ink-faint); font-weight: 600; }
  .night .score small { color: var(--night-ink-soft); }

  .jarsign {
    position: absolute; z-index: 5; top: 114.9cqw; left: 50%; transform: translateX(-50%);
    background: var(--paper); color: var(--ink); border: 2px solid var(--bark); border-radius: var(--r-sm);
    padding: 4px 10px; font-size: min(1.05rem, 4.3cqw); box-shadow: 0 3px 0 var(--sand-deep); white-space: nowrap;
  }
</style>
