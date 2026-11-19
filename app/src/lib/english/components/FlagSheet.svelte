<script lang="ts">
  // ⚑ 報告's sheet (docs/english.md "Flags"): 「どこが気になった？」, the kind chips (その他 by default), an optional
  // note, 送る; then 「ありがとう！」. Nothing is required. Over the lesson, a paper sheet.
  import Sheet from '#lib/components/ui/Sheet.svelte';
  import { EFLAG_KINDS, EFLAG_NOTE, type EflagKind } from '#lib/contract/eflag.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { flagData } from '../flags.ts';
  import { s } from '../i18n.ts';
  import { t } from '#lib/i18n/index.ts';
  import Phrases from '#lib/components/ui/Phrases.svelte';
  import type { ClipMeta } from '../catalog.ts';
  import type { Question } from '../types.ts';

  interface Props {
    open: boolean;
    clip: Pick<ClipMeta, 'id' | 'v'>;
    /** The question, or null: the clip. */
    q: Question | null;
    /** Its place in the lesson (0-based), as shown. */
    n: number | null;
    /** The player's time now, s (null: none). */
    time: () => number | null;
    /** Opened from ツール: ‹ back there. */
    onback?: (() => void) | null;
  }
  let { open = $bindable(), clip, q, n, time, onback = null }: Props = $props();
  let kind = $state<EflagKind>('other');
  let note = $state('');
  let done = $state(false);
  // each opening a fresh form
  $effect(() => {
    if (open) {
      kind = 'other';
      note = '';
      done = false;
    }
  });
  function send() {
    week.send('eflag', flagData(clip, q, kind, note, time()) as unknown as Record<string, unknown>);
    done = true;
  }
</script>

<!-- (sent: ✕ and 閉じる, no ‹ back into the sent form) -->
<Sheet bind:open title={s('flag')} onback={done ? null : onback} name="english-flag">
  <div class="fl" data-en-flag-sheet={n ?? 'clip'}>
    {#if done}
      <p class="thanks" data-en-flag-thanks><Phrases text={s('flagThanks')} /></p>
      <button type="button" class="btn paper" data-sfx="back" onclick={() => (open = false)}>{t('common.close')}</button>
    {:else}
      <p class="head"><b>{s('flagHead')}</b><br /><span class="meta">{#if q}{s('flagQ', { i: (n ?? 0) + 1, stem: '' })}<span lang="en">{q.stem.replaceAll('*', '')}</span>{:else}{s('flagClip')}{/if}</span></p>
      <div class="chips" role="radiogroup" aria-label={s('flagHead')}>
        {#each EFLAG_KINDS as k (k)}
          <button type="button" class="chip big" role="radio" aria-checked={kind === k} data-sfx="none" data-en-kind={k} onclick={() => (kind = k)}>{s(`kind.${k}`)}</button>
        {/each}
      </div>
      <input type="text" class="input" bind:value={note} maxlength={EFLAG_NOTE} placeholder={s('flagNote')} aria-label={s('flagNote')} data-en-flag-note />
      <button type="button" class="btn" data-sfx="open" data-en-flag-send onclick={send}>{s('flagSend')}</button>
    {/if}
  </div>
</Sheet>

<style>
  .fl { display: grid; gap: 12px; padding-bottom: calc(var(--safe-bottom) + 8px); }
  .head { margin: 0; }
  .meta { font-size: var(--fs-s); color: var(--text-soft); }
  .chips { display: flex; flex-wrap: wrap; gap: 8px; }
  .thanks { margin: 0; font-weight: 700; }
  .btn { margin: 0; }
</style>
