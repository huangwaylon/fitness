<script lang="ts">
  // English Study's ⚙ (docs/english.md "Flags"): 難しめの質問を増やす (this phone's: the native tier from a first
  // play, prefs.ts), then 報告した内容, every flag on the island (everyone's: it's shared content), newest first, 確認待ち
  // or the review's outcome and note; 音声認識テスト (the /speech page, while すごろく's speaking step waits on it).
  import NavBar from '#lib/components/ui/NavBar.svelte';
  import Phrases from '#lib/components/ui/Phrases.svelte';
  import Icon from '#lib/components/ui/Icon.svelte';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { week } from '#lib/store/week.svelte.ts';
  import { metaById } from '../data.ts';
  import { flagsOf } from '../flags.ts';
  import { s } from '../i18n.ts';
  import { harderOn, setHarder } from '../prefs.ts';
  import { cue } from '#lib/sound/cues.ts';

  let { onback, onclose }: { onback: () => void; onclose: () => void } = $props();
  const flags = $derived(flagsOf(week.model?.state.eflag ?? []));
  const open = $derived(flags.filter((f) => !f.done).length);
  const when = new Intl.DateTimeFormat('ja-JP', { timeZone: 'Asia/Tokyo', dateStyle: 'short', timeStyle: 'short' });
  const formatWhen = (iso: string) => (iso ? when.format(new Date(iso)) : '');
  /** A flag's question as the flag saw it (its stem). */
  const stemOf = (f: (typeof flags)[number]['flag']) => f.seen?.stem?.replaceAll('*', '') ?? String(f.q);
  const titleOf = (id: string) => metaById(id)?.title ?? id;
  let hard = $state(harderOn());
  function toggleHard(): void {
    cue(hard ? 'toggle-off' : 'toggle-on');
    hard = !hard;
    setHarder(hard);
  }
  /** The speech test on its own page (the sheet closed; the page's query kept, as the board's door does). */
  function toSpeech(): void {
    onclose();
    const q = new URLSearchParams(location.search);
    q.set('from', 'en');
    void goto(`${resolve('/speech')}?${q}`);
  }
</script>

<section class="screen" data-en-settings>
  <div class="top"><NavBar pad title={s('settings')} {onback} {onclose} /></div>
  <div class="body sheet-scroll">
    <button type="button" class="prow" role="switch" aria-checked={hard} data-sfx="self" data-en-hard onclick={toggleHard}>
      <span class="prl">{s('hard')}<small class="lines">{s('hardNote')}</small></span>
      <span class="sw" aria-hidden="true"><i></i></span>
    </button>
    <button type="button" class="prow" data-sfx="open" data-en-speech onclick={toSpeech}>
      <span class="prl">{s('speechTest')}</span><Icon name="chevron-right" size={18} />
    </button>
    <h3 class="sec-label">{s('flags')}{#if open}<span class="n">{` · ${s('flagsOpen', { n: open })}`}</span>{/if}</h3>
    {#if flags.length}
      <div class="card dense" role="list" data-en-flags>
        {#each flags as f (f.id)}
          <div class="row item" role="listitem" data-en-flag-row={f.done ? f.done.outcome : 'open'}>
            <p class="state">{f.done ? (f.done.outcome === 'fixed' ? s('flagFixed') : s('flagKept')) : s('flagOpen')}{#if f.done?.note}<span class="soft">「{f.done.note}」</span>{/if}</p>
            <p>{s(`kind.${f.flag.kind}`)} · {titleOf(f.flag.item)} · {#if f.flag.q === null}{s('flagWhereClip')}{:else}{s('flagWhereQ')}<span lang="en">{stemOf(f.flag)}</span>{/if}</p>
            {#if f.flag.note}<p class="soft">「{f.flag.note}」</p>{/if}
            <p class="soft">{formatWhen(f.at)}</p>
          </div>
        {/each}
      </div>
    {:else}
      <p class="none"><Phrases text={s('flagsNone')} /></p>
    {/if}
  </div>
</section>

<style>
  .lines { white-space: pre-line; }
  .prow :global(svg) { flex: none; color: var(--text-soft); }
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
