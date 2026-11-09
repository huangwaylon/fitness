<script lang="ts">
  // はつおん's tap-to-talk (docs/kikimimi-mic.md "はつおん ききわけ"): MicButton's 80 px button and ring, over the recogniser instead of
  // the bare capture. A tap starts a take with the pair's two words as the candidates (whisper scores each; the others
  // transcribe), a tap stops it, the VAD's silence ends it; `onheard` gets what the recogniser made of it (never kept
  // here). Never starts on its own; leaving drops the take.
  import { onDestroy } from 'svelte';
  import '#lib/i18n/kiki-mic.ts';
  import { t } from '#lib/i18n/index.ts';
  import { audioCtx } from '#lib/sound/sound.svelte.ts';
  import type { Outcome, Recogniser, Take } from '#lib/mic/stt.ts';
  import { level01 } from '#lib/mic/level.ts';

  let { r, words, onheard }: { r: Recogniser; words: readonly string[]; onheard: (o: Outcome) => void } = $props();

  let st = $state<'idle' | 'listening' | 'hearing'>('idle');
  let level = $state(0);
  let take: Take | null = null;
  let gone = false;
  onDestroy(() => {
    gone = true;
    take?.cancel();
  });

  async function tap() {
    if (st === 'listening') {
      st = 'hearing';
      return void take?.stop();
    }
    if (st === 'hearing') return;
    audioCtx();
    const tk = (take = r.listen({ candidates: words, frame: (v) => (level = level01(v.db)) }));
    st = 'listening';
    const o = await tk.heard;
    if (take !== tk || gone) return;
    take = null;
    level = 0;
    st = 'idle';
    onheard(o);
  }
  const cap = $derived(st === 'listening' ? t('kiki.mic.btn.listening') : st === 'hearing' ? t('kiki.mic.reply.hearing') : t('kiki.mic.btn.talk'));
</script>

<div class="mic" data-mic-button data-mic-state={st}>
  <button type="button" class="talk" class:on={st !== 'idle'} data-sfx="tick" aria-label={st === 'listening' ? t('kiki.mic.btn.stop') : t('kiki.mic.btn.talk')}
    aria-pressed={st === 'listening'} aria-disabled={st === 'hearing'} onclick={tap}>
    <svg viewBox="0 0 80 80" aria-hidden="true">
      <circle class="track" cx="40" cy="40" r="37" />
      <circle class="lv" cx="40" cy="40" r="37" pathLength="1" stroke-dasharray="1" stroke-dashoffset={1 - level} />
    </svg>
    <span class="ic" aria-hidden="true">{st === 'listening' ? '■' : st === 'hearing' ? '…' : '🎤'}</span>
  </button>
  <p class="cap" role="status">{cap}</p>
</div>

<style>
  .mic { display: grid; justify-items: center; gap: 6px; }
  .talk {
    position: relative; display: grid; place-items: center; width: 80px; height: 80px; padding: 0; border: 0; border-radius: 50%;
    background: var(--c-leaf); box-shadow: inset 0 0 0 2px var(--c-leaf-edge), 0 4px 0 var(--c-leaf-edge); cursor: pointer;
    transition: transform var(--dur-tap) var(--ease-squash);
  }
  .talk:active { transform: translateY(3px); box-shadow: inset 0 0 0 2px var(--c-leaf-edge), 0 1px 0 var(--c-leaf-edge); }
  .talk.on { background: var(--c-coral); box-shadow: inset 0 0 0 2px var(--c-edge), 0 4px 0 var(--c-edge); }
  svg { position: absolute; inset: -6px; width: calc(100% + 12px); height: calc(100% + 12px); rotate: -90deg; pointer-events: none; }
  circle { fill: none; stroke-width: 4; }
  .track { stroke: transparent; }
  .on .track { stroke: var(--edge); }
  .lv { opacity: 0; stroke: var(--coral-text); transition: stroke-dashoffset 80ms linear; }
  .on .lv { opacity: 1; }
  .ic { font: 700 32px/1 var(--font-ui); color: var(--c-ink); }
  .cap { margin: 0; font: 700 var(--fs-s)/1.4 var(--font-ui); color: var(--text-soft); text-align: center; }
  @media (prefers-reduced-motion: reduce) { .talk, .lv { transition: none; } }
</style>
