<script lang="ts">
  // 島 Island: the scene full bleed under a light, symmetric HUD: today's ベル ribbon centred at the top, the one focal
  // point and the door to everything else (tap → the island panel slides down: きろく, むらびと, settings, あそびかた).
  // The day needs zero taps (the Watch and the Shortcut fill the trees);
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
  let panelOpen = $state(false);

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

  /** しずえ's news, or null (then she stays away and the island is HUD-light): only the harvest. Before my 受け取る！
   *  「収穫の時間ですよ！」, after it 「あとは うめさんの ばんですよ！」 until they collect theirs. */
  const news = $derived.by((): string | null => {
    const h = view?.harvest;
    if (!view || !h) return null;
    return h.confirmedBy.includes(view.me) ? hostLine('harvest_waiting', { name: view.people[view.partner].villagerName }) : hostLine('harvest_ready');
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
         the jar), then しずえ's box at the bottom. All are absolutely placed, so the order costs no layout; the stacking
         comes from the --z-* scale (tokens.css). -->
    <Hud bells={view.wallet.today} bind:panelOpen />
    <div class="top">
      <IslandScene {view} onpartner={() => (partnerOpen = true)} onjar={() => goto(resolve('/jar'))}
        paused={partnerOpen || panelOpen} />
    </div>
    <!-- しずえ's box, when she has news, floats over the sea at the bottom, so nothing in the scene moves when she speaks. -->
    {#if news}<div class="news"><Bubble text={news} host={false} /></div>{/if}
  </main>
  <PartnerSheet bind:open={partnerOpen} onhighfive={sendHighFive} />
{/if}

<style>
  /* The island is centred in the visible ocean, from the horizon down to the bottom of the screen (above the home
     indicator), never under the ribbon: IslandScene centres it between the horizon and --island-bottom, and keeps
     the horizon under --hud-bottom (the ribbon's lip, Hud.svelte). */
  .island {
    --hud-bottom: calc(var(--safe-top) + 16px + var(--hit) + var(--lip-h));
    --island-bottom: var(--safe-bottom);
    --scene-h: var(--vh-fill);
    position: relative; max-width: var(--col); margin: 0 auto; height: var(--vh-fill); overflow: hidden;
  }
  .top { position: absolute; inset: 0; overflow: hidden; }
  /* Under the harvest only the island shows through the tint: no HUD, no dialogue. */
  .covered :global(.hud), .covered :global(.ribbon-wrap), .covered :global(.jar-plate), .covered .news { visibility: hidden; }
  /* しずえ's box: over the sea at the bottom, the column's width, above the home indicator */
  .news {
    position: absolute; z-index: var(--z-dock); left: calc(var(--side) + var(--safe-left)); right: calc(var(--side) + var(--safe-right));
    bottom: calc(var(--pad-bottom) + var(--gap));
  }
  .news :global(.bubble) { margin-bottom: 0; }
</style>
