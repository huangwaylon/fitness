<script lang="ts">
  // A round of みみ チェック (games/check/lane.ts's play view, its own chunk): the round itself (Play), its verdict plain
  // (no score), under the check's way-through bar (about 12: it may stop sooner).
  import Play from '../Play.svelte';
  import ProgressBar from '../../ui/ProgressBar.svelte';
  import type { QuizGame } from '../game.svelte.ts';
  import { CHECK_MAX } from '#lib/kikimimi/games/check/def.ts';

  let { game }: { game: QuizGame } = $props();
  const i = $derived(game.view.i);
</script>

{#snippet bar()}
  <div class="checkbar" data-kiki-check-bar={i}><ProgressBar value={i + 1} max={CHECK_MAX} decor /></div>
{/snippet}

<Play {game} show={bar} plain />

<style>
  .checkbar { display: flex; margin: 0 6px; }
</style>
