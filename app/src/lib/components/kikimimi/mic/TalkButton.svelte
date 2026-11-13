<script lang="ts">
  // くりかえし チャレンジ's and ロールプレイ's tap-to-talk (docs/kikimimi-mic.md "The modes", the rules): MicRing's round button
  // and its ring meter of the voice's level. A tap starts a take on the phone's recogniser (lib/mic/stt.ts, loaded by the round;
  // inside the tap: the audio context woken), a tap ends it; it also ends by itself on silence after speech, at its cap,
  // with no speech in a while, or when the app hides. Never starts on its own. What was heard goes to `onheard` (a miss
  // to `onmiss`) and is kept nowhere here; leaving cancels the take. Its words are the game's (`kiki.<game>.talk` …).
  import { onDestroy } from 'svelte';
  import { t } from '#lib/i18n/index.ts';
  import { audioCtx } from '#lib/sound/sound.svelte.ts';
  import { level01 } from '#lib/mic/level.ts';
  import type { Miss, Recogniser, Take } from '#lib/mic/stt.ts';
  import MicRing from './MicRing.svelte';

  let { game, rec, maxS, idle, st = $bindable('idle'), onheard, onmiss }: {
    /** Whose words and look-up (`data-kuri-mic` / `data-role-mic`). */
    game: 'kuri' | 'role';
    rec: Recogniser;
    maxS: number;
    /** The caption when it's waiting (after a miss: 「もう一度話す」). */
    idle: string;
    /** Waiting, in a take, or checking what came through (the round holds its replay meanwhile). */
    st?: 'idle' | 'listening' | 'checking';
    onheard: (text: string) => void;
    onmiss: (m: Miss) => void;
  } = $props();

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
    const tk = (take = rec.listen({ maxS, frame: (v) => (v.done ? ((st = 'checking'), (level = 0)) : (level = level01(v.db))) }));
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

<MicRing on={st === 'listening'} busy={st === 'checking'} {level} track={false} label={t(st === 'listening' ? `kiki.${game}.stop` : `kiki.${game}.talk`)}
  icon={st === 'listening' ? '■' : st === 'checking' ? '…' : '🎤'} cap={st === 'listening' ? t(`kiki.${game}.listening`) : st === 'checking' ? t(`kiki.${game}.checking`) : idle}
  onclick={tap} {...{ [`data-${game}-mic`]: st }} />
