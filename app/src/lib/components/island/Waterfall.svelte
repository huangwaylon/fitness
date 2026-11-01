<script lang="ts">
  // The waterfall over the cliff (docs/design.md "World", spec §5): an upright sprite `w` u wide (world.ts CLIFF.fall
  // plus its spill, over the face sprite's wet niche) and `h` u tall (the face plus the lip where the river tips over),
  // its foot standing on the baked plunge pool at z 1806. Layered translucent sheets (#7FC6F0 → #E8F7FF): a darker back sheet, the main
  // sheet and a thin bright front veil, streaks running down at three depths (0.9 s loops), a rolling lip, a churning
  // foam pool at the foot, spray flicking up and mist puffs drifting off (2.2 s). CSS only (transform and opacity),
  // paused under a sheet or while hidden.
  let { night = false, w = 52, h = 45 }: { night?: boolean; w?: number; h?: number } = $props();
  /** The parts below are laid out on a 40u-wide fall: across, they scale to `w`. */
  const k = $derived(w / 40);

  const rnd = (i: number) => {
    const s = Math.sin(i * 91.345 + 12.17) * 43758.5453;
    return s - Math.floor(s);
  };
  /** Streak columns [x (u, inside the 32u sheet), length, offset in the 26u period, width] at each depth. */
  const layer = (n: number, seed: number, l0: number, l1: number, w0: number, w1: number) =>
    Array.from({ length: n }, (_, i) => [2 + rnd(i + seed) * 28, l0 + rnd(i + seed + 40) * (l1 - l0), rnd(i + seed + 80) * 26, w0 + rnd(i + seed + 120) * (w1 - w0)] as const);
  const BACK = layer(14, 400, 10, 20, 1.4, 2.6);
  const MID = layer(20, 0, 6, 14, 0.6, 1.3);
  const FRONT = layer(12, 200, 3, 7, 0.35, 0.7);
  const PERIODS = [-26, 0, 26, 52, 78];
  /** Spray droplets at the foot: [x (u, 0…40), delay (s), drift (u)]. */
  const SPRAY = Array.from({ length: 16 }, (_, i) => [3 + rnd(i + 600) * 34, -rnd(i + 640) * 0.9, (rnd(i + 680) - 0.5) * 8] as const);
</script>

