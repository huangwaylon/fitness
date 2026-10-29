<svelte:options namespace="svg" />

<script lang="ts">
  // The island ground (round 7, docs/design/environment-style.md "Pocket Camp diorama"), inside the stage
  // svg (390 × 360 u, overflow visible). Painted like the official renders: light from the upper left, no
  // strokes or offset lips on scenery; every surface = one base fill + one gentle gradient + one soft lower
  // shade + sparse NH flecks. Back to front:
  //   turquoise shallow ring (blurred, fades outward) · a second foam line 7u out (45%) · the 2.5u foam line
  //   on the beach edge · the 5u wet band · the sand crescent (radial, lighter at the upper left) · a soft
  //   shade at the cliff foot · the terracotta cliff (12u at the front, 6u at the sides, lit on top, two faint
  //   strata) · the 3u grass overhang · the grass (radial highlight at (30%, 25%), a soft lower shade, seeded
  //   5u triangle flecks; winter: snow, a blue-lilac lower shade and scallops over the cliff edge) · the plaza
  //   patch under the jar · soft radial contact shadows under the trees and the jar.
  // Colours: the season tables in tokens.css (Builder A block). The time of day is ONE multiply tint over
  // land and sea (IslandScene .tint), so nothing here is keyed on tod (except the dusk shadow stretch).
  import type { Season } from '#lib/client/theme.svelte.ts';
  import { BED_ROWS, BED_X, JAR, PLATEAU, SAND, TREE, outline, rng, smooth } from './scene.ts';

  interface Props {
    uid: string;
    season: Season;
  }
  let { uid, season }: Props = $props();
  const winter = $derived(season === 'winter');

  type Pt = [number, number];
  const P = PLATEAU;
  // ---- shore (the same wavy parameterisation on every offset, so the bands stay parallel) ----
  const wave = (d: number, amp = 1.4) => smooth(outline(SAND, d, amp, 18, 0.6));
  const SHALLOW = wave(18, 2);
  const FOAM2 = smooth(outline(SAND, 14.5, 2.2, 22, 1.9));
  const FOAM = wave(7.5);
  const WET = wave(5);
  const DRY = wave(0);

  // ---- plateau, cliff, overhang ----
  const top = outline(P, 0, 1.6, 9, 0.3);
  /** The cliff drop under a point of the grass edge: 12u at the front, tapering to 6u up the sides. */
  const drop = (y: number) => 6 + 6 * Math.min(1, Math.max(0, (y - 250) / (P.y1 - 250)));
  const shift = (pts: Pt[], f: (y: number) => number): Pt[] => pts.map(([x, y]) => [x, y + f(y)]);
  const GRASS = smooth(top);
  const OVERHANG = smooth(shift(top, () => 3));
  const CLIFF = smooth(shift(top, drop));
  const FOOT = smooth(shift(top, (y) => drop(y) + 4));
  // the front run of the edge (the cliff face you see), for the strata and the winter scallops
  const front = top.filter(([, y]) => y > P.y1 - 24);
  const frontRun = (() => {
    // outline() runs clockwise, so the front edge is one contiguous run (right → left)
    const i0 = top.findIndex(([, y]) => y > P.y1 - 24);
    const run: Pt[] = [];
    for (let i = i0; i < top.length && top[i][1] > P.y1 - 24; i++) run.push(top[i]);
    return run.length ? run : front;
  })();
  const STRATA = [0.42, 0.74].map((k) => smooth(shift(frontRun, (y) => drop(y) * k + 1), false));
  // 6u scallops along the straight front run (the corners stay smooth)
  const SCALLOPS: Pt[] = Array.from({ length: Math.floor((P.x1 - P.x0 - 2 * P.rb) / 5.5) + 1 }, (_, i) => [P.x0 + P.rb + i * 5.5, P.y1 + 1.4]);

  // ---- grass flecks: NH's sparse two-tone 5u triangles, randomly rotated, seeded (~2% coverage) ----
  const inside = (x: number, y: number, m: number) => {
    if (x < P.x0 + m || x > P.x1 - m || y < P.y0 + m || y > P.y1 - m) return false;
    const r = y < (P.y0 + P.y1) / 2 ? P.rt : P.rb;
    const cy = y < (P.y0 + P.y1) / 2 ? P.y0 + r : P.y1 - r;
    const cx = x < (P.x0 + P.x1) / 2 ? P.x0 + r : P.x1 - r;
    const inCorner = (x < P.x0 + r || x > P.x1 - r) && (y < P.y0 + r || y > P.y1 - r);
    return !inCorner || Math.hypot(x - cx, y - cy) < r - m;
  };
  const FLECKS = (() => {
    const r = rng(1907);
    const tri = (x: number, y: number, a: number, s: number) =>
      [0, 1, 2].map((k) => {
        const t = a + (k * 2 * Math.PI) / 3;
        return `${(x + s * 0.58 * Math.cos(t)).toFixed(1)} ${(y + s * 0.58 * Math.sin(t)).toFixed(1)}`;
      });
    let hi = '', lo = '';
    for (let i = 0; i < 260 && (hi + lo).length < 9000; i++) {
      const x = P.x0 + r() * (P.x1 - P.x0), y = P.y0 + r() * (P.y1 - P.y0);
      const a = r() * Math.PI * 2, s = 4 + r() * 1.4, light = r() < 0.58;
      // keep the plaza patch and the tree trunks' footing clean
      if (!inside(x, y, 6) || Math.hypot((x - JAR.x) / 60, (y - JAR.base + 6) / 26) < 1) continue;
      if (r() > 0.45) continue;
      const [p, q, w] = tri(x, y, a, s);
      const d = `M${p}L${q}L${w}Z`;
      if (light) hi += d; else lo += d;
    }
    return { hi, lo };
  })();

  const SH_TREE = { rx: TREE.h * 0.26, ry: TREE.h * 0.06 };
