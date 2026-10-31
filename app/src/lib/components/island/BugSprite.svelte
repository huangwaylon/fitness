<script lang="ts">
  // A bug as the island draws it (docs/design.md "Scene interactions"): our own little NH-style sprites (the official
  // icon is the catch). Critters.svelte moves it (the mover, the hop, the flutter) and loads this with the first bug of
  // a session, so the sprites and their styles stay out of the island's first load. Decorative (Critters' layer is
  // aria-hidden).
  import type { BugId, Flight, StalkState } from './critters.ts';

  interface Props {
    id: BugId;
    flight: Flight;
    /** A percher has landed on its trunk (a cicada's wings buzz while it sings). */
    sat?: boolean;
    /** A tarantula's or a scorpion's mood: reared up, it lifts its front. */
    stalk?: StalkState;
  }
  let { id, flight, sat = false, stalk }: Props = $props();

  /** How a percher is drawn: a cicada (or its shell), a stag beetle with its jaws, a horned or round beetle, a
   *  long-horned beetle with its feelers, a stick. */
  const PERCH: Partial<Record<BugId, 'stag' | 'beetle' | 'longhorn' | 'stick'>> = {
    'saw-stag': 'stag', 'miyama-stag': 'stag', 'giant-stag': 'stag', 'rainbow-stag': 'stag',
    'horned-dynastid': 'beetle', 'goliath-beetle': 'beetle', 'drone-beetle': 'beetle', 'jewel-beetle': 'beetle', 'walking-stick': 'stick',
    'violin-beetle': 'beetle', 'scarab-beetle': 'beetle', 'citrus-long-horned-beetle': 'longhorn', 'rosalia-batesi-beetle': 'longhorn'
  };
</script>

