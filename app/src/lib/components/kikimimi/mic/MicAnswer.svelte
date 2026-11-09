<script lang="ts">
  // こたえて！ (docs/kikimimi-mic.md "こたえて！"): in a reply round, with a recogniser ready on this phone, a 🎤 chip under the
  // choices. Tap, say the reply, and match.ts `choose` maps it to a choice, answered as that tap (`onpick`: the same
  // path, so the session, co-op and the wire are unchanged). Unclear (−1): 「その言い方も通じるかも」 with what was heard,
  // the choices still open. A tap on a choice always works (a take under way is dropped). What was heard stays on this
  // phone for the round: under the choices once answered and at the reveal, dropped at the next round and when the game
  // ends; never stored, sent or logged (§5). ChoiceGrid mounts it (lazily) at the first reply round with the mic on and
  // keeps it to the game's end, so the recogniser loads once (whisper's Worker warm); it's released when this goes.
  import { onDestroy, onMount, untrack } from 'svelte';
  import '#lib/i18n/kiki-mic.ts';
  import { t } from '#lib/i18n/index.ts';
  import { audioCtx } from '#lib/sound/sound.svelte.ts';
  import { choose } from '#lib/mic/match.ts';
  import type { Miss, Recogniser, Take } from '#lib/mic/stt.ts';
  import { level01 } from '#lib/mic/level.ts';
  import { sttRound } from './sttRound.ts';

  let { voice, choices, open, reveal, onpick }: {
    /** This round is a reply round (else nothing shows). */
    voice: boolean;
    choices: readonly string[];
    /** The choices take a tap. */
    open: boolean;
    reveal: boolean;
    onpick: (k: number) => void;
  } = $props();

  /** The recogniser's module, imported (not bundled here): the mic core under it stays its own chunk (load-budget). */
  const stt = sttRound();
  /** idle, a take under way, its speech being recognised, matched (answered), unclear (−1), or nothing heard. */
  type St = 'idle' | 'listening' | 'hearing' | 'matched' | 'unsure' | 'missed';
  let r = $state.raw<Recogniser | null>(null);
  let st = $state<St>('idle');
  /** The voice's level, 0–1. */
  let level = $state(0);
  /** What was heard this round (this phone's memory only). */
  let heard = $state('');
  let miss = $state<Miss | null>(null);
  let take: Take | null = null;
  let gone = false;
  const live = $derived(st === 'listening' || st === 'hearing');

  onMount(async () => {
    const x = await stt.ready();
    if (x && !gone) r = x;
  });
  onDestroy(() => {
    gone = true;
    take?.cancel();
    stt.release();
  });

  /** The take under way, dropped (what's been heard kept). */
  function endTake() {
    take?.cancel();
    take = null;
    level = 0;
    if (live) st = 'idle';
  }
  // a new round: its take and what it heard dropped
  $effect.pre(() => {
    void choices;
    untrack(() => (endTake(), (st = 'idle'), (heard = ''), (miss = null)));
  });
  // the window closed (a tap, time up, the reveal)
  $effect(() => {
    if (!open) untrack(endTake);
  });

  async function say() {
    if (st === 'listening') {
      st = 'hearing';
      return void take?.stop();
    }
    if (!r || !open || st === 'hearing') return;
    audioCtx();
    const tk = (take = r.listen({ frame: (v) => (level = level01(v.db)) }));
    st = 'listening';
    miss = null;
    const o = await tk.heard;
    // dropped meanwhile (a tap, a new round, the end)
    if (take !== tk) return;
    take = null;
    level = 0;
    if ('miss' in o) {
      st = o.miss === 'aborted' ? 'idle' : 'missed';
      miss = o.miss;
      return;
    }
    heard = o.text;
    const { i } = choose(o.text, choices);
    st = i < 0 ? 'unsure' : 'matched';
    if (i >= 0 && open) onpick(i);
  }

  const missLine = $derived(miss === 'none' ? t('kiki.mic.check.none') : miss === 'denied' ? t('kiki.mic.btn.denied') : miss === 'capped' ? t('kiki.mic.reply.capped') : t('kiki.mic.reply.other'));
</script>

{#if r && voice}
  <div class="say" data-mic-answer={st}>
    {#if !reveal}
      <button type="button" class="btn small paper talk" class:on={live} class:dim={!open && !live} style:--lv={level} data-mic-say
        aria-disabled={!open && !live} aria-pressed={live} data-sfx="tick" onclick={say}>
        <span aria-hidden="true">{live ? '■' : '🎤'}</span>
        {st === 'listening' ? t('kiki.mic.btn.listening') : st === 'hearing' ? t('kiki.mic.reply.hearing') : t('kiki.mic.reply.say')}
      </button>
    {/if}
    {#if st === 'unsure' && !reveal}
      <p class="note" role="status" data-mic-unsure>{t('kiki.mic.reply.unsure')}<span class="heard" lang="en">“{heard}”</span></p>
    {:else if heard}
      <p class="note" data-mic-heard><span class="k">{t('kiki.mic.reply.heard')}</span><span class="heard" lang="en">“{heard}”</span></p>
    {:else if st === 'missed' && !reveal}
      <p class="note" role="status" data-mic-missed={miss}>{missLine}</p>
    {/if}
  </div>
{/if}

<style>
  .say { display: grid; justify-items: center; gap: 6px; }
  .talk { gap: 6px; transition: box-shadow 80ms linear, opacity var(--dur-quick); }
  .talk.dim { opacity: .5; }
  /* listening: coral, a ring that grows with the voice */
  .talk.on { --fill: var(--c-coral); box-shadow: 0 0 0 calc(var(--lv, 0) * 6px) color-mix(in srgb, var(--c-coral) 45%, transparent); }
  .note { margin: 0; text-align: center; font: 700 var(--fs-s)/1.45 var(--font-ui); color: var(--text-soft); }
  .note .k { margin-right: 6px; }
  .heard { display: block; color: var(--text); font-weight: 600; overflow-wrap: anywhere; }
  .note .k + .heard { display: inline; }
  @media (prefers-reduced-motion: reduce) { .talk { transition: none; } }
</style>