<div class="fall" class:night aria-hidden="true" style:--fw={w} style:--fh={h}>
  <div class="sheet">
    <i class="body"></i>
    <!-- a slow translucent curtain over the body, so the water reads in layers -->
    <i class="veil"></i><i class="veil two"></i>
    {#each [['back', BACK], ['mid', MID], ['front', FRONT]] as const as [k, cols] (k)}
      <svg class="streaks {k}" viewBox="0 0 32 104" preserveAspectRatio="none">
        {#each PERIODS as t (t)}
          {#each cols as [x, l, o, w], i (i)}
            <rect x={x - w / 2} y={o + t} width={w} height={l} rx={w / 2} />
          {/each}
        {/each}
      </svg>
    {/each}
    <i class="edges"></i>
  </div>
  <!-- the lip: the river rolling over the edge -->
  <i class="lip"></i>
  <i class="lip-shine"></i>
  <!-- the foam pool at the foot -->
  <i class="pool"></i>
  <div class="foot">
    {#each [[2, 9, 4.4, 0], [8, 11, 6, -0.5], [14, 10, 5, -0.2], [20, 13, 7, -0.7], [26, 10, 5, -0.35], [32, 11, 6, -0.1], [38, 9, 4.4, -0.6], [11, 7, 3.6, -0.25], [29, 7, 3.6, -0.8]] as [x, s, hh, d], i (i)}
      <i class="froth" style:left="calc({x * k} * var(--u))" style:width="calc({s * k} * var(--u))" style:height="calc({hh} * var(--u))" style:bottom="calc({i > 6 ? 3 : 0.5} * var(--u))" style:animation-delay="{d}s"></i>
    {/each}
  </div>
  {#each SPRAY as [x, d, dx], i (i)}
    <i class="spray" style:left="calc({x * k} * var(--u))" style:--dx="calc({dx} * var(--u))" style:animation-delay="{d}s"></i>
  {/each}
  {#each [[0, 0], [14, -0.75], [27, -1.5], [40, -0.4], [20, -1.1], [6, -1.8], [34, -0.2]] as [x, d], i (i)}
    <i class="mist" style:left="calc({x * k} * var(--u))" style:animation-delay="{d}s"></i>
  {/each}
</div>

<style>
  .fall { position: relative; width: calc(var(--fw) * var(--u)); height: calc(var(--fh) * var(--u)); pointer-events: none; }
  .fall i { position: absolute; display: block; }
  /* the falling water: 32u wide in the niche's middle, from the lip down to the pool */
  .sheet {
    position: absolute; left: calc(4 * var(--u)); width: calc((var(--fw) - 8) * var(--u)); top: calc(2.5 * var(--u)); bottom: calc(2 * var(--u));
    overflow: hidden;
    -webkit-mask-image: linear-gradient(90deg, transparent, #000 14%, #000 86%, transparent);
    mask-image: linear-gradient(90deg, transparent, #000 14%, #000 86%, transparent);
  }
  .body { inset: 0; background: linear-gradient(180deg, #A8DCF7 0%, #7FC6F0 12%, #86CAF1 45%, #AEDDF6 75%, #E8F7FF 100%); opacity: .88; }
  .night .body { background: linear-gradient(180deg, #7FB0D8 0%, #4F8FC6 12%, #5592C6 45%, #78A9D2 75%, #B8D8EE 100%); }
  .edges { inset: 0; background: linear-gradient(90deg, rgba(40, 90, 130, .22), rgba(60, 120, 170, .08) 16%, transparent 30%, transparent 72%, rgba(60, 120, 170, .08) 84%, rgba(40, 90, 130, .26)); }
  .streaks { position: absolute; left: 0; top: calc(-26 * var(--u)); width: 100%; height: calc(104 * var(--u)); animation: fall-streak .9s linear infinite; }
  .veil {
    left: 0; right: 0; top: -60%; height: 60%; animation: fall-veil 2.6s linear infinite;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0), rgba(235, 248, 255, .32) 45%, rgba(255, 255, 255, 0));
  }
  .veil.two { animation-duration: 3.4s; animation-delay: -1.5s; opacity: .7; }
  @keyframes fall-veil { from { transform: translateY(0); } to { transform: translateY(270%); } }
  .streaks.back { fill: #4E9FD8; opacity: .45; animation-duration: 1.35s; }
  .streaks.mid { fill: #FFFFFF; opacity: .7; }
  .streaks.front { fill: #FFFFFF; opacity: .9; animation-duration: .6s; }
  .night .streaks.mid, .night .streaks.front { fill: #DCEBFA; }
  @keyframes fall-streak { from { transform: translateY(0); } to { transform: translateY(calc(26 * var(--u))); } }
  .lip {
    left: calc(3 * var(--u)); width: calc((var(--fw) - 6) * var(--u)); top: 0; height: calc(5 * var(--u)); border-radius: 50% 50% 30% 30% / 70% 70% 30% 30%;
    background: linear-gradient(180deg, #E8F7FF, #BFE6FA 45%, rgba(127, 198, 240, .6) 75%, rgba(127, 198, 240, 0));
  }
  .lip-shine {
    left: calc(7 * var(--u)); width: calc((var(--fw) - 14) * var(--u)); top: calc(.8 * var(--u)); height: calc(1.2 * var(--u)); border-radius: 50%;
    background: rgba(255, 255, 255, .85); animation: fall-shine 1.8s ease-in-out infinite alternate;
  }
  @keyframes fall-shine { from { opacity: .5; transform: scaleX(.9); } to { opacity: 1; transform: scaleX(1.04); } }
  .pool {
    left: calc(-5 * var(--u)); right: calc(-5 * var(--u)); bottom: calc(-2.5 * var(--u)); height: calc(9 * var(--u)); border-radius: 50%;
    background: radial-gradient(ellipse at 50% 45%, rgba(255, 255, 255, .95) 0 30%, rgba(225, 244, 255, .75) 52%, rgba(200, 235, 250, 0) 72%);
  }
  .foot { position: absolute; left: 0; right: 0; bottom: calc(-1 * var(--u)); height: calc(8 * var(--u)); }
  .froth {
    translate: -50% 0; border-radius: 50%;
    background: radial-gradient(ellipse at 42% 38%, #FFFFFF 0 32%, rgba(236, 248, 255, .8) 52%, rgba(232, 247, 255, 0) 71%);
    animation: fall-froth .9s ease-in-out infinite alternate;
  }
  @keyframes fall-froth { from { transform: scale(.88, .82); opacity: .85; } to { transform: scale(1.1, 1.14); opacity: 1; } }
  .spray {
    bottom: calc(3 * var(--u)); width: calc(1.3 * var(--u)); height: calc(1.3 * var(--u)); border-radius: 50%; background: #FFFFFF;
    opacity: 0; animation: fall-spray .9s ease-out infinite;
  }
  @keyframes fall-spray {
    0% { transform: translate(0, 0) scale(.6); opacity: 0; }
    15% { opacity: .95; }
    100% { transform: translate(var(--dx), calc(-7 * var(--u))) scale(.2); opacity: 0; }
  }
  .mist {
    bottom: calc(1 * var(--u)); width: calc(14 * var(--u)); height: calc(14 * var(--u)); translate: -50% 0; border-radius: 50%;
    background: radial-gradient(circle, rgba(255, 255, 255, .7), rgba(255, 255, 255, .25) 45%, rgba(255, 255, 255, 0) 70%);
    opacity: 0; animation: fall-mist 2.2s ease-out infinite;
  }
  .night .mist { background: radial-gradient(circle, rgba(220, 235, 255, .45), rgba(220, 235, 255, .15) 45%, rgba(220, 235, 255, 0) 70%); }
  @keyframes fall-mist {
    0% { transform: translateY(0) scale(.45); opacity: 0; }
    20% { opacity: .9; }
    100% { transform: translateY(calc(-16 * var(--u))) scale(1.4); opacity: 0; }
  }
  :global([data-covered]) .fall :is(.streaks, .veil, .froth, .mist, .spray, .lip-shine),
  :global([data-paused]) .fall :is(.streaks, .veil, .froth, .mist, .spray, .lip-shine) { animation-play-state: paused; }
  @media (prefers-reduced-motion: reduce) { .fall :is(.streaks, .veil, .froth, .mist, .spray, .lip-shine) { animation: none; } .spray { display: none; } }
</style>
