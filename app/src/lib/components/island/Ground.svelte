<svelte:options namespace="svg" />

<script lang="ts">
  // The island ground (round 7, docs/design/design.md §S.3 "Pocket Camp diorama"), inside the stage
  // svg (390 × 360 u, overflow visible). Painted like the official renders: light from the upper left, no
  // strokes or offset lips on scenery; every surface = one base fill + one gentle gradient + one soft lower
  // shade + sparse NH flecks. Back to front:
  //   turquoise shallow ring (blurred, fades outward) · a second foam line 7u out (45%) · the 2.5u foam line
  //   on the beach edge · the 5u wet band · the sand crescent (radial, lighter at the upper left) · a soft
  //   shade at the cliff foot · the terracotta cliff (12u at the front, 6u at the sides, lit on top, two faint
  //   strata) · the overhang's soft shade on the cliff top · the 3u grass overhang · the grass (radial highlight
  //   at (30%, 25%), broad blurred tonal patches, a soft lower shade, NH leaf triangles ≈ 0.2 tile on a jittered
  //   tile grid, flattened to the camera; winter: snow dimples, a blue-lilac lower shade and scallops over the
  //   cliff edge) · the plaza patch under the jar · soft radial contact shadows under the trees, the jar, every
  //   hedge bush and every flower (docs/design/design.md §S.2).
  // Colours: the season tables in tokens.css (Builder A block). The time of day is ONE multiply tint over
  // land and sea (IslandScene .tint), so nothing here is keyed on tod (except the dusk shadow stretch).
  import type { Season } from '#lib/client/theme.svelte.ts';
  import { BED_ROWS, BED_X, BUSH_U, HEDGE_BASE, HEDGE_X, JAR, PLATEAU, ROW, SAND, TILE, TREE, outline, rng, smooth } from './scene.ts';

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

  // ---- grass (scale pass, docs/design/design.md §S.2): NH's grass is a plain green with two-tone leaf
  // triangles about a fifth of a tile across, lying flat on the ground (squashed to the camera's 0.7 depth),
  // a couple per tile, never in a repeating pattern; plus broad, soft lighter and darker patches. ----
  const inside = (x: number, y: number, m: number) => {
    if (x < P.x0 + m || x > P.x1 - m || y < P.y0 + m || y > P.y1 - m) return false;
    const r = y < (P.y0 + P.y1) / 2 ? P.rt : P.rb;
    const cy = y < (P.y0 + P.y1) / 2 ? P.y0 + r : P.y1 - r;
    const cx = x < (P.x0 + P.x1) / 2 ? P.x0 + r : P.x1 - r;
    const inCorner = (x < P.x0 + r || x > P.x1 - r) && (y < P.y0 + r || y > P.y1 - r);
    return !inCorner || Math.hypot(x - cx, y - cy) < r - m;
  };
  /** Clear ground: the plaza patch under the jar and the trunks' root flare. */
  const clear = (x: number, y: number) =>
    Math.hypot((x - JAR.x) / 52, (y - JAR.base + 6) / 22) < 1 ||
    [TREE.x.A, TREE.x.B].some((tx) => Math.hypot((x - tx) / 26, (y - TREE.base + 3) / 9) < 1);
  const FLECKS = (() => {
    const r = rng(1907);
    // a jittered grid (≈ 2.4 cells per tile, 62% filled): even cover, no clumps, no repeat
    const cw = TILE / 2.4, ch = ROW / 2.2;
    const tri = (x: number, y: number, a: number, s: number) =>
      [0, 1, 2].map((k) => {
        const t = a + (k * 2 * Math.PI) / 3;
        return `${(x + s * 0.58 * Math.cos(t)).toFixed(1)} ${(y + s * 0.58 * 0.72 * Math.sin(t)).toFixed(1)}`;
      });
    const out = { hi: '', hi2: '', lo: '', lo2: '' };
    for (let gy = P.y0 + 2; gy < P.y1; gy += ch)
      for (let gx = P.x0 + 2; gx < P.x1; gx += cw) {
        const x = gx + r() * cw, y = gy + r() * ch;
        const a = r() * Math.PI * 2, s = 6 + r() * 4.5, tone = r(), keep = r();
        if (keep > 0.62 || !inside(x, y, 5) || clear(x, y)) continue;
        const [p, q, w] = tri(x, y, a, s);
        const d = `M${p}L${q}L${w}Z`;
        // light flecks outnumber the dark ones (as in-game); two opacities each for gentle variation
        if (tone < 0.36) out.hi += d;
        else if (tone < 0.62) out.hi2 += d;
        else if (tone < 0.84) out.lo += d;
        else out.lo2 += d;
      }
    return out;
  })();
  /** Winter: NH's snow ground has soft round dimples instead of leaves. */
  const DIMPLES = (() => {
    const r = rng(77);
    let d = '';
    for (let gy = P.y0 + 4; gy < P.y1; gy += 16)
      for (let gx = P.x0 + 4; gx < P.x1; gx += 20) {
        const x = gx + r() * 20, y = gy + r() * 16, rx = 2.5 + r() * 4;
        if (r() > 0.55 || !inside(x, y, 6) || clear(x, y)) continue;
        d += `M${(x - rx).toFixed(1)} ${y.toFixed(1)}a${rx.toFixed(1)} ${(rx * 0.7).toFixed(1)} 0 1 0 ${(2 * rx).toFixed(1)} 0a${rx.toFixed(1)} ${(rx * 0.7).toFixed(1)} 0 1 0 ${(-2 * rx).toFixed(1)} 0Z`;
      }
    return d;
  })();
  /** Broad tonal patches (blurred): lighter where the light falls, darker worn/shaded spots, seeded. */
  const PATCHES = (() => {
    const r = rng(311);
    return Array.from({ length: 14 }, (_, i) => {
      const rx = 24 + r() * 40;
      return { x: P.x0 + 24 + r() * (P.x1 - P.x0 - 48), y: P.y0 + 18 + r() * (P.y1 - P.y0 - 36), rx, ry: rx * (0.45 + r() * 0.25), light: i % 3 !== 2, o: 0.35 + r() * 0.3 };
    });
  })();
  /** The cliff's top under the grass overhang: a soft shade (the overhang's own shadow). */
  const LIP_SHADE = smooth(shift(top, (y) => Math.min(drop(y), 5)));

  /** Contact shadows of the hedge and the flowers (one per tile). */
  const BUSH_SH = HEDGE_X.map((x) => ({ x: x + 2, y: HEDGE_BASE + 1, rx: BUSH_U * 0.56, ry: 5.5 }));
  const FLOWER_SH = BED_ROWS.flatMap((y) => [...BED_X.left, ...BED_X.right].map((x) => ({ x: x + 1.5, y: y + 0.5, rx: 11, ry: 3.2 })));
  const SH_TREE = { rx: TREE.h * 0.26, ry: TREE.h * 0.06 };
