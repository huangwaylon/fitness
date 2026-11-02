<script lang="ts">
  // The partner's catches and finds shown here (partnerNews.ts): in view, a plate over their villager holding the item
  // up (CatchPlate, as mine); out of view, a small notice at the screen's edge on their side (the item's icon and the
  // line), gone after NOTICE_MS. Decorative: the island's state is the shared day's (store/world.svelte.ts).
  //   <PartnerNews {scene} />   (inside .stage)
  import CatchPlate from './CatchPlate.svelte';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import { cardFor, type CatchCard } from './catchCard.ts';
  import { setPartnerSink, type PartnerNews } from './partnerNews.ts';
  import { useWorld } from './camera.svelte.ts';
  import { livePos } from '../motion/director.svelte.ts';
  import { actorOf } from '#lib/ui-state/cast.ts';
  import { VILLAGER } from './scene.ts';
  import { onDestroy } from 'svelte';

  let { scene }: { scene?: HTMLElement } = $props();
  const w = useWorld();

  const NOTICE_MS = 3600;
  let card = $state<CatchCard | null>(null);
  let notice = $state<{ n: number; art: string; text: string; edge: 'top' | 'bottom' } | null>(null);
  let seq = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;

  function show(p: PartnerNews, text: string) {
    const n = ++seq;
    if (w.inView(p.x, p.z, -8)) {
      // over their villager when it's there, else over the spot
      const id = p.who ? actorOf(p.who) : 'partner';
      const [vx, vz] = livePos(id), near = Math.hypot(vx - p.x, vz - p.z) < 60;
      const [sx, sy] = near ? w.screenU(vx, vz, VILLAGER.h) : w.screenU(p.x, p.z, p.lift ?? 4);
      card = cardFor(n, sx, sy, p.art, text, false, p.hold !== false && near, id === 'mine' ? 'partner' : id);
      return;
    }
    clearTimeout(timer);
    notice = { n, art: p.art, text, edge: p.z > w.view.camZ ? 'top' : 'bottom' };
    timer = setTimeout(() => notice?.n === n && (notice = null), NOTICE_MS);
  }
  setPartnerSink(show);
  onDestroy(() => {
    setPartnerSink(null);
    clearTimeout(timer);
  });
</script>

<div class="held"><CatchPlate {scene} bind:card /></div>
{#if notice}
  {#key notice.n}
    <div class="notice {notice.edge}" data-partner-news role="status">
      <span class="ic"><OfficialArt key={notice.art} size="24px" /></span>
      <span class="tx">{notice.text}</span>
    </div>
  {/key}
{/if}

<style>
  .held { position: absolute; inset: 0; z-index: var(--z-taps); pointer-events: none; }
  /* the edge notice: a small plate at the partner's edge (under the HUD at the top, over the foot at the bottom) */
  .notice {
    position: absolute; left: 50%; z-index: var(--z-taps); translate: -50% 0; max-width: min(320px, 86%); display: flex; align-items: center;
    gap: 6px; padding: 6px 12px 6px 8px; border-radius: 999px; background: var(--plate); box-shadow: 0 3px 0 var(--plate-lip);
    color: var(--plate-ink, var(--ink)); font-size: 13px; line-height: 1.3; pointer-events: none;
    animation: news 3600ms ease both;
  }
  .notice.top { top: calc(var(--hud-bottom, 0px) + 58px); }
  .notice.bottom { bottom: calc(env(safe-area-inset-bottom, 0px) + 64px); }
  .ic { flex: none; line-height: 0; }
  .tx { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  @keyframes news { 0% { opacity: 0; translate: -50% 6px; } 8%, 88% { opacity: 1; translate: -50% 0; } 100% { opacity: 0; } }
</style>
