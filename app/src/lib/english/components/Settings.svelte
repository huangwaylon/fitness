<script lang="ts">
  // English Study's ⚙ (docs/english.md "Flags"): 報告した内容, every flag on the island (everyone's: it's shared content),
  // newest first, 確認待ち or the review's outcome and note.
  import NavBar from '#lib/components/ui/NavBar.svelte';
  import { week } from '#lib/store/week.svelte.ts';
  import { CLIPS } from '../clips/index.ts';
  import { flagsOf } from '../flags.ts';
  import { s } from '../i18n.ts';

  let { onback, onclose }: { onback: () => void; onclose: () => void } = $props();
  const flags = $derived(flagsOf(week.model?.state.eflag ?? []));
  const open = $derived(flags.filter((f) => !f.done).length);
  const when = new Intl.DateTimeFormat('ja-JP', { timeZone: 'Asia/Tokyo', dateStyle: 'short', timeStyle: 'short' });
  const formatWhen = (iso: string) => (iso ? when.format(new Date(iso)) : '');
  const titleOf = (id: string) => CLIPS.find((c) => c.id === id)?.title ?? id;
</script>

<section class="screen" data-en-settings>
  <div class="top"><NavBar pad title={s('settings')} {onback} {onclose} /></div>
  <div class="body sheet-scroll">
    <h3 class="sec-label">{s('flags')}{#if open}<span class="n"> · {s('flagsOpen', { n: open })}</span>{/if}</h3>
    {#if flags.length}
      <div class="card dense" role="list" data-en-flags>
        {#each flags as f (f.id)}
          <div class="row item" role="listitem" data-en-flag-row={f.done ? f.done.outcome : 'open'}>
            <p class="state">{f.done ? (f.done.outcome === 'fixed' ? s('flagFixed') : s('flagKept')) : s('flagOpen')}{#if f.done?.note}<span class="soft">「{f.done.note}」</span>{/if}</p>
            <p>{s(`kind.${f.flag.kind}`)} · {titleOf(f.flag.item)} · {f.flag.q === null ? s('flagWhereClip') : s('flagWhere', { i: f.flag.q + 1 })}</p>
            {#if f.flag.note}<p class="soft">「{f.flag.note}」</p>{/if}
            <p class="soft">{formatWhen(f.at)}</p>
          </div>
        {/each}
      </div>
    {:else}
      <p class="none">{s('flagsNone')}</p>
    {/if}
  </div>
</section>

<style>
  .screen { position: absolute; inset: 0; display: flex; flex-direction: column; background: var(--surface); }
  .top { flex: none; background-color: var(--surface); }
  .body { display: flex; flex-direction: column; gap: 8px; padding: 4px calc(12px + var(--safe-right)) calc(var(--safe-bottom) + 24px) calc(12px + var(--safe-left)); scrollbar-width: none; }
  .n { font-weight: 700; }
  .item { display: grid !important; gap: 2px; }
  .item p { margin: 0; font-size: var(--fs-body); }
  .state { font-weight: 700; }
  .soft { font-size: var(--fs-s) !important; color: var(--text-soft); margin-left: 4px; }
  .none { margin: 4px; color: var(--text-soft); }
</style>
