<script lang="ts">
  // 「👀 前の問題」 (docs/kikimimi.md "The game"): from round 2 on, a chip that opens the previous round's review on this phone
  // alone (the game goes on: its clip and clock, the live timer bar on the card), so a reveal skipped by mistake can still
  // be read and heard. The game's own review row (`row`, opened: the results' look), else the line, its Japanese and
  // note. Its ▶︎ is a review's play (game.hear: never the round's replay), off while the round's clip plays or another
  // phone speaks for this one (音を1台にまとめる).
  import type { Snippet } from 'svelte';
  import type { QuizGame } from '../game.svelte.ts';
  import Sheet from '../../ui/Sheet.svelte';
  import HearButton from './HearButton.svelte';
  import Note from './Note.svelte';
  import { t } from '#lib/i18n/index.ts';

  let { game, row }: { game: QuizGame; row?: Snippet<[number, boolean]> } = $props();
  const v = $derived(game.view);
  const i = $derived(v.i - 1);
  const it = $derived(game.items[i]);
  let open = $state(false);
  const canHear = $derived(!game.listenOnly && v.phase !== 'lead' && v.phase !== 'play' && !(game.sounding && game.sounding.i === v.i));
  // (a new round keeps the card on the one before it: closed, so it never changes under the eyes)
  $effect(() => {
    void i; // (a derived: the view itself is new at each refresh)
    open = false;
  });
</script>

{#if i >= 0 && it}
  <button type="button" class="chip prev" data-kiki-prev aria-label={t('kiki.prevQAsk')} data-sfx="open" onclick={() => (open = true)}><span aria-hidden="true">👀</span> {t('kiki.prevQ')}</button>
  <Sheet bind:open title={t('kiki.prevQ')}>
    <div class="card-body" data-kiki-prev-card={i}>
      {#if v.phase === 'answer' && Number.isFinite(v.limit)}
        <span class="timer" aria-hidden="true">{#key `${v.i}:${v.playEnd}`}<i style:animation-duration="{Math.max(1, v.limit - v.playEnd)}ms" style:animation-delay="{-Math.max(0, game.now - v.playEnd)}ms"></i>{/key}</span>
      {/if}
      {#if row}
        <ul class="rows">{@render row(i, canHear)}</ul>
      {:else}
        <div class="plain card">
          <div class="head">
            <HearButton data-kiki-hear={i} aria-disabled={!canHear} onclick={() => canHear && game.hear(it)} />
            <p class="en" lang="en">{it.en}</p>
          </div>
          {#if it.ja}<p class="ja">{it.ja}</p>{/if}
          {#if it.note}<Note text={it.note} />{/if}
        </div>
      {/if}
    </div>
  </Sheet>
{/if}

<style>
  .prev { position: absolute; left: 0; top: 50%; translate: 0 -50%; min-height: 32px; font: 700 var(--fs-s)/1 var(--font-ui); }
  /* the chip's 44 px target round its 32 px face */
  .prev::after { content: ''; position: absolute; inset: -6px; }
  .card-body { display: grid; gap: 12px; padding-bottom: 8px; }
  .rows { list-style: none; margin: 0; padding: 0; }
  .timer { display: block; height: 6px; border-radius: var(--r-pill); background: var(--ctl-off); overflow: hidden; }
  .timer i { display: block; height: 100%; background: var(--c-yuzu); transform-origin: 0 50%; animation: shrink linear both; }
  .plain { display: grid; gap: 8px; padding: 12px 14px; }
  .head { display: flex; align-items: center; gap: 10px; }
  .en { margin: 0; font: 700 max(17px, var(--fs-body))/1.4 var(--font-ui); }
  .ja { margin: 0; font: 700 var(--fs-s)/1.45 var(--font-ui); color: var(--text-soft); }
  @keyframes shrink { from { transform: scaleX(1); } to { transform: scaleX(0); } }
</style>
