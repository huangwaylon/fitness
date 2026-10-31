<script lang="ts">
  // The pond (docs/design.md "Pond"): an NH-style small pond on the back of the island, drawn like the ground
  // (Ground.svelte: light from the upper left, one fill + one gradient + one soft shade, no strokes on scenery): a
  // rounded oval with a light earthen bank, the far bank's inner wall in shade, NH's teal water lighter toward the
  // front, two lily pads (one with a pink bloom), a clump of reeds on its back-left bank and one slow ripple ring (the
  // pond's one animation: transform and opacity). Its fish (Critters.svelte) swim over it; a tap on the water ripples
  // (SceneTaps). Stage units, its own svg so it never touches the ground's; under the time-of-day tint like the land.
  import { POND } from './scene.ts';
  import type { Season } from '#lib/ui-state/theme.svelte.ts';

  let { uid, season }: { uid: string; season: Season } = $props();
  const { cx, cy, rx, ry } = POND;
  const winter = $derived(season === 'winter');
  // reeds on the back-left bank: [x, height, lean]
  const REEDS: [number, number, number][] = [[-0.86, 13, -6], [-0.78, 17, -2], [-0.7, 12, 4], [-0.62, 15, 7]];
  const bankY = (k: number) => cy - ry * Math.sqrt(Math.max(0, 1 - k * k)) - 0.5;
</script>

<svg class="pond" viewBox="0 0 390 360" preserveAspectRatio="none" aria-hidden="true">
  <defs>
    <linearGradient id="{uid}-pw" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#2F8FBF" /><stop offset=".45" stop-color="#46ACD3" /><stop offset="1" stop-color="#7AD3E3" />
    </linearGradient>
    <radialGradient id="{uid}-pb" cx=".35" cy=".3" r=".8">
      <stop offset="0" stop-color={winter ? '#F4F7FB' : '#E9D9A8'} /><stop offset="1" stop-color={winter ? '#D5DFEC' : '#CDB37C'} />
    </radialGradient>
    <clipPath id="{uid}-pc"><ellipse {cx} {cy} {rx} {ry} /></clipPath>
  </defs>
  <!-- a soft contact shade on the grass under the bank's front -->
  <ellipse cx={cx + 1.5} cy={cy + 2.5} rx={rx + 5} ry={ry + 4} fill="rgba(40, 70, 30, .16)" />
  <!-- the bank: a light earthen rim, sunlit at the upper left -->
  <ellipse {cx} cy={cy + 0.6} rx={rx + 3.6} ry={ry + 2.8} fill="url(#{uid}-pb)" />
  <!-- the water -->
  <ellipse {cx} {cy} {rx} {ry} fill="url(#{uid}-pw)" data-pond-water />
  <g clip-path="url(#{uid}-pc)">
    <!-- the far bank's inner wall, in shade (we look in from the front) -->
    <ellipse {cx} cy={cy - ry * 0.98} rx={rx * 1.04} ry={ry * 0.42} fill="rgba(70, 60, 40, .42)" />
    <ellipse {cx} cy={cy - ry * 0.7} rx={rx * 1.02} ry={ry * 0.28} fill="rgba(30, 80, 120, .22)" />
    <!-- glints, light from the upper left -->
    <rect x={cx - rx * 0.5} y={cy - ry * 0.12} width="7" height="1.3" rx=".65" fill="rgba(255, 255, 255, .7)" />
    <rect x={cx + rx * 0.12} y={cy + ry * 0.38} width="5" height="1.1" rx=".55" fill="rgba(255, 255, 255, .55)" />
    <!-- the ripple: one ring widening out from the middle and fading, every few seconds -->
    <ellipse class="ripple" cx={cx + rx * 0.18} cy={cy + ry * 0.05} rx={rx * 0.42} ry={ry * 0.4} />
  </g>
  <!-- lily pads: round leaves with NH's notch, one with a pink bloom -->
  <g class="pads">
    <path d="M{cx + rx * 0.5} {cy + ry * 0.2} m-5.2 0 a5.2 2.6 0 1 0 10.4 0 a5.2 2.6 0 0 0 -4.2 -2.5 l-1 2.5 l-1.4 -2.4 a5.2 2.6 0 0 0 -3.8 2.4 z" fill="#5DB65A" />
    <path d="M{cx + rx * 0.5 - 4} {cy + ry * 0.2 + 0.6} a4.6 1.8 0 0 0 8.6 .4" fill="none" stroke="rgba(30, 90, 40, .35)" stroke-width=".6" />
    <path d="M{cx - rx * 0.34} {cy + ry * 0.5} m-3.6 0 a3.6 1.8 0 1 0 7.2 0 a3.6 1.8 0 0 0 -2.9 -1.7 l-.7 1.7 l-1 -1.6 a3.6 1.8 0 0 0 -2.6 1.6 z" fill="#6CC468" />
    <g transform="translate({cx + rx * 0.5 + 1.2} {cy + ry * 0.2 - 1.4})">
      <ellipse cx="-1.4" cy="0" rx="1.6" ry="1" fill="#FF9EC2" /><ellipse cx="1.4" cy="0" rx="1.6" ry="1" fill="#FF9EC2" />
      <ellipse cx="0" cy="-.9" rx="1.2" ry="1.5" fill="#FFB7D2" /><circle cx="0" cy="-.1" r=".6" fill="#FFE07A" />
    </g>
  </g>
  <!-- reeds on the back-left bank: thin stems, a few with a cattail's brown head -->
  {#each REEDS as [k, h, lean], i (i)}
    {@const x = cx + rx * k}
    {@const y = bankY(k)}
    <path d="M{x} {y} q{lean * 0.3} {-h * 0.55} {lean} {-h}" fill="none" stroke={winter ? '#9DB08A' : '#5E9F45'} stroke-width="1.3" stroke-linecap="round" />
    {#if i % 2}<rect x={x + lean - 0.9} y={y - h - 1} width="1.8" height="4.4" rx=".9" fill="#8A5A32" transform="rotate({lean * 2} {x + lean} {y - h + 1})" />{/if}
  {/each}
</svg>

<style>
  /* on the lawn of the back strip: over the ground svg, under the hedge, the trees and everything standing (their z
     ≥ 20), under the shadows that swim in it (Critters' sea life, z 1, comes later in the stage) */
  .pond { position: absolute; inset: 0; width: 100%; height: 100%; z-index: 1; overflow: visible; pointer-events: none; }
  .ripple { fill: none; stroke: rgba(255, 255, 255, .75); stroke-width: .7; transform-box: fill-box; transform-origin: center;
    animation: pond-ripple 4.6s ease-out infinite; }
  @keyframes pond-ripple { 0% { transform: scale(.15); opacity: 0; } 12% { opacity: .9; } 70%, 100% { transform: scale(1.25); opacity: 0; } }
</style>