<span class="sprite {flight} {id}" class:sat>
  {#if flight === 'drift'}
    <i class="glow"></i>
  {:else if flight === 'dart'}
    <svg viewBox="-12 -8 24 16"><g class="dwing"><ellipse cx="-3" cy="-4" rx="2.2" ry="5.5" transform="rotate(-62 -3 -4)" /><ellipse cx="-3" cy="4" rx="2.2" ry="5.5" transform="rotate(62 -3 4)" />
      <ellipse cx="1" cy="-4" rx="1.9" ry="5" transform="rotate(-70 1 -4)" /><ellipse cx="1" cy="4" rx="1.9" ry="5" transform="rotate(70 1 4)" /></g>
      <path class="dbody" d="M-11 0 L4 0" /><path class="dband" d="M-11 0 L4 0" /><circle class="dhead" cx="5.5" cy="0" r="2" /></svg>
  {:else if flight === 'perch' && PERCH[id] === 'stag'}
    <!-- a stag beetle on the trunk, head up, its jaws open -->
    <svg viewBox="-6 -9 12 17"><path class="jaw" d="M-1.2 -5.4 C-3.6 -7 -3.4 -8.6 -2 -9 M1.2 -5.4 C3.6 -7 3.4 -8.6 2 -9" />
      <ellipse class="shellb" cx="0" cy="1.2" rx="3.4" ry="4.8" /><path class="seam" d="M0 -2.6 V5.8" /><ellipse class="bhead" cx="0" cy="-4.4" rx="2.3" ry="1.6" /></svg>
  {:else if flight === 'perch' && PERCH[id] === 'beetle'}
    <!-- a beetle on the trunk (the horned dynastid with its horn) -->
    <svg viewBox="-6 -9 12 17">{#if id === 'horned-dynastid'}<path class="horn" d="M0 -5 C-.2 -7.4 .8 -8.8 2.2 -8.8" />{/if}
      <ellipse class="shellb" cx="0" cy="1.2" rx="3.7" ry="4.8" /><path class="seam" d="M0 -2.4 V5.8" /><ellipse class="bhead" cx="0" cy="-4.2" rx="2.4" ry="1.7" /></svg>
  {:else if flight === 'perch' && PERCH[id] === 'longhorn'}
    <!-- a long-horned beetle on the trunk: a slim body, spots, its long feelers swept back -->
    <svg viewBox="-7 -10 14 19"><path class="feeler" d="M-1 -5.6 C-4 -8 -5.6 -4 -6.4 2 M1 -5.6 C4 -8 5.6 -4 6.4 2" />
      <ellipse class="shellb" cx="0" cy="1.4" rx="2.8" ry="5.2" /><path class="seam" d="M0 -2.4 V6.4" />
      <circle class="spot" cx="-1.2" cy="0" r=".7" /><circle class="spot" cx="1.3" cy="1.6" r=".7" /><circle class="spot" cx="-1" cy="3.8" r=".7" /><circle class="spot" cx="1.1" cy="-1.6" r=".6" />
      <ellipse class="bhead" cx="0" cy="-4.6" rx="1.8" ry="1.4" /></svg>
  {:else if flight === 'perch' && PERCH[id] === 'stick'}
    <svg viewBox="-4 -10 8 20"><path class="stick" d="M0 -9 V9 M0 -5 L-2.6 -8 M0 -5 L2.6 -8 M0 0 L-3 1.2 M0 0 L3 1.2 M0 4 L-2.4 7.4 M0 4 L2.4 7.4" /></svg>
  {:else if flight === 'stalk'}
    <span class="stalker" class:rear={stalk === 'rear'} data-stalk={stalk}>
      {#if id === 'tarantula'}
        <!-- a tarantula: a dark hairy body, eight legs, the orange bands on its knees -->
        <svg viewBox="-11 -8 22 16"><path class="tleg" d="M-2 -1.6 L-6 -5.4 L-9.4 -3 M-2 -.4 L-7 -2 L-10 1.2 M-2 .8 L-6.6 2.6 L-9 6 M-1.6 1.8 L-4.4 5 L-6 7.6 M2 -1.6 L6 -5.4 L9.4 -3 M2 -.4 L7 -2 L10 1.2 M2 .8 L6.6 2.6 L9 6 M1.6 1.8 L4.4 5 L6 7.6" />
          <path class="tband" d="M-6 -5.4 l.8 .8 M-7 -2 l.4 1 M6 -5.4 l-.8 .8 M7 -2 l-.4 1" />
          <ellipse class="tbody" cx="0" cy="2.6" rx="3.6" ry="3.4" /><ellipse class="thead" cx="0" cy="-1.8" rx="2.6" ry="2.2" /></svg>
      {:else}
        <!-- a scorpion: pincers out front, its tail curled up over its back -->
        <svg viewBox="-11 -10 22 18"><path class="sleg" d="M-1.6 0 L-5 -1.6 M-1.6 1.6 L-5.4 2 M-1.4 3.2 L-4.6 5 M1.6 0 L5 -1.6 M1.6 1.6 L5.4 2 M1.4 3.2 L4.6 5" />
          <path class="sarm" d="M-1.4 -3 L-4.6 -5.6 M1.4 -3 L4.6 -5.6" /><ellipse class="spin" cx="-5.6" cy="-6.6" rx="1.8" ry="1.3" /><ellipse class="spin" cx="5.6" cy="-6.6" rx="1.8" ry="1.3" />
          <path class="stail" d="M0 5 C0 8.6 3.6 8.6 4.4 5.6 C5 3.4 3.4 1.6 1.8 1.4" /><path class="ssting" d="M1.8 1.4 L.6 2.6" />
          <ellipse class="sbody2" cx="0" cy="1" rx="2.6" ry="4.4" /></svg>
      {/if}
    </span>
  {:else if flight === 'burrow'}
    <!-- a mole cricket under the lawn: a little mound of fresh earth that twitches while it chirps -->
    <svg viewBox="-9 -5 18 8"><ellipse class="mound" cx="0" cy="0" rx="7.4" ry="3.2" /><path class="crack" d="M-3 -.6 L-1 .4 L.6 -1 L2.6 .2" />
      <circle class="clod" cx="-5" cy="1.6" r=".9" /><circle class="clod" cx="4.6" cy="-1.6" r=".7" /></svg>
  {:else if flight === 'crawl'}
    {#if id === 'hermit-crab'}
      <!-- a hermit crab: a borrowed shell, two red claws, little legs -->
      <svg viewBox="-8 -7 16 12"><path class="cleg" d="M-3.6 2 L-6.4 4.2 M-2.4 2.6 L-4.4 5.2 M3.6 2 L6.4 4.2 M2.4 2.6 L4.4 5.2" />
        <circle class="claw" cx="-4.6" cy=".6" r="1.6" /><circle class="claw" cx="4.6" cy=".6" r="1.6" />
        <path class="cshell" d="M-4 2.4 C-5 -2.6 -1.4 -6.4 2.6 -5.2 C5.4 -4.2 5.2 1 4 2.4 Z" /><path class="swirl" d="M-1.2 -.6 C-.4 -3.6 3 -3.2 2.6 -.4" /></svg>
    {:else if id === 'snail'}
      <svg viewBox="-8 -7 16 12"><path class="sbody" d="M-7 3.6 H4.6 Q7 3.6 7 1.6 L6.2 -.6 L5 2.2 H-6 Z" /><path class="sant" d="M5.6 -.4 L6.4 -3.8 M6.3 0 L7.9 -2.8" />
        <circle class="sshell" cx="-.6" cy="-.6" r="4" /><path class="swirl" d="M-.6 -.6 m-2.2 0 a2.2 2.2 0 1 1 2.2 2.2" /></svg>
    {:else if id === 'stinkbug' || id === 'man-faced-stink-bug'}
      <!-- a stink bug: NH's shield shape (the man-faced one with its face on its back) -->
      <svg viewBox="-7 -7 14 14"><path class="cleg" d="M-3 -1 L-5.6 -2.6 M-3 1.4 L-6 2 M-2.4 3.4 L-4.6 5.6 M3 -1 L5.6 -2.6 M3 1.4 L6 2 M2.4 3.4 L4.6 5.6" />
        <path class="shield" d="M0 -5.4 L4.6 -2.6 C4.6 2 2.6 5 0 6 C-2.6 5 -4.6 2 -4.6 -2.6 Z" />
        {#if id === 'man-faced-stink-bug'}<circle class="face2" cx="-1.5" cy="-.6" r=".9" /><circle class="face2" cx="1.5" cy="-.6" r=".9" /><path class="face2l" d="M-1.4 2.4 Q0 3.4 1.4 2.4" />{/if}
        <ellipse class="shead" cx="0" cy="-5.6" rx="1.4" ry="1" /></svg>
    {:else if id === 'tiger-beetle' || id === 'earth-boring-dung-beetle'}
      <!-- a ground beetle from above: the tiger beetle's long legs, the dung beetle round and metallic -->
      <svg viewBox="-7 -7 14 14"><path class="gleg" d="M-2.4 -1 L-6 -3.4 M-2.6 1 L-6.2 1.6 M-2.2 2.8 L-5 6 M2.4 -1 L6 -3.4 M2.6 1 L6.2 1.6 M2.2 2.8 L5 6" />
        <ellipse class="gbody" cx="0" cy="1.2" rx={id === 'tiger-beetle' ? 2.6 : 3.4} ry="3.8" /><path class="seam" d="M0 -1.8 V5" />
        <ellipse class="ghead" cx="0" cy="-3.4" rx="1.9" ry="1.5" />{#if id === 'tiger-beetle'}<circle class="gspot" cx="-1.2" cy="1.8" r=".55" /><circle class="gspot" cx="1.2" cy="1.8" r=".55" />{/if}</svg>
    {:else if id === 'walking-leaf'}
      <!-- a walking leaf: a green leaf with a midrib, its little head and legs peeking out -->
      <svg viewBox="-9 -6 18 12"><path class="lleg" d="M-1 -2.6 L-2 -5 M1.6 -2.4 L2.8 -4.8 M-1 2.6 L-2 5 M1.6 2.4 L2.8 4.8" />
        <path class="leaf" d="M-7.6 0 C-4 -4.6 3 -4.4 6.2 0 C3 4.4 -4 4.6 -7.6 0 Z" /><path class="rib" d="M-7 0 H5.4 M-2 0 L-3.6 -2 M1 0 L-.4 -2.2 M-2 0 L-3.6 2 M1 0 L-.4 2.2" />
        <circle class="lhead" cx="7" cy="0" r="1.1" /></svg>
    {:else if id === 'centipede'}
      <svg viewBox="-10 -4 20 8"><path class="cleg" d="M-7.6 -2.6 V2.6 M-4.6 -2.6 V2.6 M-1.6 -2.6 V2.6 M1.4 -2.6 V2.6 M4.4 -2.6 V2.6" />
        {#each [-7.6, -4.6, -1.6, 1.4, 4.4] as cx (cx)}<circle class="cseg" {cx} cy="0" r="1.8" />{/each}<circle class="chead" cx="7.2" cy="0" r="2" /></svg>
    {:else}
      <!-- a pill bug or a wharf roach: a segmented little oval (the roach with feelers) -->
      <svg viewBox="-8 -5 16 10">{#if id === 'wharf-roach'}<path class="ant" d="M4.4 -1 Q7.6 -4 8.6 -2.4 M4.4 1 Q7.6 4 8.6 2.4" />{/if}
        <ellipse class="pill" rx={id === 'wharf-roach' ? 5 : 4.2} ry="2.9" /><path class="seg" d="M-2 -2.6 V2.6 M.4 -2.8 V2.8 M2.8 -2.3 V2.3" /></svg>
    {/if}
  {:else if flight === 'perch'}
    <!-- a cicada on the trunk, head up, wings folded over its back -->
    <svg viewBox="-6 -8 12 16"><ellipse class="cibody" cx="0" cy="-.5" rx="2.6" ry="4.6" /><circle class="cibody" cx="0" cy="-5" r="2.2" />
      <circle class="eye" cx="-1.7" cy="-5.6" r=".8" /><circle class="eye" cx="1.7" cy="-5.6" r=".8" />
      <g class="ciwing"><path d="M-.3 -3.4 C-4.6 -2 -4.4 4.6 -1 7.4 C-.4 4 -.2 0 -.3 -3.4 Z" /><path d="M.3 -3.4 C4.6 -2 4.4 4.6 1 7.4 C.4 4 .2 0 .3 -3.4 Z" /></g></svg>
  {:else if id === 'mantis' || id === 'orchid-mantis'}
    <svg viewBox="-8 -8 16 16"><path class="mbody" d="M-6 3 Q-1 2 3 -1" /><path class="mleg" d="M2 -.6 L4.8 -4.8 L6.6 -2.6 M-2 2.4 L-3.2 5.6 M-4.4 2.8 L-6.6 5.4 M0 1.6 L1 5.2" />
      <path class="mhead" d="M2.6 -1.8 L5.2 -3 L5 -.6 Z" /></svg>
  {:else if flight === 'hop'}
    <svg viewBox="-8 -6 16 12"><path class="leg" d="M-1 1 L-5 -3.5 L-7 3" /><ellipse class="cbody" cx="0" cy="0" rx="4.6" ry="2.6" />
      <circle class="cbody" cx="4.4" cy="-.6" r="1.8" /><path class="ant" d="M5.5 -1.8 Q8 -6 3 -5.6 M5.8 -1.4 Q9 -4 6 -6" /></svg>
  {:else if id === 'flea'}
    <!-- a flea: a speck with long back legs, hopping -->
    <svg viewBox="-5 -4 10 8"><path class="fleg" d="M.6 1 L-2 3.4 L-3.8 2.2 M1.6 1.2 L2.4 3.4" /><ellipse class="flea-b" cx="0" cy="0" rx="2.4" ry="1.8" /><circle class="flea-b" cx="2.4" cy="-.4" r=".9" /></svg>
  {:else if id === 'mosquito'}
    <!-- a mosquito: a thin body, long dangling legs, two narrow wings in a blur -->
    <svg viewBox="-8 -8 16 16"><path class="mqleg" d="M-1 .6 L-4 5.6 M0 .8 L-1 6.4 M1 .6 L3 5.8" />
      <g class="wing"><ellipse cx="-1" cy="-3.6" rx="1.2" ry="3.4" transform="rotate(-30 -1 -3.6)" /></g><g class="wing r"><ellipse cx="1" cy="-3.6" rx="1.2" ry="3.4" transform="rotate(30 1 -3.6)" /></g>
      <path class="mqbody" d="M-5 .4 L3.6 -.2" /><circle class="mqhead" cx="4.4" cy="-.4" r="1.1" /><path class="mqbody" d="M5.2 -.2 L7.4 .6" /></svg>
  {:else if id === 'honeybee'}
    <svg viewBox="-8 -8 16 16"><g class="wing"><ellipse cx="-2" cy="-4" rx="2" ry="3.2" transform="rotate(-25 -2 -4)" /></g>
      <g class="wing r"><ellipse cx="2" cy="-4" rx="2" ry="3.2" transform="rotate(25 2 -4)" /></g>
      <ellipse class="bee" rx="4.4" ry="3.2" /><path class="stripe" d="M-1.6 -3 V3 M1.2 -3.1 V3.1" /><circle class="beehead" cx="4.6" cy="-.4" r="1.9" /></svg>
  {:else}
    <svg viewBox="-12 -10 24 20">
      <g class="wing"><path d="M0 0 C-4 -9 -12 -9 -11 -2 C-10 2 -4 2 0 0 Z M0 0 C-3 3 -9 6 -7 9 C-5 10 -1 5 0 0 Z" /></g>
      <g class="wing r"><path d="M0 0 C4 -9 12 -9 11 -2 C10 2 4 2 0 0 Z M0 0 C3 3 9 6 7 9 C5 10 1 5 0 0 Z" /></g>
      <ellipse rx="1" ry="4.5" class="bbody" />
    </svg>
  {/if}
</span>

<style>
  .sprite { position: absolute; left: 0; top: 0; display: block; }
  .sprite svg { position: absolute; overflow: visible; translate: -50% -50%; }
  .flutter svg { width: calc(18 * var(--su)); }
  .moth svg { width: calc(14 * var(--su)); }
  .ladybug svg { width: calc(10 * var(--su)); }
  .wing { transform-origin: 0 0; animation: flap .13s ease-in-out infinite alternate; }
  .ladybug .wing { transform-origin: 0 -3px; }
  @keyframes flap { to { scale: .25 1; } }
  .common-butterfly .wing { fill: #FFFDF3; stroke: #77738F; stroke-width: .8; }
  .yellow-butterfly .wing { fill: #FFE46E; stroke: #C79A2A; stroke-width: .8; }
  .tiger-butterfly .wing { fill: #FFCF45; stroke: #3B3026; stroke-width: 1.3; stroke-dasharray: 2 1.4; }
  .peacock-butterfly .wing { fill: #2C3438; stroke: #3BB49E; stroke-width: 1.1; }
  .emperor-butterfly .wing { fill: #4C93F2; stroke: #1F3A78; stroke-width: 1; }
  .moth .wing { fill: #DCCBA6; stroke: #A38B62; stroke-width: .8; }
  .honeybee svg { width: calc(11 * var(--su)); }
  .honeybee .wing { fill: rgba(255, 255, 255, .7); stroke: rgba(120, 130, 150, .6); stroke-width: .4; animation-duration: .06s; }
  .bee { fill: #F7C63C; }
  .stripe { stroke: #3A2C1E; stroke-width: 1.1; }
  .beehead { fill: #3A2C1E; }
  .bbody { fill: #4E3E30; }
  .ladybug .wing { fill: rgba(255, 255, 255, .55); }
  .lady { fill: #E8443B; }
  .seam { stroke: #3A2A22; stroke-width: .6; }
  .dot { fill: #2E2420; }
  /* dragonfly: darts and hovers, wings a shimmer */
  .dart svg { width: calc(24 * var(--su)); }
  .dwing { fill: rgba(255, 255, 255, .55); stroke: rgba(120, 140, 160, .5); stroke-width: .4; animation: shimmer .08s linear infinite alternate; }
  @keyframes shimmer { to { opacity: .55; } }
  .dbody { stroke-width: 1.8; stroke-linecap: round; }
  .darner-dragonfly .dbody { stroke: #3C8FC4; }
  .darner-dragonfly .dhead { fill: #2F7A62; }
  .red-dragonfly .dbody { stroke: #E0473A; }
  .red-dragonfly .dhead { fill: #B8342B; }
  .dband { display: none; }
  .banded-dragonfly .dbody { stroke: #2E2C24; }
  .banded-dragonfly .dhead { fill: #3E7A4A; }
  .banded-dragonfly .dband { display: inline; stroke: #F2CC3A; stroke-width: 1.8; stroke-dasharray: 1.3 1.5; }
  /* firefly: a soft drifting light that blinks */
  .glow {
    display: block; left: 0; top: 0; width: 4.6px; height: 4.6px; margin: -2.3px; border-radius: 50%;
    background: var(--firefly, #F6FF9E); box-shadow: 0 0 7px var(--firefly-glow, #EFFF7A); animation: blink 2.2s ease-in-out infinite;
  }
  @keyframes blink { 0%, 100% { opacity: .25; } 40%, 60% { opacity: 1; } }
  /* crickets: in the grass, a hop now and then (the hop is a Web Animation on .hopper) */
  .hop svg { width: calc(13 * var(--su)); }
  .cbody { fill: #8A6238; }
  .bell-cricket .cbody { fill: #5A4A36; }
  .rice-grasshopper .cbody { fill: #A9C653; }
  .grasshopper .cbody { fill: #6DAA3C; }
  .migratory-locust .cbody { fill: #8F8B4A; }
  .mantis svg, .orchid-mantis svg { width: calc(15 * var(--su)); }
  .mbody { fill: none; stroke: #79B648; stroke-width: 2; stroke-linecap: round; }
  .mleg { fill: none; stroke: #5E9A36; stroke-width: .8; stroke-linecap: round; stroke-linejoin: round; }
  .mhead { fill: #79B648; }
  .orchid-mantis .mbody, .orchid-mantis .mhead { stroke: #F4C9DC; fill: #F4C9DC; }
  .orchid-mantis .mbody { fill: none; }
  .orchid-mantis .mleg { stroke: #E6A6C3; }
  /* cicadas: flown in to a trunk, then perched (a faint buzz of the wings while it sings) */
  .perch svg { width: calc(11 * var(--su)); }
  .cibody { fill: #3E4A38; }
  .evening-cicada .cibody { fill: #8B6A3C; }
  .eye { fill: #1E2418; }
  .ciwing path { fill: rgba(232, 242, 236, .55); stroke: rgba(80, 110, 90, .7); stroke-width: .4; }
  .perch.sat .ciwing { animation: buzz .07s linear infinite alternate; }
  @keyframes buzz { to { translate: .25px 0; } }
  .leg, .ant { fill: none; stroke: #4A3420; stroke-width: .7; stroke-linecap: round; }
  /* more cicadas, the shell a cicada left behind (amber, see-through), the beetles and the walking stick */
  .walker-cicada .cibody { fill: #5C7A4A; }
  .giant-cicada .cibody { fill: #2E2A26; }
  .brown-cicada .cibody { fill: #6B4A2A; }
  .brown-cicada .ciwing path { fill: rgba(150, 100, 60, .8); }
  .cicada-shell .cibody { fill: rgba(196, 136, 64, .78); }
  .cicada-shell .ciwing path { fill: rgba(220, 170, 100, .5); }
  .cicada-shell.sat .ciwing { animation: none; }
  .perch svg:has(.shellb), .perch svg:has(.stick) { width: calc(11 * var(--su)); }
  .shellb { fill: var(--beetle, #4A2A18); }
  .bhead { fill: var(--beetle-head, #2E1C12); }
  .seam { stroke: rgba(0, 0, 0, .35); stroke-width: .5; }
  .jaw, .horn { fill: none; stroke: var(--beetle-head, #2E1C12); stroke-width: 1.1; stroke-linecap: round; }
  .saw-stag { --beetle: #6A3A20; }
  .miyama-stag { --beetle: #7A4A26; }
  .giant-stag { --beetle: #2A1E16; --beetle-head: #15100C; }
  .rainbow-stag { --beetle: #3BAA6E; --beetle-head: #8E5AD0; }
  .goliath-beetle { --beetle: #F2EEE4; }
  .goliath-beetle .seam { stroke: #2A2420; stroke-width: 1; }
  .drone-beetle { --beetle: #3F6E3C; --beetle-head: #2A4A28; }
  .jewel-beetle { --beetle: #2FA05A; --beetle-head: #1F6E3E; }
  .jewel-beetle .seam { stroke: #E0503E; stroke-width: 1.1; }
  .stick { fill: none; stroke: #8A6A3A; stroke-width: 1; stroke-linecap: round; }
  /* crawlers on the beach, the grass and the beds: they fade in where they are */
  .crawl svg { width: calc(12 * var(--su)); }
  .centipede svg { width: calc(16 * var(--su)); }
  .hermit-crab svg { width: calc(14 * var(--su)); }
  .cleg { fill: none; stroke: #C2453A; stroke-width: .8; stroke-linecap: round; }
  .claw { fill: #E0503E; }
  .cshell { fill: #F2D2B0; stroke: #C99A6A; stroke-width: .5; }
  .swirl { fill: none; stroke: #B07A4A; stroke-width: .6; }
  .pill { fill: #7E8590; }
  .wharf-roach .pill { fill: #8C8478; }
  .seg { stroke: rgba(0, 0, 0, .3); stroke-width: .5; }
  .centipede .cleg { stroke: #E8A23A; }
  .cseg { fill: #8A3A26; }
  .chead { fill: #B8452A; }
  .sbody { fill: #D9C2A0; }
  .sant { fill: none; stroke: #B49A78; stroke-width: .7; stroke-linecap: round; }
  .sshell { fill: #C98A4A; stroke: #8E5A2A; stroke-width: .5; }
  .snail .swirl { stroke: #7A4A22; }
  /* the bigger butterflies and the moth of the night */
  .paper-kite-butterfly .wing { fill: #FFFDF8; stroke: #2E2A26; stroke-width: 1.2; stroke-dasharray: 1.2 1.6; }
  .agrias-butterfly .wing { fill: #E8433E; stroke: #2B6CC4; stroke-width: 1.4; }
  .monarch-butterfly .wing { fill: #FF9A2E; stroke: #2E2218; stroke-width: 1.2; }
  .queen-alexandras-birdwing .wing { fill: #3FB59A; stroke: #1E2A24; stroke-width: 1.5; }
  .rajah-brookes-birdwing .wing { fill: #1F2622; stroke: #3ED68C; stroke-width: 1.7; }
  .atlas-moth .wing { fill: #C8693A; stroke: #7A3A1E; stroke-width: 1; }
  .queen-alexandras-birdwing svg, .rajah-brookes-birdwing svg, .atlas-moth svg { width: calc(23 * var(--su)); }
  .damselfly svg { width: calc(18 * var(--su)); }
  .damselfly .dbody { stroke: #4AB3E8; stroke-width: 1.2; }
  .damselfly .dhead { fill: #2A6FA0; }
  .long-locust svg { width: calc(15 * var(--su)); }
  .long-locust .cbody { fill: #7CC24A; }
  /* the rest of NH's bugs: the bluebottle, the great purple emperor, the sunset moth, the mosquito */
  .common-bluebottle .wing { fill: #26303A; stroke: #5CCBEE; stroke-width: 1.5; }
  .great-purple-emperor .wing { fill: #6B4CC0; stroke: #F4E7B4; stroke-width: 1.1; stroke-dasharray: 1.6 1.2; }
  .madagascan-sunset-moth .wing { fill: #24352C; stroke: #FF8A3A; stroke-width: 1.8; }
  .madagascan-sunset-moth svg { width: calc(20 * var(--su)); }
  .mosquito svg { width: calc(10 * var(--su)); }
  .mosquito .wing { fill: rgba(235, 240, 248, .7); stroke: rgba(110, 120, 140, .6); stroke-width: .3; animation-duration: .05s; }
  .mqbody { fill: none; stroke: #4A4440; stroke-width: 1.3; stroke-linecap: round; }
  .mqhead { fill: #3A3430; }
  .mqleg, .fleg { fill: none; stroke: #4A4440; stroke-width: .45; stroke-linecap: round; stroke-linejoin: round; }
  /* the trunks' long-horned beetles, the violin beetle, the scarab */
  .perch svg:has(.feeler) { width: calc(12 * var(--su)); }
  .feeler { fill: none; stroke: var(--beetle-head, #2E1C12); stroke-width: .6; stroke-linecap: round; }
  .spot { fill: var(--beetle-spot, #F4F2EA); }
  .citrus-long-horned-beetle { --beetle: #24221E; --beetle-head: #1A1816; }
  .rosalia-batesi-beetle { --beetle: #7CB4E0; --beetle-head: #22303A; --beetle-spot: #1E2A34; }
  .violin-beetle { --beetle: #8A7656; --beetle-head: #5A4A34; }
  .violin-beetle .shellb { rx: 4.6px; ry: 3.6px; }
  .scarab-beetle { --beetle: #E2D48E; --beetle-head: #B8A85E; }
  /* on the flowers and the ground */
  .shield { fill: #6DAA4A; stroke: #3E6E2C; stroke-width: .5; }
  .shead { fill: #3E6E2C; }
  .man-faced-stink-bug .shield { fill: #F0B83E; stroke: #A87418; }
  .man-faced-stink-bug .shead { fill: #A87418; }
  .face2 { fill: #3A2A1A; }
  .face2l { fill: none; stroke: #3A2A1A; stroke-width: .7; stroke-linecap: round; }
  .stinkbug .cleg, .man-faced-stink-bug .cleg { stroke: #4A3A28; stroke-width: .6; }
  .gleg { fill: none; stroke: #2E2A26; stroke-width: .6; stroke-linecap: round; }
  .tiger-beetle .gbody { fill: #2F9E6A; }
  .tiger-beetle .ghead { fill: #C2453A; }
  .gspot { fill: #F4EED8; }
  .earth-boring-dung-beetle .gbody { fill: #4A5FC4; }
  .earth-boring-dung-beetle .ghead { fill: #3A4A9E; }
  .walking-leaf svg { width: calc(15 * var(--su)); }
  .leaf { fill: #8CC250; stroke: #5E9032; stroke-width: .5; }
  .rib { fill: none; stroke: #5E9032; stroke-width: .45; }
  .lleg { fill: none; stroke: #6E9E3E; stroke-width: .6; stroke-linecap: round; }
  .lhead { fill: #6E9E3E; }
  /* the night's tarantula and scorpion: it rears up (its front lifts) when it's come at */
  .stalk svg { width: calc(17 * var(--su)); }
  .stalker { display: block; position: absolute; left: 0; top: 0; transform-origin: 50% 100%; transition: transform .25s cubic-bezier(.3, 1.4, .5, 1); }
  .stalker.rear { transform: translateY(calc(-3 * var(--su))) scale(1.12, 1.24); }
  .tleg { fill: none; stroke: #3A2E2A; stroke-width: 1; stroke-linecap: round; stroke-linejoin: round; }
  .tband { fill: none; stroke: #E8883A; stroke-width: 1; }
  .tbody { fill: #4A3A32; }
  .thead { fill: #3A2E2A; }
  .sleg, .sarm { fill: none; stroke: #5A4628; stroke-width: .8; stroke-linecap: round; }
  .spin, .sbody2 { fill: #7A5E34; }
  .stail { fill: none; stroke: #7A5E34; stroke-width: 1.4; stroke-linecap: round; }
  .ssting { stroke: #3A2A18; stroke-width: .9; stroke-linecap: round; }
  /* the mole cricket's mound twitches now and then as it chirps */
  .burrow svg { width: calc(15 * var(--su)); animation: twitch 2.4s ease-in-out infinite; transform-origin: 50% 80%; }
  @keyframes twitch { 0%, 70%, 100% { transform: none; } 76% { transform: scale(1.06, .9); } 82% { transform: scale(.97, 1.06); } 88% { transform: none; } }
  .mound { fill: #9A7A52; }
  .crack { fill: none; stroke: #6A4E30; stroke-width: .6; stroke-linecap: round; }
  .clod { fill: #8A6A44; }
  .flea svg { width: calc(6 * var(--su)); }
  .flea-b { fill: #3A2C24; }
  /* the dug-up mound: clods of earth fly up and fall */
</style>
