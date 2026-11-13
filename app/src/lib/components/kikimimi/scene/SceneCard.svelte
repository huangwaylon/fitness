<script lang="ts">
  // The scene card (docs/kikimimi.md "Visuals", docs/curriculum.md "Visual rules"): where and how a level-4 clip is heard, in place
  // of the plain stage from the lead-in until the reveal. The painted backdrop (srcset at the phone's scale, decoded off
  // the main thread; one image at a time), its place's name, and the channel: face to face the speakers stand in it on
  // their ground shadows, the one talking bobbing with the empty 「♪…」 bubble and the clip's bar over them (a dialogue's
  // other speaker a little back); a phone, a PA or a video call frames it over the room blurred (PhoneFrame, PaFrame,
  // VideoFrame), or over paper where the setting has no backdrop. Nothing in it gives the answer away: the backdrops hold
  // no text or numbers, and the text comes only at the reveal.
  import type { Item } from '#lib/kikimimi/bank.ts';
  import { channelOf } from '#lib/kikimimi/bank.ts';
  import OfficialArt from '../../characters/OfficialArt.svelte';
  import ClipBar from './ClipBar.svelte';
  import PhoneFrame from './PhoneFrame.svelte';
  import PaFrame from './PaFrame.svelte';
  import VideoFrame from './VideoFrame.svelte';
  import { SCENE_SIZES, sceneArt, sceneSrcset, speakersOf, videoTiles } from './stage.ts';
  import { artUrl, villagerArt } from '#lib/art.ts';
  import type { RosterId } from '#lib/villagers/roster.ts';
  import { t } from '#lib/i18n/index.ts';

  let { it, talker, bar, now, pop = false, name, bars }: {
    it: Item; talker: RosterId | null; bar: { from: number; until: number; key: string } | null; now: number; pop?: boolean; name: (id: RosterId) => string;
    /** A phone's signal bars (PhoneFrame's; fewer while a line breaks up). */
    bars?: number;
  } = $props();
  const channel = $derived(channelOf(it));
  const who = $derived(speakersOf(it));
  /** The one talking (before the first turn: the first speaker). */
  const speaking = $derived(talker ?? who[0]);
  const voicemail = $derived(!!it.tags?.conditions?.includes('voicemail'));
  /** Face to face: the first speaker on the left in a dialogue, a single speaker right of centre (the bubble to its left). */
  const side = (w: RosterId) => (who.length > 1 && w === who[0] ? 'left' : 'right');
</script>