</script>

<defs>
  <filter id="{uid}-soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="5" /></filter>
  <filter id="{uid}-patch" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="9" /></filter>
  <filter id="{uid}-lip" x="-5%" y="-20%" width="110%" height="140%"><feGaussianBlur stdDeviation="1.6" /></filter>
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
<path d={LIP_SHADE} fill="var(--cliff-bottom)" opacity=".45" filter="url(#{uid}-lip)" clip-path="url(#{uid}-cliffclip)" />
<path d={OVERHANG} fill="var(--overhang)" />

<!-- grass: base + radial highlight, broad soft patches, a soft lower shade, NH leaf flecks (winter: dimples) -->
<path d={GRASS} fill="url(#{uid}-grass)" />
<g clip-path="url(#{uid}-grassclip)">
  <g filter="url(#{uid}-patch)">
    {#each PATCHES as p, i (i)}
      <ellipse cx={p.x} cy={p.y} rx={p.rx} ry={p.ry} fill={p.light ? 'var(--grass-hi)' : 'var(--grass-shade)'} opacity={p.light ? p.o : p.o * 0.32} />
    {/each}
  </g>
</g>
<path d={GRASS} fill="url(#{uid}-lower)" />
<g clip-path="url(#{uid}-grassclip)" stroke-linejoin="round" stroke-width="1.2">
  {#if !winter}
    <path d={FLECKS.hi} fill="var(--fleck-hi)" stroke="var(--fleck-hi)" opacity=".85" />
    <path d={FLECKS.hi2} fill="var(--fleck-hi)" stroke="var(--fleck-hi)" opacity=".5" />
    <path d={FLECKS.lo} fill="var(--fleck-lo)" stroke="var(--fleck-lo)" opacity=".5" />
    <path d={FLECKS.lo2} fill="var(--fleck-lo)" stroke="var(--fleck-lo)" opacity=".3" />
  {:else}
    <path d={DIMPLES} fill="var(--grass-shade)" opacity=".2" />
  {/if}
</g>
{#if winter}
  <!-- 6u scalloped snow over the cliff edge -->
  <g fill="var(--grass)">{#each SCALLOPS as [x, y], i (i)}<circle cx={x} cy={y} r="3.2" />{/each}</g>
{/if}

<!-- the plaza: a soft round sand patch under the jar (where NH puts the plaza) -->
<ellipse cx={JAR.x} cy={JAR.base - 5} rx="52" ry="22" fill="url(#{uid}-plaza)" />

<!-- contact shadows (+6% right and down; dusk: stretched to the right) -->
{#each [TREE.x.A, TREE.x.B] as x (x)}
  <ellipse cx={x + SH_TREE.rx * 0.12} cy={TREE.base + 1.5} rx={SH_TREE.rx} ry={SH_TREE.ry} fill="url(#{uid}-sh)" class="sh" />
{/each}
<ellipse cx={JAR.x + 3} cy={JAR.base + 1} rx={JAR.w * 0.55} ry="7" fill="url(#{uid}-sh-sand)" class="sh" />
{#each BUSH_SH as b, i (i)}<ellipse cx={b.x} cy={b.y} rx={b.rx} ry={b.ry} fill="url(#{uid}-sh)" class="sh" />{/each}
{#each FLOWER_SH as f, i (i)}<ellipse cx={f.x} cy={f.y} rx={f.rx} ry={f.ry} fill="url(#{uid}-sh)" opacity=".8" class="sh" />{/each}



<style>
  .sh { transform-box: fill-box; transform-origin: 30% 50%; transform: scaleX(var(--sh-scale, 1)); }
</style>
