<script lang="ts">
  // Villager marks (ours): the bright floating symbols NH villagers show over their heads instead
  // of the player's cat-face icons. Bold colour, a white outline so they read on sky and grass alike.
  //   <Mark id="note" />   ♪♫ · bang ! · question ? · sweat 💦 · heart ♥ · sparkle ✦ · zzz
  import type { MarkId } from '#lib/art.ts';

  let { id }: { id: MarkId } = $props();
  const NOTE1 = 'M9 3 L20 1 V15.5 A3.5 3 0 1 1 17.5 12.6 V5.4 L11.5 6.6 V18 A3.5 3 0 1 1 9 15.1 Z';
  const NOTE2 = 'M10 2 L13 2 L13 15 A4 3.4 0 1 1 10 12 Z M13 2 C16 4 19 5 18 10 C17 7 15 6.5 13 6.5 Z';
  const HEART = 'M12 21 C5 16 1 12 1 7.5 C1 4 3.7 1.5 7 1.5 C9.2 1.5 11 2.8 12 4.6 C13 2.8 14.8 1.5 17 1.5 C20.3 1.5 23 4 23 7.5 C23 12 19 16 12 21 Z';
  const STAR = 'M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0 Z';
  const DROP = 'M5 0 C7 4 10 7 10 9.5 A5 4.5 0 0 1 0 9.5 C0 7 3 4 5 0 Z';
</script>

<svg class="mark" viewBox="0 0 40 40" aria-hidden="true">
  <g class="o">
    {#if id === 'note'}
      <path d={NOTE1} transform="translate(3 9) scale(1.15)" fill="#FF6F91" />
      <path d={NOTE2} transform="translate(21 3) scale(.85)" fill="#3FB0E3" />
    {:else if id === 'bang'}
      <path d="M15 4 Q20 1.5 25 4 L22.4 25 Q20 27 17.6 25 Z" fill="#FF5A4E" />
      <circle cx="20" cy="33" r="4" fill="#FF5A4E" />
    {:else if id === 'question'}
      <path d="M11.5 13 Q11.5 4 20.5 4 Q29 4 29 12 Q29 17 23.5 19.6 Q22.6 20.2 22.6 22 V24.6 H17 V21 Q17 17.2 20.6 15.6 Q23 14.4 23 12 Q23 9.6 20.4 9.6 Q17.6 9.6 17.4 13 Z" fill="#F5A623" />
      <circle cx="19.8" cy="32" r="3.8" fill="#F5A623" />
    {:else if id === 'sweat'}
      <path d={DROP} transform="translate(17 3) scale(1.7)" fill="#4DB4F0" />
      <path d={DROP} transform="translate(5 14) scale(1.15) rotate(-14 5 9)" fill="#7FCBF5" />
      <path d={DROP} transform="translate(26 20) scale(.95) rotate(12 5 9)" fill="#7FCBF5" />
      <ellipse cx="22.5" cy="20" rx="1.8" ry="3" class="hl" fill="#fff" opacity=".8" />
    {:else if id === 'heart'}
      <path d={HEART} transform="translate(6 9) scale(1.2)" fill="#FF5C8A" />
      <path d={HEART} transform="translate(27 2) scale(.42)" fill="#FF8FB0" />
      <ellipse cx="13.5" cy="16" rx="3" ry="2" class="hl" fill="#fff" opacity=".55" transform="rotate(-30 13.5 16)" />
    {:else if id === 'sparkle'}
      <path d={STAR} transform="translate(5 9) scale(1.15)" fill="#FFC93C" />
      <path d={STAR} transform="translate(25 3) scale(.5)" fill="#FFB020" />
      <path d={STAR} transform="translate(27 25) scale(.42)" fill="#FFD966" />
    {:else}
      {#each ['#fff', '#7F8CE6'] as c, i (i)}
        <g fill="none" stroke={c} stroke-width={i ? 3.6 : 7} stroke-linecap="round" stroke-linejoin="round" class="z">
          <path d="M5 24 H15 L5 35 H15" /><path d="M18 13 H26 L18 22 H26" /><path d="M28 4 H34 L28 11 H34" />
        </g>
      {/each}
    {/if}
  </g>
</svg>

<style>
  .mark { display: block; width: 100%; height: 100%; overflow: visible; }
  /* white outline under every shape (NH marks read on any background) */
  .o :global(path), .o :global(circle), .o :global(ellipse) { stroke: #fff; stroke-width: 3px; paint-order: stroke; stroke-linejoin: round; }
  .o .hl { stroke: none; }
  .o .z :global(path) { stroke: inherit; stroke-width: inherit; }
</style>