<div class="scene" class:framed={channel !== 'live'} class:paper={!it.scene} class:pop data-kiki-scene={it.scene ?? 'paper'} data-channel={channel}>
  {#if it.scene}
    {#key it.scene}
      <img class="bd" src={artUrl(sceneArt(it.scene))} srcset={sceneSrcset(it.scene)} sizes={SCENE_SIZES} width="393" height="224" alt="" decoding="async" draggable="false" />
    {/key}
    <span class="place obj-cream">{t(`kiki.scene.${it.scene}`)}</span>
  {/if}
  {#if channel !== 'live'}
    <span class="chan">{t(`kiki.chan.${channel === 'phone' && voicemail ? 'voicemail' : channel}`)}</span>
  {/if}

  {#if channel === 'phone'}
    <PhoneFrame who={speaking} name={name(speaking)} {voicemail} {bars} {bar} {now} />
  {:else if channel === 'pa'}
    <PaFrame {bar} {now} />
  {:else if channel === 'video'}
    <VideoFrame tiles={videoTiles(it)} talker={speaking} {name} {bar} {now} />
  {:else}
    {#each who as w (w)}
      <span class="vill {side(w)}" class:talk={!!bar && speaking === w} class:back={who.length > 1 && speaking !== w} data-vill={w}>
        <OfficialArt key={villagerArt(w)} alt={name(w)} size="min(150px, 66%)" eager />
      </span>
    {/each}
    <div class="say obj-cream {side(speaking)}">
      <span class="notes" aria-hidden="true">♪…</span><span class="sr-only">{t('kiki.listen')}</span>
      <ClipBar {bar} {now} />
    </div>
  {/if}
</div>

<style>
  .scene {
    position: relative; aspect-ratio: 393 / 224; border-radius: var(--r-card); overflow: hidden; isolation: isolate;
    background: var(--c-sunk); box-shadow: var(--sh-lip-cream);
  }
  .scene.pop { animation: card-in 360ms var(--ease-bounce) both; }
  /* the backdrop softer than the villagers (they must pop); a paper vignette ties it to the sheet */
  .bd { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: -2; filter: saturate(.9); }
  .scene::after {
    content: ''; position: absolute; inset: 0; z-index: -1; pointer-events: none;
    background: radial-gradient(120% 90% at 50% 40%, transparent 55%, rgba(245, 228, 188, .55) 100%), linear-gradient(to top, rgba(74, 58, 44, .16), transparent 38%);
  }
  /* a frame over the room: the room blurred back */
  .framed .bd { filter: blur(3px) saturate(.8) brightness(1.04); transform: scale(1.06); }
  /* no backdrop of its own: paper */
  .paper { background: radial-gradient(130% 100% at 50% 30%, var(--c-cream), color-mix(in srgb, var(--c-paper) 80%, #e6cf9e)); }
  .place, .chan {
    position: absolute; top: 10px; z-index: 3; padding: 4px 11px; border-radius: var(--r-pill); font: 700 var(--fs-s)/1.3 var(--font-ui);
  }
  .place { left: 10px; background: color-mix(in srgb, var(--c-cream) 92%, transparent); box-shadow: var(--sh-lip-cream); color: var(--c-ink); }
  .chan { right: 10px; background: color-mix(in srgb, var(--c-ink) 78%, transparent); color: var(--c-cream); }

  /* a villager standing in the scene: full body, a ground shadow, the talk bob */
  .vill { position: absolute; bottom: 6px; height: 100%; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; line-height: 0; transform-origin: 50% 100%; transition: filter var(--dur-quick), opacity var(--dur-quick); }
  .vill.right { right: 9%; }
  .vill.left { left: 7%; }
  .vill :global(.official) { position: relative; z-index: 1; filter: drop-shadow(0 2px 0 rgba(74, 58, 44, .12)); }
  .vill::after { content: ''; width: 70%; height: 12px; margin-top: -7px; border-radius: 50%; background: radial-gradient(closest-side, rgba(40, 60, 40, .32), transparent); }
  .vill.talk :global(.official) { animation: if-speak 520ms ease-in-out infinite alternate; transform-origin: 50% 100%; }
  .vill.back { filter: saturate(.8) brightness(.97); opacity: .9; }

  /* the NH bubble floating over the scene, its tail toward the one talking */
  .say {
    position: absolute; top: 18%; z-index: 2; min-width: 96px; display: grid; gap: 6px; padding: 9px 14px 10px; border-radius: var(--r-game);
    background: var(--c-card); color: var(--c-ink); box-shadow: var(--sh-lip-cream);
  }
  .say::before { content: ''; position: absolute; bottom: -6px; width: 16px; height: 16px; background: var(--c-card); border-radius: 3px; rotate: 45deg; }
  .say.right { right: 40%; }
  .say.right::before { right: 18px; }
  .say.left { left: 40%; }
  .say.left::before { left: 18px; }
  .notes { font: 700 var(--fs-talk)/1 var(--font-ui); color: var(--c-ink-soft); letter-spacing: .1em; }

  @keyframes card-in { from { transform: scale(.94); opacity: 0; } to { transform: none; opacity: 1; } }
  @media (prefers-reduced-motion: reduce) {
    .scene.pop, .vill.talk :global(.official) { animation: none; }
    .vill { transition: none; }
  }
</style>
