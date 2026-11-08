<script lang="ts">
  // The mic's tap-to-talk button (docs/kikimimi-mic.md "The modes", the rules): 72 px, round, a ring meter of the voice's level
  // around it. A tap starts a take (lib/mic/session.ts; the audio context woken inside the tap), a tap stops it; it
  // also stops by itself on silence after speech, at the cap, with no speech in a while, or when the app hides. Never
  // starts on its own. The speech goes to `onheard` (null: none) and is kept nowhere here; leaving cancels the take.
  // The mic core is its own chunk, fetched when the button shows. `onstart`: the take is open (まねっこ plays its clip
  // then, to be spoken over).
  import { onDestroy, onMount } from 'svelte';
  import '#lib/i18n/kiki-mic.ts';
  import { t } from '#lib/i18n/index.ts';
  import { audioCtx } from '#lib/sound/sound.svelte.ts';
  import type { Got, Take } from '#lib/mic/session.ts';

  let { onheard, onstart, maxS }: { onheard: (g: Got | null) => void; onstart?: () => void; maxS?: number } = $props();

  type St = 'idle' | 'opening' | 'listening' | 'denied';
  let st = $state<St>('idle');
  /** The voice's level, 0–1 (−60 → −15 dBFS). */
  let level = $state(0);
  let speaking = $state(false);
  let take: Take | null = null;
  let gone = false;
  const core = () => import('#lib/mic/session.ts');

  onMount(() => void core());
  onDestroy(() => {
    gone = true;
    take?.cancel();
  });

  async function tap() {
    if (st === 'listening') return take?.stop();
    if (st === 'opening') return;
    audioCtx();
    st = 'opening';
    try {
      const { takeMic } = await core();
      take = await takeMic({ maxS, frame: (v) => ((level = Math.min(1, Math.max(0, (v.db + 60) / 45))), (speaking = v.speaking)) });
      // left while the mic was opening: let it go at once
      if (gone) return take.cancel();
      st = 'listening';
      onstart?.();
      const got = await take.done;
      take = null;
      st = 'idle';
      level = 0;
      speaking = false;
      if (!gone) onheard(got);
    } catch (e) {
      take = null;
      st = e instanceof DOMException && e.name === 'NotAllowedError' ? 'denied' : 'idle';
    }
  }
</script>

<div class="mic" data-mic-button data-mic-state={st} data-mic-speaking={speaking ? 1 : 0}>
  <button type="button" class="talk" class:on={st === 'listening'} data-sfx="tick" aria-label={st === 'listening' ? t('kiki.mic.btn.stop') : t('kiki.mic.btn.talk')}
    aria-pressed={st === 'listening'} onclick={tap}>
    <svg viewBox="0 0 80 80" aria-hidden="true">
      <circle class="track" cx="40" cy="40" r="37" />
      <circle class="lv" cx="40" cy="40" r="37" pathLength="1" stroke-dasharray="1" stroke-dashoffset={1 - level} />
    </svg>
    <span class="ic" aria-hidden="true">{st === 'listening' ? '■' : '🎤'}</span>
  </button>
  <p class="cap" role="status">{st === 'denied' ? t('kiki.mic.btn.denied') : st === 'listening' ? t('kiki.mic.btn.listening') : t('kiki.mic.btn.talk')}</p>
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
  .on .lv { opacity: 1; }
  .lv { opacity: 0; stroke: var(--coral-text); transition: stroke-dashoffset 80ms linear; }
  .ic { font: 700 32px/1 var(--font-ui); color: var(--c-ink); }
  .cap { margin: 0; font: 700 var(--fs-s)/1.4 var(--font-ui); color: var(--text-soft); text-align: center; }
  @media (prefers-reduced-motion: reduce) { .talk, .lv { transition: none; } }
</style>
