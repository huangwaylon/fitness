<script lang="ts">
  // The phone channel (docs/kikimimi.md "Visuals"): a paper phone standing in the scene's (blurred) room, the caller's
  // head and name, 「つうわちゅう」 or 「るすでん」 (a voicemail), its signal bars (full; `bars` fewer while a line breaks up:
  // ようじ でんわ's `signal` lines), and a voice wave that moves while the line plays, the
  // clip's bar under it. Pure CSS.
  import OfficialArt from '../../characters/OfficialArt.svelte';
  import ClipBar from './ClipBar.svelte';
  import { villagerArt } from '#lib/art.ts';
  import type { RosterId } from '#lib/villagers/roster.ts';
  import { t } from '#lib/i18n/index.ts';

  let { who, name, voicemail = false, bars = 4, bar, now }: {
    who: RosterId; name: string; voicemail?: boolean; bars?: number; bar: { from: number; until: number; key: string } | null; now: number;
  } = $props();
  const WAVE = [10, 20, 14, 22, 8, 18, 12, 24, 10];
  const SIG = [5, 8, 11, 14];
</script>

<div class="phone" class:live={!!bar} class:weak={bars < SIG.length} data-kiki-frame="phone" data-voicemail={voicemail || undefined} data-bars={bars}>
  <span class="cam" aria-hidden="true"></span>
  <span class="who">{#key who}<OfficialArt key={villagerArt(who, true)} alt="" size={60} eager />{/key}</span>
  <span class="nm">{name}</span>
  <span class="tm">{voicemail ? t('kiki.chan.voicemail') : t('kiki.chan.calling')}</span>
  <span class="sig" aria-hidden="true">{#each SIG as h, k (k)}<i class:off={k >= bars} style:height="{h}px"></i>{/each}</span>
  <span class="wave" aria-hidden="true">{#each WAVE as h, k (k)}<i style:height="{h}px" style:animation-delay="{-k * 90}ms"></i>{/each}</span>
  <span class="bar"><ClipBar {bar} {now} /></span>
</div>

<style>
  .phone {
    position: absolute; left: 50%; top: 12px; bottom: -14px; width: 156px; translate: -50% 0; z-index: 1;
    border-radius: 28px 28px 0 0; background: var(--c-cream); box-shadow: inset 0 0 0 5px #5a4a3b, 0 10px 24px rgba(74, 58, 44, .25);
    display: grid; justify-items: center; align-content: start; gap: 3px; padding: 24px 14px 0;
  }
  .cam { position: absolute; top: 11px; width: 40px; height: 7px; border-radius: 9px; background: #5a4a3b; }
  .who { width: 64px; height: 64px; border-radius: 50%; background: var(--c-mint); display: grid; place-items: center; overflow: hidden; box-shadow: 0 3px 0 #5db7a2; margin-top: 2px; line-height: 0; }
  .nm { font: 700 var(--fs-body)/1.2 var(--font-ui); color: var(--c-ink); }
  .tm { font: 700 var(--fs-xs)/1.2 var(--font-ui); color: var(--c-ink-soft); letter-spacing: .04em; }
  .sig { display: flex; align-items: end; gap: 3px; height: 14px; }
  .sig i { width: 4px; border-radius: 2px; background: var(--c-leaf-edge); transition: background var(--dur-quick); }
  .sig i.off { background: color-mix(in srgb, var(--c-edge) 30%, transparent); }
  .weak .sig i:not(.off) { background: var(--c-coral); }
  /* a line breaking up: the wave stutters */
  .live.weak .wave i { animation-duration: 180ms; animation-timing-function: steps(2); }
  .wave { display: flex; align-items: center; gap: 3px; height: 26px; }
  .wave i { width: 4px; border-radius: 3px; background: color-mix(in srgb, var(--c-edge) 35%, transparent); transform: scaleY(.3); transition: transform var(--dur-quick); }
  .live .wave i { background: var(--c-leaf); transform: none; animation: wv 640ms ease-in-out infinite alternate; }
  .bar { width: 100%; }
  @keyframes wv { from { transform: scaleY(.35); } to { transform: scaleY(1); } }
</style>
