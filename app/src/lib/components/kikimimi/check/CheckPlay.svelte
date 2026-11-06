<script lang="ts">
  // A round of みみ チェック (games/check/lane.ts's play view, its own chunk): the round itself (Play), its verdict plain
  // (no score), under the check's way-through bar (about 12: it may stop sooner).
  import Play from '../Play.svelte';
  import type { QuizGame } from '../game.svelte.ts';
  import { CHECK_MAX } from '#lib/kikimimi/games/check/def.ts';

  let { game }: { game: QuizGame } = $props();
  const i = $derived(game.view.i);
</script>

{#snippet bar()}
  <div class="checkbar" data-kiki-check-bar={i}><span style:width="{Math.min(100, Math.round((100 * (i + 1)) / CHECK_MAX))}%"></span></div>
{/snippet}

<Play {game} show={bar} plain />

<style>
  .checkbar { height: 8px; margin: 0 6px; border-radius: var(--r-pill); background: var(--ctl-off); overflow: hidden; }
  .checkbar span { display: block; height: 100%; border-radius: inherit; background: var(--c-leaf); transition: width var(--dur-base) var(--ease-out, ease-out); }
</style>