</script>

<defs>
  <filter id="{uid}-soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="5" /></filter>
  <filter id="{uid}-foot" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="4" /></filter>
  <radialGradient id="{uid}-sand" gradientUnits="userSpaceOnUse" cx="110" cy="120" r="300">
    <stop offset="0" style:stop-color="var(--sand-hi)" /><stop offset=".72" style:stop-color="var(--sand)" />
  </radialGradient>
  <linearGradient id="{uid}-cliff" gradientUnits="userSpaceOnUse" x1="0" y1={P.y1 - 4} x2="0" y2={P.y1 + 12}>
    <stop offset="0" style:stop-color="var(--cliff-top)" /><stop offset="1" style:stop-color="var(--cliff-bottom)" />
  </linearGradient>
  <radialGradient id="{uid}-grass" gradientUnits="userSpaceOnUse" cx={P.x0 + 0.3 * (P.x1 - P.x0)} cy={P.y0 + 0.25 * (P.y1 - P.y0)} r="240">
    <stop offset="0" style:stop-color="var(--grass-hi)" /><stop offset=".85" style:stop-color="var(--grass)" />
  </radialGradient>
  <linearGradient id="{uid}-lower" gradientUnits="userSpaceOnUse" x1="0" y1="226" x2="0" y2={P.y1}>
    <stop offset="0" style:stop-color="var(--grass-shade)" stop-opacity="0" /><stop offset="1" style:stop-color="var(--grass-shade)" stop-opacity=".38" />
  </linearGradient>
  <radialGradient id="{uid}-plaza">
    <stop offset="0" style:stop-color="var(--plaza-hi)" /><stop offset=".8" style:stop-color="var(--plaza)" />
    <stop offset="1" style:stop-color="var(--plaza)" stop-opacity="0" />
  </radialGradient>
  <!-- contact shadows: radial, fading to 0, in the colour of the surface they fall on -->
  <radialGradient id="{uid}-sh">
    <stop offset="0" style:stop-color="var(--sh-c)" /><stop offset=".5" style:stop-color="var(--sh-c)" stop-opacity=".7" />
    <stop offset="1" style:stop-color="var(--sh-c)" stop-opacity="0" />
  </radialGradient>
  <radialGradient id="{uid}-sh-sand">
    <stop offset="0" style:stop-color="var(--sh-sand)" /><stop offset=".5" style:stop-color="var(--sh-sand)" stop-opacity=".7" />
    <stop offset="1" style:stop-color="var(--sh-sand)" stop-opacity="0" />
  </radialGradient>
  <clipPath id="{uid}-cliffclip"><path d={CLIFF} /></clipPath>
  <clipPath id="{uid}-grassclip"><path d={GRASS} /></clipPath>
