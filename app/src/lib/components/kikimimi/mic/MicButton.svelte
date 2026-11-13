<script lang="ts">
  // The mic's tap-to-talk button (docs/kikimimi-mic.md "The modes", the rules): MicRing's round button and its ring meter
  // of the voice's level. A tap starts a take (lib/mic/session.ts; the audio context woken inside the tap), a tap stops it; it
  // also stops by itself on silence after speech, at the cap, with no speech in a while, or when the app hides. Never
  // starts on its own. The speech goes to `onheard` (null: none) and is kept nowhere here; leaving cancels the take.
  // The mic core is its own chunk, fetched when the button shows. `onstart`: the take is open (まねっこ plays its clip
  // then, to be spoken over). Refused: `onretry` (設定's) offers 「もう一度試す」 (lib/mic/retry.ts).
  import { onDestroy, onMount } from 'svelte';
  import '#lib/i18n/kiki-mic.ts';
  import { t } from '#lib/i18n/index.ts';
  import { audioCtx } from '#lib/sound/sound.svelte.ts';
  import type { Got, Take } from '#lib/mic/session.ts';
  import { level01 } from '#lib/mic/level.ts';
  import MicRing from './MicRing.svelte';

  let { onheard, onstart, onretry, maxS }: { onheard: (g: Got | null) => void; onstart?: () => void; onretry?: () => void; maxS?: number } = $props();

  type St = 'idle' | 'opening' | 'listening' | 'denied';
  let st = $state<St>('idle');
  /** The voice's level, 0–1 (−60 → −15 dBFS). */
  let level = $state(0);
  let speaking = $state(false);
  let take: Take | null = null;
  let gone = false;
  // kept once fetched: the tap opens the mic before any await (one before it may lose the tap: WebKit refuses unasked)
  let mic: typeof import('#lib/mic/session.ts') | null = null;
  const core = () => import('#lib/mic/session.ts').then((m) => (mic = m));

  onMount(() => void core());
  onDestroy(() => {
    gone = true;
    take?.cancel();
  });

  async function tap() {
    if (st === 'listening') return take?.stop();
    if (st === 'opening') return;
    audioCtx();
    const open = (m: typeof import('#lib/mic/session.ts')) => m.takeMic({ maxS, frame: (v) => ((level = level01(v.db)), (speaking = v.speaking)) });
    const opening = mic ? open(mic) : core().then(open);
    st = 'opening';
    try {
      take = await opening;
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

<MicRing on={st === 'listening'} {level} label={st === 'listening' ? t('kiki.mic.btn.stop') : t('kiki.mic.btn.talk')} icon={st === 'listening' ? '■' : '🎤'}
  cap={st === 'denied' ? t('kiki.mic.btn.denied') : st === 'listening' ? t('kiki.mic.btn.listening') : t('kiki.mic.btn.talk')} onclick={tap}
  data-mic-button data-mic-state={st} data-mic-speaking={speaking ? 1 : 0}>
  {#if st === 'denied' && onretry}<button type="button" class="btn small paper" data-mic-retry data-sfx="confirm" onclick={onretry}>↻ {t('kiki.mic.retry')}</button>{/if}
</MicRing>
