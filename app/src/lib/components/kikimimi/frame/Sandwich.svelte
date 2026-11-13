<script module lang="ts">
  import type { Item } from '#lib/kikimimi/bank.ts';
  /** What サンド plays through: the game's clips (game.svelte.ts QuizGame: a review row's ▶︎ is i -1). */
  export interface SandPlayer {
    hear(it: Item): void;
    clock(): number;
    readonly sounding: { i: number; at: string; from: number } | null;
    readonly talk: { i: number; k: number; at: string; from: number } | null;
  }
</script>

<script lang="ts">
  // よみきき サンド (docs/kikimimi-engine.md "よみきき サンド"): listen → read → listen, in a sheet over the game. The clip blind (no
  // words: it always plays blind first), then its transcript at my own pace (the sound marks, the karaoke as ▶︎ plays it,
  // the Japanese, each choice's cja, 解説), then the clip blind again and one tap: 聞き取れた or まだ. まだ is a mark on this
  // phone (srs.ts, "hard" on its day); 聞き取れた keeps nothing. Lazy: its own chunk (≤ 15 KB, kikimimi-budget.ts).
  import { onMount } from 'svelte';
  import Sheet from '../../ui/Sheet.svelte';
  import Icon from '../../ui/Icon.svelte';
  import Transcript from '../Transcript.svelte';
  import SoundLine from '../scene/SoundLine.svelte';
  import MarkLegend from '../scene/MarkLegend.svelte';
  import Why from './Why.svelte';
  import { PIC_JA, isDialogue, jaLines } from '#lib/kikimimi/bank.ts';
  import { keepMada } from '../progress.svelte.ts';
  import { t } from '#lib/i18n/index.ts';

  let { it, player, onclose }: { it: Item; player: SandPlayer; onclose: () => void } = $props();

  type Step = 'hear' | 'read' | 'again';
  const STEPS: Step[] = ['hear', 'read', 'again'];
  const STEP_LABEL: Record<Step, string> = { hear: t('kiki.sand.step.hear'), read: t('kiki.sand.step.read'), again: t('kiki.sand.step.again') };
  let open = $state(true);
  let step = $state<Step>('hear');
  /** This listen's clip has sounded; or nothing sounded within 3 s (no voice on this phone: not held up for ever). */
  let sounded = $state(false), quiet = $state(false), tries = $state(0);
  const dlg = $derived(isDialogue(it) ? it : null);
  const playing = $derived(player.sounding?.i === -1 && player.sounding.at === it.id);
  /** A blind listen is over: the next step's button takes a tap. */
  const heard = $derived(!playing && (sounded || quiet));

  function listen() {
    sounded = quiet = false;
    tries++;
    player.hear(it);
  }
  $effect(() => {
    if (playing) sounded = true;
  });
  $effect(() => {
    if (!tries) return;
    const h = setTimeout(() => (quiet = true), 3000);
    return () => clearTimeout(h);
  });
  // the first listen as it opens (the tap that opened it)
  onMount(listen);

  function go(s: Step) {
    step = s;
    if (s === 'again') listen();
  }
  function rate(got: boolean) {
    if (!got) keepMada(it.id);
    open = false;
  }
  const ja = $derived(it.type === 'pic' ? (PIC_JA[it.choices[it.answer]] ?? '') : '');
</script>

