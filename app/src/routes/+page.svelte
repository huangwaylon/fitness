<script lang="ts">
  // 島 Island: the scene full bleed under a light, symmetric HUD (today's ベル ribbon
  // centred at the top = the one focal point) and ONE control at the bottom centre: the NookPhone, the hub (きろく,
  // あそびかた, …), in the thumb zone. The day needs zero taps (the Watch and the Shortcut fill the trees);
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
  import PhoneButton from '#lib/components/ui/PhoneButton.svelte';
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

  /** Every timeout this page starts, cleared when it unmounts. */
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
    // After my 受け取る！ (also in demo, whose host key is fixed): 「うめさんの番です！」 until they drop theirs.
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

  // A failed save (the store's toast, by its code, not its wording) → my villager looks sheepish (R17).
  $effect(() => {
    if (toasts.current?.code === 'save-failed') emit('sync-error');
  });

  // Tell me when my partner sent a high-five today (once per new one, per device), with their villager on the
  // banner, but not over the harvest: wait until it closes, and not over another banner: one at a time.
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
    <!-- DOM order = focus / VoiceOver order = the visual order: the heading, today's ベル, the scene (trees, villagers,
         the jar), then the phone (and しずえ's box) at the bottom. All are absolutely placed, so the order costs no layout;
         the stacking comes from the --z-* scale (tokens.css). -->
    <Hud bells={view.wallet.today} bind:phoneOpen />
    <div class="top">
      <IslandScene {view} onpartner={() => (partnerOpen = true)} onjar={() => goto(resolve('/jar'))}
        paused={partnerOpen || phoneOpen} />
    </div>
    <!-- The bottom band (a constant height): the NookPhone, centred. しずえ's box, when she has news, floats just above
         it over the front beach, so nothing in the scene moves when she speaks. -->
    <div class="below">
      {#if news}<div class="news"><Bubble text={news} host={false} /></div>{/if}
      <PhoneButton bind:open={phoneOpen} />
    </div>
  </main>
  <PartnerSheet bind:open={partnerOpen} onhighfive={sendHighFive} />
{/if}

<style>
  /* The island is centred in the visible ocean (the horizon down to the NookPhone), never under the
     ribbon or the phone. The phone sits in ONE fixed slot over the sea at the bottom (its height is a constant, so
     nothing moves when しずえ speaks: her box floats above it); IslandScene centres the island between the horizon
     and --island-bottom (the phone's top), and keeps the horizon under --hud-bottom (the ribbon's lip, Hud.svelte). */
  .island {
    --chrome-below: calc(var(--phone-h) + 2 * var(--gap) + var(--pad-bottom));
    --hud-bottom: calc(var(--safe-top) + 16px + var(--hit) + var(--lip-h));
    --island-bottom: calc(var(--chrome-below) - var(--gap));
    --scene-h: var(--vh-fill);
    position: relative; max-width: var(--col); margin: 0 auto; height: var(--vh-fill); overflow: hidden;
  }
  .top { position: absolute; inset: 0; overflow: hidden; }
  .below {
    position: absolute; z-index: var(--z-dock); left: 0; right: 0; bottom: 0;
    height: var(--chrome-below); display: flex; flex-direction: column; justify-content: flex-end; align-items: center;
    padding: var(--gap) calc(var(--side) + var(--safe-right)) calc(var(--pad-bottom) + var(--gap)) calc(var(--side) + var(--safe-left));
    pointer-events: none;
  }
  .below > :global(*) { pointer-events: auto; }
  /* Under the harvest only the island shows through the tint: no HUD, no dialogue, no action. */
  .covered :global(.hud), .covered :global(.ribbon-wrap), .covered :global(.jar-plate), .covered .below { visibility: hidden; }
  /* しずえ's box: over the front beach, just above the phone, the column's width */
  .news { position: absolute; left: calc(var(--side) + var(--safe-left)); right: calc(var(--side) + var(--safe-right)); bottom: calc(100% - var(--gap)); }
  .news :global(.bubble) { margin-bottom: 0; }
</style>