</defs>

<!-- shore: shallows, foam ×2, wet band, sand -->
<path d={SHALLOW} fill="var(--shallow)" filter="url(#{uid}-soft)" opacity=".95" />
<path d={FOAM2} fill="none" stroke="var(--foam)" stroke-width="1.8" stroke-linejoin="round" opacity=".45" />
<path d={FOAM} fill="var(--foam)" opacity=".95" />
<path d={WET} fill="var(--sand-wet)" />
<path d={DRY} fill="url(#{uid}-sand)" />
<path d={FOOT} fill="var(--sand-shade)" opacity=".5" filter="url(#{uid}-foot)" />

<!-- cliff: lit on top, darker below, two faint strata -->
<path d={CLIFF} fill="url(#{uid}-cliff)" />
<g clip-path="url(#{uid}-cliffclip)" fill="none" stroke="var(--strata)" stroke-width="1" opacity=".7">
  {#each STRATA as d, i (i)}<path {d} />{/each}
</g>
<path d={OVERHANG} fill="var(--overhang)" />

<!-- grass: base + radial highlight, a soft lower shade, sparse flecks -->
<path d={GRASS} fill="url(#{uid}-grass)" />
<path d={GRASS} fill="url(#{uid}-lower)" />
{#if !winter}
  <g clip-path="url(#{uid}-grassclip)">
    <path d={FLECKS.hi} fill="var(--fleck-hi)" />
    <path d={FLECKS.lo} fill="var(--fleck-lo)" opacity=".55" />
  </g>
{:else}
  <!-- 6u scalloped snow over the cliff edge -->
  <g fill="var(--grass)">{#each SCALLOPS as [x, y], i (i)}<circle cx={x} cy={y} r="3.2" />{/each}</g>
{/if}

<!-- the plaza: a soft round sand patch under the jar (where NH puts the plaza) -->
<ellipse cx={JAR.x} cy={JAR.base - 6} rx="58" ry="24" fill="url(#{uid}-plaza)" />

<!-- contact shadows (+6% right and down; dusk: stretched to the right) -->
{#each [TREE.x.A, TREE.x.B] as x (x)}
  <ellipse cx={x + SH_TREE.rx * 0.12} cy={TREE.base + 1.5} rx={SH_TREE.rx} ry={SH_TREE.ry} fill="url(#{uid}-sh)" class="sh" />
{/each}
<ellipse cx={JAR.x + 3} cy={JAR.base + 1} rx={JAR.w * 0.55} ry="7" fill="url(#{uid}-sh-sand)" class="sh" />

{#if winter}
  {#each [BED_X.left, BED_X.right] as xs, i (i)}
    {#each BED_ROWS as y (y)}
      <rect x={xs[0] - 10} y={y - 5} width={xs[xs.length - 1] - xs[0] + 20} height="7" rx="3.5" fill="var(--grass-shade)" opacity=".6" />
      <rect x={xs[0] - 10} y={y - 6.5} width={xs[xs.length - 1] - xs[0] + 20} height="7" rx="3.5" fill="#fff" />
    {/each}
  {/each}
{/if}

<style>
  .sh { transform-box: fill-box; transform-origin: 30% 50%; transform: scaleX(var(--sh-scale, 1)); }
</style>
