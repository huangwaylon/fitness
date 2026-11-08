<script lang="ts">
  // ロールプレイ's tap-to-talk (docs/kikimimi-mic.md "The modes", the rules): 80 px, round, a ring meter of the voice's level. A
  // tap starts a take on the phone's recogniser (lib/mic/stt.ts, loaded by the round; inside the tap: the audio context
  // woken), a tap ends it; it also ends on the silence after speech, at its cap, with no speech in a while, or when
  // the app hides. Never starts on its own. What was heard goes to `onheard` (a miss to `onmiss`) and is kept nowhere
  // here; leaving cancels the take.
  import { onDestroy } from 'svelte';
  import { t } from '#lib/i18n/index.ts';
  import { audioCtx } from '#lib/sound/sound.svelte.ts';
  import type { Miss, Recogniser, Take } from '#lib/mic/stt.ts';

  let { rec, idle, st = $bindable('idle'), onheard, onmiss }: {
    rec: Recogniser;
    /** The caption while it waits. */
    idle: string;
    st?: 'idle' | 'listening' | 'checking';
    onheard: (text: string) => void;
    onmiss: (m: Miss) => void;
  } = $props();

  // (the ring: −60 → −15 dBFS as 0–1, stt.ts level01's; that module stays out of this chunk)
  /** A line's take: 15 s at most. */
  const MAX_S = 15;
  let level = $state(0);
  let take: Take | null = null;
  let gone = false;
  onDestroy(() => {
    gone = true;
    take?.cancel();
  });

  async function tap() {
    if (st === 'checking') return;
    if (st === 'listening') {
      st = 'checking';
      level = 0;
      return void take?.stop();
    }
    audioCtx();
    st = 'listening';
    const tk = (take = rec.listen({ maxS: MAX_S, frame: (v) => (v.done ? ((st = 'checking'), (level = 0)) : (level = Math.min(1, Math.max(0, (v.db + 60) / 45)))) }));
    const o = await tk.heard;
    if (take === tk) take = null;
    st = 'idle';
    level = 0;
    if (gone) return;
    if ('miss' in o) {
      if (o.miss !== 'aborted') onmiss(o.miss);
    } else onheard(o.text);
  }
</script>

<div class="mic" data-role-mic={st}>
  <button type="button" class="talk" class:on={st === 'listening'} data-sfx="tick" aria-label={st === 'listening' ? t('kiki.role.stop') : t('kiki.role.talk')}
    aria-pressed={st === 'listening'} aria-disabled={st === 'checking'} onclick={tap}>
    <svg viewBox="0 0 80 80" aria-hidden="true">
      <circle class="lv" cx="40" cy="40" r="37" pathLength="1" stroke-dasharray="1" stroke-dashoffset={1 - level} />
    </svg>
    <span class="ic" aria-hidden="true">{st === 'listening' ? '■' : st === 'checking' ? '…' : '🎤'}</span>
  </button>
  <p class="cap" role="status">{st === 'listening' ? t('kiki.role.listening') : st === 'checking' ? t('kiki.role.checking') : idle}</p>
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
  .talk[aria-disabled='true'] { background: var(--ctl-off); box-shadow: inset 0 0 0 2px var(--edge); }
  svg { position: absolute; inset: -6px; width: calc(100% + 12px); height: calc(100% + 12px); rotate: -90deg; pointer-events: none; }
  .lv { fill: none; stroke-width: 4; stroke: var(--coral-text); opacity: 0; transition: stroke-dashoffset 80ms linear; }
  .on .lv { opacity: 1; }
  .ic { font: 700 32px/1 var(--font-ui); color: var(--c-ink); }
  .cap { margin: 0; font: 700 var(--fs-s)/1.4 var(--font-ui); color: var(--text-soft); text-align: center; }
  @media (prefers-reduced-motion: reduce) { .talk, .lv { transition: none; } }
</style>
