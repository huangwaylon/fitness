<script lang="ts">
  // ききみみ's always-loaded host (docs/kikimimi.md "UI details"), in the island scene: the game's sheet, its own chunk,
  // mounted from its first opening (the menu's pill: invite.svelte.ts openQuiz).
  import { loadKikimimi as loadSheet } from '../island/sheetChunks.ts';
  import { voiceSession } from '#lib/sound/sound.svelte.ts';
  import { quiz } from './invite.svelte.ts';

  let Sheet = $state.raw<typeof import('./KikimimiSheet.svelte').default | null>(null);

  // The sheet's chunk from its first opening; failed to load (offline, a deploy's moment): not open (the voice session
  // the tap began ended, the island uncovered), and the next tap tries again.
  $effect(() => {
    if (!quiz.mounted || Sheet) return;
    loadSheet().then(
      (m) => (Sheet = m.default),
      () => {
        quiz.open = quiz.mounted = false;
        voiceSession(false);
      }
    );
  });
</script>

{#if Sheet}<Sheet bind:open={quiz.open} />{/if}
