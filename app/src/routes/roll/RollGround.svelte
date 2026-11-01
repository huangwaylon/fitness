<script lang="ts">
  // The rolling-log spike's ground (route /roll): one flat plan of the whole island in an SVG <defs> group, world
  // units, x −200…590 (wider than the land, so the perspective's narrowing never shows an edge), y = ZMAX − z (the
  // back at the top). The page cuts it into bands, each an <svg> whose viewBox is its slice, <use>-ing this group.
  // Painted like the island's Ground.svelte (light from the upper left, a fill and a soft gradient, NH leaf flecks),
  // with a faint tile checker so the foreshortening and any band seam are easy to judge. The still things' contact
  // shadows are drawn here, on the ground: they foreshorten with it for free.
  import { mulberry32 } from '#lib/random.ts';
  import { LAND, PATH, PLAZA, POND, THINGS, ZMAX, MUSEUM_AT } from './world.ts';

  const Y = (z: number) => ZMAX - z;
  const X0 = -200, W = 790, TILE = 32;
  const land = { x: LAND.x0, y: Y(LAND.z1), w: LAND.x1 - LAND.x0, h: LAND.z1 - LAND.z0 };
  const beachTop = Y(LAND.z0 + 80);
  const pathD = PATH.map(([x, z], i) => `${i ? 'L' : 'M'}${x} ${Y(z)}`).join(' ');
  /** Tiles darker in a checker (every other one, a whisper). */
  const checker: [number, number][] = [];
  for (let y = land.y; y < beachTop; y += TILE)
    for (let x = Math.floor(land.x / TILE) * TILE; x < land.x + land.w; x += TILE)
      if (((x / TILE + (y - land.y) / TILE) & 1) === 0) checker.push([x, y]);
  /** NH's leaf triangles, a jittered grid, flattened. */
  const flecks = (() => {
    const r = mulberry32(2207), out: string[] = [];
    for (let y = land.y + 10; y < beachTop - 10; y += 26)
      for (let x = land.x + 8; x < land.x + land.w - 8; x += 30) {
        if (r() > 0.55) continue;
        const cx = x + r() * 22, cy = y + r() * 18, s = 3 + r() * 2, a = r() * Math.PI;
        out.push([0, 1, 2].map((k) => `${(cx + Math.cos(a + (k * 2 * Math.PI) / 3) * s).toFixed(1)},${(cy + Math.sin(a + (k * 2 * Math.PI) / 3) * s * 0.6).toFixed(1)}`).join(' '));
      }
    return out;
  })();
  const shadows = THINGS.filter((t) => t.shadow).map((t) => ({ x: t.x, y: Y(t.z), rx: t.shadow![0], ry: t.shadow![1] }));
</script>

<svg class="defs" width="0" height="0" aria-hidden="true">
  <defs>
    <linearGradient id="rg-sea" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#3D8FE2" /><stop offset=".85" stop-color="#4C9DE8" /><stop offset="1" stop-color="#5ED8E8" />
    </linearGradient>
    <linearGradient id="rg-grass" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#6DC452" /><stop offset=".45" stop-color="#7CCF5E" /><stop offset="1" stop-color="#5DBE4A" />
    </linearGradient>
    <radialGradient id="rg-sh"><stop offset=".3" stop-color="rgba(34,74,28,.34)" /><stop offset="1" stop-color="rgba(34,74,28,0)" /></radialGradient>
    <clipPath id="rg-grass-clip"><rect x={land.x + 10} y={land.y + 10} width={land.w - 20} height={beachTop - land.y - 10} rx="58" /></clipPath>
    <g id="roll-ground">
      <rect x={X0} y="0" width={W} height={ZMAX + 40} fill="url(#rg-sea)" />
      <!-- the shallow ring and the beach -->
      <rect x={land.x - 22} y={land.y - 22} width={land.w + 44} height={land.h + 44} rx="90" fill="#5ED8E8" opacity=".75" />
      <rect x={land.x - 7} y={land.y - 7} width={land.w + 14} height={land.h + 12} rx="76" fill="none" stroke="#FFFFFF" stroke-width="3" opacity=".85" />
      <rect x={land.x} y={land.y} width={land.w} height={land.h} rx="70" fill="#F4D184" />
      <!-- the grass: everything but the front beach and a sandy rim -->
      <rect x={land.x + 10} y={land.y + 10} width={land.w - 20} height={beachTop - land.y - 10} rx="58" fill="url(#rg-grass)" />
      <g fill="rgba(30,90,30,.07)" clip-path="url(#rg-grass-clip)">
        {#each checker as [x, y] (x + ',' + y)}<rect {x} {y} width={TILE} height={TILE} />{/each}
      </g>
      <g fill="#8ED96C" opacity=".8" clip-path="url(#rg-grass-clip)">
        {#each flecks as pts, i (i)}<polygon points={pts} fill={i % 3 ? '#8ED96C' : '#46A23A'} />{/each}
      </g>
      <!-- the plaza, the path, the pond -->
      <ellipse cx={PLAZA.x} cy={Y(PLAZA.z)} rx={PLAZA.rx} ry={PLAZA.rz} fill="#E6D6A8" />
      <ellipse cx={PLAZA.x} cy={Y(PLAZA.z)} rx={PLAZA.rx - 14} ry={PLAZA.rz - 12} fill="none" stroke="#D3BF88" stroke-width="2" stroke-dasharray="10 8" />
      <path d={pathD} fill="none" stroke="#D9BE80" stroke-width="38" stroke-linecap="round" stroke-linejoin="round" />
      <path d={pathD} fill="none" stroke="#E9D39C" stroke-width="28" stroke-linecap="round" stroke-linejoin="round" />
      <rect x={MUSEUM_AT.x - MUSEUM_AT.w / 2 - 6} y={Y(MUSEUM_AT.z + MUSEUM_AT.depth)} width={MUSEUM_AT.w + 12} height={MUSEUM_AT.depth + 8} rx="6" fill="#CDBB8E" />
      <ellipse cx={POND.x} cy={Y(POND.z) + 1} rx={POND.rx + 4} ry={POND.rz + 3} fill="#CDB37C" />
      <ellipse cx={POND.x} cy={Y(POND.z)} rx={POND.rx} ry={POND.rz} fill="#46ACD3" />
      <ellipse cx={POND.x} cy={Y(POND.z) - POND.rz * 0.55} rx={POND.rx * 0.95} ry={POND.rz * 0.4} fill="rgba(30,80,120,.25)" />
      <!-- the back cliff's rim -->
      <rect x={land.x + 30} y={land.y + 2} width={land.w - 60} height="6" rx="3" fill="#C98B52" opacity=".6" />
      <!-- contact shadows of the still things -->
      {#each shadows as s, i (i)}<ellipse cx={s.x} cy={s.y} rx={s.rx} ry={s.ry} fill="url(#rg-sh)" />{/each}
    </g>
  </defs>
</svg>

<style>
  .defs { position: absolute; width: 0; height: 0; overflow: hidden; }
</style>
