<script lang="ts">
  // はつおん's tap-to-talk (docs/kikimimi-mic.md "はつおん ききわけ"): MicRing's button over the recogniser, not the bare
  // capture. A tap starts a take with the pair's two words as the candidates (whisper scores each; the others
  // transcribe), a tap stops it, the VAD's silence ends it; `onheard` gets what the recogniser made of it (never kept
  // here). Never starts on its own; leaving drops the take.
  import { onDestroy } from 'svelte';
  import '#lib/i18n/kiki-mic.ts';
  import { t } from '#lib/i18n/index.ts';
  import { audioCtx } from '#lib/sound/sound.svelte.ts';
  import type { Outcome, Recogniser, Take } from '#lib/mic/stt.ts';
  import { level01 } from '#lib/mic/level.ts';
  import MicRing from '../mic/MicRing.svelte';

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

<MicRing on={st !== 'idle'} pressed={st === 'listening'} busy={st === 'hearing'} {level} label={st === 'listening' ? t('kiki.mic.btn.stop') : t('kiki.mic.btn.talk')}
  icon={st === 'listening' ? 'stop' : st === 'hearing' ? '…' : 'mic'} {cap} onclick={tap} data-mic-button data-mic-state={st} />
