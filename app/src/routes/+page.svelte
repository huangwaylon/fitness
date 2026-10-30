<script lang="ts">
  // 島 Island (v5 §3, ADR 0021): the scene full bleed under a light HUD (NookPhone, today's ベル ribbon = the one
  // focal point). No action button: the day needs zero taps (the Watch and the Shortcut fill the trees), and
  // ハイタッチ lives with the partner's villager (tap them → their villager card), as talking to a villager does in NH.
  // The app asks no daily questions: the band under the scene is しずえ's, and her dialogue box shows only when she has
  // news (the harvest). Tap the jar → the wallet (ごほうび); a tree → its popup; the partner → their card; my villager → a hop.
  import { onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import IslandScene from '#lib/components/island/IslandScene.svelte';
  import { emit } from '#lib/components/motion/bus.svelte.ts';
  import Bubble from '#lib/components/ui/Bubble.svelte';
  import Hud from '#lib/components/island/Hud.svelte';
  import PartnerSheet from '#lib/components/sheets/PartnerSheet.svelte';
  import { week } from '#lib/store/week.svelte.ts';
  import { ui } from '#lib/ui-state/ui.svelte.ts';
  import { toasts } from '#lib/ui-state/toast.svelte.ts';
  import { localKV, readJson, SCENE, writeRaw } from '#lib/sync/storage.ts';
  import { highFive } from '#lib/store/actions.ts';
  import { t, hostLine } from '#lib/i18n/index.ts';

  let partnerOpen = $state(false);
  let phoneOpen = $state(false);

  const view = $derived(week.view);
  const me = $derived(view ? view.people[view.me] : null);

  /** Every timeout this page starts, cleared when it unmounts (review P11). */
  const timers = new Set<ReturnType<typeof setTimeout>>();
  function later(fn: () => void, ms: number): void {
    const id = setTimeout(() => {
      timers.delete(id);
      fn();
    }, ms);
    timers.add(id);
  }
  onDestroy(() => {
    for (const id of timers) clearTimeout(id);
    timers.clear();
  });

  /** しずえ's news, or null (then she stays away and the island is HUD-light). */
  const news = $derived.by((): string | null => {
    if (!view) return null;
    // After my 壺に入れる (also in demo, whose host key is fixed): 「うめさんの番です！」 until they drop theirs.
    if (view.harvest?.confirmedBy.includes(view.me)) return hostLine('harvest_waiting', { name: view.people[view.partner].villagerName });
    const key = view.host.key.replace(/^host\./, '');
    if (key === 'harvest_ready') return hostLine(key, view.host.params);
    return null;
  });

  // The partner sheet has closed by now, so R4 plays in the scene behind it.
  function sendHighFive() {
    if (!view) return;
    highFive();
    toasts.show(t('island.highfiveSent', { name: view.people[view.partner].villagerName }), 1800, { person: view.partner, reaction: 'encouraging' });
    emit('highfive-sent');
  }

  // A failed save (the store's toast, by its code, not its wording: review P9) → my villager looks sheepish (R17).
  $effect(() => {
    if (toasts.current?.code === 'save-failed') emit('sync-error');
  });

  // M5: tell me when my partner sent a high-five today (once per new one, per device), with their villager on the
  // banner (U6), but not over the harvest: wait until it closes, and not over another banner: one at a time (U13).
  $effect(() => {
    const v = week.view;
    if (!v || v.highFivesToday <= 0 || ui.overlay || toasts.current) return;
    const k = SCENE.highFivesSeen(v.today);
    const seen = Number(readJson<number>(localKV(), k) ?? 0);
    if (v.highFivesToday > seen) {
      writeRaw(localKV(), k, String(v.highFivesToday));
      later(() => toasts.show(t('island.highfiveGot', { name: v.people[v.partner].villagerName }), 3200, { person: v.partner, reaction: 'love' }), 700);
    }
  });
</script>

{#if view && me}
  <main class="island" class:covered={ui.overlay}>
    <h1 class="sr-only">{t('app.name')}</h1>
    <!-- DOM order = focus / VoiceOver order (round 16 #10): the HUD (today's ベル first), しずえ, then the scene.
         All three are absolutely placed, so nothing moves. -->
    <div class="top">
      <Hud bells={view.wallet.today} bind:phoneOpen />
      <IslandScene {view} onpartner={() => (partnerOpen = true)} onjar={() => goto(resolve('/jar'))}
        paused={partnerOpen || phoneOpen} />
    </div>

    <!-- F1: one fixed slot under the scene (round 6 band table): しずえ's box when she has news. The slot never
         changes height. -->
    <div class="below">
      {#if news}<Bubble text={news} host={false} />{/if}
    </div>
  </main>
  <PartnerSheet bind:open={partnerOpen} onhighfive={sendHighFive} />
{/if}

<style>
  /* v5 §3 + round 6 F1 (band table): the scene takes the whole page (stage bottom-anchored over
     --island-bottom = the chrome band, horizon capped by the scene), and the chrome is ONE fixed slot over
     the patterned sea at the bottom: しずえ's box (--talk-lines lines + nameplate). Its height is a constant per viewport, so nothing moves when she speaks or goes quiet. No action
     button since ADR 0021, so the island gets its height back. */
  .island {
    --talk-h: calc(var(--talk-lines) * var(--fs-talk) * 1.5 + 20px + 14px + var(--lip-h));
    --chrome-below: calc(var(--talk-h) + var(--gap) + var(--pad-bottom) + var(--lip-h));
    --island-bottom: var(--chrome-below);
    --scene-h: var(--vh-fill);
    position: relative; max-width: var(--col); margin: 0 auto; height: var(--vh-fill); overflow: hidden;
  }
  .top { position: absolute; inset: 0; overflow: hidden; }
  .below {
    position: absolute; z-index: 9; left: 0; right: 0; bottom: 0;
    height: var(--chrome-below); display: flex; flex-direction: column; justify-content: flex-end; gap: 12px;
    padding: var(--gap) calc(var(--side) + var(--safe-right)) calc(var(--pad-bottom) + var(--lip-h)) calc(var(--side) + var(--safe-left));
    pointer-events: none;
  }
  .below > :global(*) { pointer-events: auto; }
  /* Under the harvest only the island shows through the tint: no HUD, no dialogue, no action. */
  .covered :global(.hud), .covered :global(.ribbon-wrap), .covered :global(.jar-plate), .covered .below { visibility: hidden; }
  .below :global(.bubble) { margin-bottom: 0; }
</style>