{#snippet foot()}
  {#if step === 'hear'}
    <button type="button" class="btn" data-kiki-sand-next="read" aria-disabled={!heard} data-sfx="confirm" onclick={() => heard && go('read')}>{t('kiki.sand.toRead')} ›</button>
  {:else if step === 'read'}
    <button type="button" class="btn" data-kiki-sand-next="again" data-sfx="confirm" onclick={() => go('again')}>{t('kiki.sand.toAgain')} ›</button>
  {:else}
    <div class="rate" data-kiki-sand-rate={heard ? 'open' : 'wait'}>
      <button type="button" class="btn" data-kiki-sand-got aria-disabled={!heard} data-sfx="confirm" onclick={() => heard && rate(true)}>{t('kiki.sand.got')}</button>
      <button type="button" class="btn paper" data-kiki-sand-mada aria-disabled={!heard} data-sfx="tick" onclick={() => heard && rate(false)}>{t('kiki.sand.notYet')}</button>
    </div>
  {/if}
{/snippet}

<Sheet bind:open title={t('kiki.sand.title')} {onclose} footer={foot} name="kiki.sand">
  <div class="sand" data-kiki-sand={step}>
    <ol class="steps">
      {#each STEPS as s, k (s)}
        <li class:now={s === step} class:done={STEPS.indexOf(step) > k} aria-current={s === step ? 'step' : undefined}><b>{k + 1}</b>{STEP_LABEL[s]}</li>
      {/each}
    </ol>

    {#if step === 'read'}
      <div class="read" data-kiki-sand-text>
        {#if dlg}
          <Transcript it={dlg} talk={player.talk?.i === -1 && player.talk.at === it.id ? player.talk.k : -1} from={player.talk?.from ?? null} clock={() => player.clock()} />
          {#if dlg.type === 'gist'}<p class="ans" lang="en">→ {dlg.choices[dlg.answer]}<span>{dlg.ja}</span></p>{/if}
        {:else}
          <p class="en"><SoundLine en={it.en} focus={it.focus} marks={it.marks} clip={it.id} from={playing ? player.sounding!.from : null} clock={() => player.clock()} /></p>
          {#if it.marks}<MarkLegend marks={it.marks} />{/if}
          <p class="ja">{#each jaLines(it) as l, n (n)}<span>{l}</span>{/each}</p>
        {/if}
        {#if it.type === 'pic'}<p class="ans">→ {ja}</p>
        {:else if it.cja}
          <ul class="opts" aria-label={t('kiki.choicesJa')}>
            {#each it.choices as c, k (k)}
              <li data-mark={k === it.answer ? 'right' : undefined}>
                <span class="o" aria-hidden="true">{k === it.answer ? '○' : '・'}</span>
                <span><span lang={it.type === 'num' ? undefined : 'en'}>{c}</span>{#if it.cja[k] !== c}<small>{it.cja[k]}</small>{/if}</span>
              </li>
            {/each}
          </ul>
        {:else if it.type === 'num'}<p class="ans">→ {it.choices[it.answer]}</p>{/if}
        {#if it.why}<Why text={it.why} />{/if}
        <button type="button" class="btn small paper along" data-kiki-sand-along data-sfx="tick" onclick={() => player.hear(it)}><Icon name="play" /> {t('kiki.sand.along')}</button>
      </div>
    {:else}
      <!-- blind: no words on screen, only the clip and its ▶︎ -->
      <div class="blind">
        <button type="button" class="ear" class:on={playing} aria-label={t('kiki.play')} data-kiki-sand-play data-sfx="tick" onclick={listen}>
          <span aria-hidden="true">{playing ? '♪' : '▶︎'}</span>
        </button>
        <p class="say">{step === 'hear' ? t('kiki.sand.blind') : heard ? t('kiki.sand.ask') : t('kiki.sand.blindAgain')}</p>
        {#if step === 'again' && heard}<p class="note">{t('kiki.sand.note')}</p>{/if}
      </div>
    {/if}
  </div>
</Sheet>

<style>
  .sand { display: grid; gap: 14px; padding-bottom: 4px; }
  /* blind means blind: the sheet at its full height, and the reveal's words behind it blurred past reading */
  :global(dialog[open]:has(> .inner > [data-kiki-sand])) { height: calc(var(--vh-fill) - var(--ui-top) - 24px); display: flex; flex-direction: column; }
  :global(dialog[open] > .inner:has(> [data-kiki-sand])) { flex: 1 0 auto; }
  :global(dialog:has(> .inner > [data-kiki-sand])::backdrop) { -webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px); }
  .steps { list-style: none; margin: 0; padding: 0; display: flex; justify-content: center; gap: 6px; }
  .steps li {
    display: flex; align-items: center; gap: 6px; padding: 4px 12px 4px 4px; border-radius: var(--r-pill);
    font: 700 var(--fs-s)/1.2 var(--font-ui); color: var(--text-soft); background: var(--ctl-off);
  }
  .steps b { display: grid; place-items: center; width: 22px; height: 22px; border-radius: 50%; font: 700 var(--fs-s)/1 var(--font-num); background: var(--card); }
  .steps li.now { color: var(--text); background: color-mix(in srgb, var(--c-leaf) 30%, var(--card)); }
  .steps li.done { color: var(--leaf-text); }
  .blind { display: grid; justify-items: center; gap: 12px; padding: 18px 0 8px; text-align: center; }
  .ear {
    appearance: none; border: 0; cursor: pointer; width: 112px; height: 112px; border-radius: 50%; display: grid; place-items: center;
    font: 700 44px/1 var(--font-ui); color: var(--c-ink); background: var(--c-yuzu); box-shadow: 0 var(--lip-h) 0 var(--c-lip);
  }
  .ear.on { animation: breathe 1.2s ease-in-out infinite; }
  @keyframes breathe { 50% { transform: scale(1.06); } }
  @media (prefers-reduced-motion: reduce) { .ear.on { animation: none; } }
  .say, .note { text-wrap: balance; }
  .say { margin: 0; font: 700 var(--fs-body)/1.45 var(--font-ui); color: var(--text); }
  .note { margin: 0; font: 700 var(--fs-s)/1.45 var(--font-ui); color: var(--text-soft); }
  .read { display: grid; gap: 8px; }
  .en { margin: 0; font: 700 max(18px, var(--fs-talk))/1.5 var(--font-ui); }
  .ja, .ans { margin: 0; font: 700 var(--fs-s)/1.45 var(--font-ui); color: var(--text-soft); }
  .ja span, .ans span { display: block; }
  .opts { list-style: none; margin: 2px 0; padding: 0; display: grid; gap: 4px; }
  .opts li { display: grid; grid-template-columns: 1.2em 1fr; gap: 4px; font: 700 var(--fs-s)/1.4 var(--font-ui); color: var(--text-soft); }
  .opts li[data-mark='right'] { color: var(--leaf-text); }
  .opts small { display: block; font: 700 var(--fs-s)/1.4 var(--font-ui); }
  .along { justify-self: start; }
  .rate { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
</style>
