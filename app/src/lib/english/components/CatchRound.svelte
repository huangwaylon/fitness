<script lang="ts">
  // 聞き取りチャレンジ at a lesson's まとめ (docs/english.md "Catch the line"): the clip's lines not on the shelf yet, ones
  // this play didn't ask about first (catch.ts lessonLines), PER_LESSON at most, one at a time on the lesson's own
  // player. Each caught goes on 聞けたセリフ (shelf.ts) with how; then 次のセリフ, and after the last a line saying so.
  // None (no caption-checked line, or all on the shelf): nothing at all. Picked once, as the lesson reached まとめ.
  import { untrack } from 'svelte';
  import CatchLine from './CatchLine.svelte';
  import Phrases from '#lib/components/ui/Phrases.svelte';
  import { lessonLines, type How } from '../catch.ts';
  import { saveShelf, shelfOf, shelved } from '../shelf.ts';
  import { count } from '#lib/sync/log.ts';
  import { s } from '../i18n.ts';
  import type { YtPlayer } from '../player.svelte.ts';
  import type { Bank } from '../types.ts';
  import type { LocalDate, Who } from '#lib/types.ts';

  let { bank, title, player, drawn, seed, who, today, onshelf }: {
    bank: Bank; title: string; player: YtPlayer | undefined; drawn: ReadonlySet<string>; seed: string; who: Who; today: LocalDate; onshelf?: () => void;
  } = $props();

  const lines = untrack(() => {
    const shelf = shelfOf(who);
    return lessonLines(bank.catch, (q) => !!shelf.lines[`${bank.id}/${q}`], drawn, seed);
  });
  let i = $state(0);
  let caught = $state(false);
  const line = $derived(lines[i]);

  function got(h: How): void {
    caught = true;
    saveShelf(who, shelved(shelfOf(who), `${bank.id}/${line.q}`, { video: bank.video, title, line }, today, h));
    count('act:english.catch.done');
  }
  const next = () => ((i += 1), (caught = false));
</script>

{#if line}
  {#key i}
    <CatchLine {line} {player} seed={`${seed}:${line.q}`} oncaught={got}>
      {#snippet head()}
        <p class="kicker"><span>{s('catchTitle')}</span><span class="n">{s('catchN', { i: i + 1, n: lines.length })}</span></p>
      {/snippet}
      {#snippet after()}
        {#if caught && i < lines.length - 1}
          <button type="button" class="btn" data-sfx="page" data-en-catch-next onclick={next}>{s('catchNext')}</button>
        {:else if caught}
          <p class="saved" data-en-catch-saved><Phrases text={s('catchSaved')} /></p>
          {#if onshelf}<button type="button" class="text-link" data-sfx="page" data-en-catch-shelf onclick={onshelf}>{s('catchShelf')}</button>{/if}
        {/if}
      {/snippet}
    </CatchLine>
  {/key}
{/if}

<style>
  .kicker { margin: 0; display: flex; justify-content: space-between; font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); }
  .n { font-family: var(--font-num); font-variant-numeric: tabular-nums; }
  .btn { margin: 0; }
  .saved { margin: 0; font-size: var(--fs-s); color: var(--text-soft); }
  .text-link { justify-self: start; margin: -10px 0; }
</style>
