<script lang="ts">
  // A play's page in これまでの記録 (docs/english.md "Progress"): its day, the clip, then its questions from the clip's
  // bank (fetched alone), ふりかえれる場面 (the ones not heard in full the first time; shown first when there are any) or
  // すべて: each its stem, 「答えはこれ」 and the right choice (never what was picked), the line, 意味 and 使えるフレーズ; a
  // retired question its line, 意味 and phrase only. No player here: もう一度（新しい質問） opens the lesson (its ‹ back here).
  // A clip gone from the library: said quietly, nothing to open; a play not found, or its questions all gone from the
  // bank: a note, never a blank page.
  import { untrack } from 'svelte';
  import NavBar from '#lib/components/ui/NavBar.svelte';
  import ChipRow from '#lib/components/ui/ChipRow.svelte';
  import Chip from '#lib/components/ui/Chip.svelte';
  import LoadError from '#lib/components/ui/LoadError.svelte';
  import Icon from '#lib/components/ui/Icon.svelte';
  import Phrases from '#lib/components/ui/Phrases.svelte';
  import KeyedText from './KeyedText.svelte';
  import { week } from '#lib/store/week.svelte.ts';
  import { formatDate } from '#lib/i18n/format.ts';
  import { bankNow, loadBank, metaById } from '../data.ts';
  import { missesOf, playsOf } from '../progress.ts';
  import { s } from '../i18n.ts';
  import type { Bank, Question } from '../types.ts';
  import type { Who } from '#lib/types.ts';

  let { key, onagain, onback, onclose }: { key: string; onagain: (id: string) => void; onback: () => void; onclose: () => void } = $props();

  const me = $derived<Who>(week.model?.me ?? 'A');
  const play = $derived(playsOf(week.model?.state.listen ?? [], me).find((p) => p.key === key));
  const clip = $derived(play ? metaById(play.u) : undefined);
  const misses = $derived(new Set(play ? missesOf(play) : []));
  /** すべて (else ふりかえれる場面): the chip picked, else by default when there's nothing to look back on. */
  let picked = $state<boolean | null>(null);
  const all = $derived(picked ?? misses.size === 0);

  let bank = $state.raw<Bank | null>(null);
  let failed = $state(false);
  function fetchBank(): void {
    const c = clip;
    if (!c) return;
    failed = false;
    loadBank(c).then((b) => clip?.id === b.id && (bank = b), () => (failed = true));
  }
  // the clip's bank once its play is known (the model may come in after this page)
  const clipId = $derived(clip?.id);
  $effect(() => {
    if (!clipId) return;
    untrack(() => {
      const now = bankNow(clip!);
      if (now) bank = now;
      else fetchBank();
    });
  });
  /** The play's questions as shown (its order), each found in the bank (a retired one: its phrase only). */
  const items = $derived.by(() => {
    if (!bank || !play) return [];
    const by = new Map(bank.questions.map((x) => [x.id, x]));
    return play.r.flatMap(([id, ok]) => (all || !ok) && by.has(id) ? [by.get(id)!] : []);
  });
  const answerOf = (x: Question) => (x.choices && x.a !== undefined ? x.choices[x.a] : x.answer);
</script>

<section class="screen" data-en-hist-play={key}>
  <div class="top">
    <NavBar pad title={s('history')} {onback} {onclose} />
    {#if play && misses.size}
      <ChipRow label={s('histFilter')}>
        <Chip label={s('histMissChip')} count={misses.size} selected={!all} data-en-hist-chip="miss" onclick={() => (picked = false)} />
        <Chip label={s('libAll')} count={play.r.length} selected={all} data-en-hist-chip="all" onclick={() => (picked = true)} />
      </ChipRow>
    {/if}
  </div>
  <div class="body sheet-scroll">
    {#if play}
      <header class="head">
        <p class="sub">{formatDate(play.d)}{#if !play.f} · {s('histPart')}{/if}</p>
        <h3 lang={clip ? 'en' : undefined}>{clip ? clip.title : s('histGone')}</h3>
      </header>
      {#if clip}
        {#if failed}
          <LoadError text={navigator.onLine ? s('bankFailed') : s('bankOffline')} onretry={fetchBank} data-en-bank="failed" />
        {:else if !bank}
          <p class="card pad sub" aria-live="polite">{s('loading')}</p>
        {:else if !play.r.length}
          <p class="card pad sub" data-en-hist-note><Phrases text={s('histNone')} /></p>
        {:else if !items.length}
          <p class="card pad sub" data-en-hist-note><Phrases text={s('histQsGone')} /></p>
        {:else}
          {#each items as x (x.id)}
            <article class="card pad item" data-en-hist-q={x.id} data-miss={misses.has(x.id) || undefined}>
              {#if !x.retired}
                <p class="sub">{s(`skill.${x.skill}`)}</p>
                <p class="stem" lang="en"><b><KeyedText text={x.stem} /></b></p>
                {#if x.ja}<p class="sub">{x.ja}</p>{/if}
                {#if answerOf(x)}<p class="ans" data-en-hist-ans><b>{s('shown')}</b><span lang="en">{answerOf(x)}</span></p>{/if}
              {/if}
              {#if x.line}<p class="line" lang="en"><KeyedText text={x.line} /></p>{/if}
              <dl class="why"><dt>{s('mean')}</dt><dd>{x.mean}</dd></dl>
              <p class="phrase"><b>{s('use')}</b> <span lang="en">{x.use}</span></p>
            </article>
          {/each}
        {/if}
        <button type="button" class="btn again" data-sfx="open" data-en-hist-again onclick={() => onagain(clip.id)}><Icon name="play" />{s('again')}</button>
      {/if}
    {:else}
      <p class="card pad sub" data-en-hist-note><Phrases text={s('histLost')} /></p>
    {/if}
  </div>
</section>

<style>
  .screen { position: absolute; inset: 0; display: flex; flex-direction: column; background: var(--surface); }
  .top { flex: none; background-color: var(--surface); }
  .body { display: flex; flex-direction: column; gap: 10px; padding: 4px calc(12px + var(--safe-right)) calc(var(--safe-bottom) + 24px) calc(12px + var(--safe-left)); scrollbar-width: none; }
  .head { padding: 4px 4px 0; }
  .head p, .head h3 { margin: 0; }
  .head h3 { font: 700 var(--fs-talk)/1.3 var(--font-ui); }
  .card { flex: none; margin: 0; }
  .item { display: grid; gap: 6px; }
  .item p { margin: 0; }
  .sub { font-size: var(--fs-s); color: var(--text-soft); }
  .stem { font-size: var(--fs-body); line-height: 1.45; }
  /* 答えはこれ: the kit's ok card, as the lesson's reveal */
  .ans { display: grid; gap: 2px; padding: 8px 10px; border-radius: var(--r-row); background: var(--ok-bg); box-shadow: inset 0 0 0 2px var(--ok-edge); font-size: var(--fs-body); }
  .ans b { font: 700 var(--fs-s)/1.4 var(--font-ui); color: var(--leaf-text); }
  .line { font-style: italic; }
  .why { margin: 0; display: grid; gap: 2px; font-size: var(--fs-body); }
  .why dt { font: 700 var(--fs-s)/1.4 var(--font-ui); color: var(--text-soft); }
  .why dd { margin: 0; }
  .phrase { padding: 8px 10px; border-radius: var(--r-row); background: var(--surface); font-size: var(--fs-body); }
  .phrase b { font: 700 var(--fs-s)/1.4 var(--font-ui); color: var(--text-soft); margin-right: 4px; }
  .again { margin-top: 6px; }
</style>
