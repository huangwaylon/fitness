<script lang="ts">
  // 島 Island: the scene full bleed under a light HUD: today's ベル ribbon at the top with the jar (the shared wallet)
  // beside it, the pair centred; the ribbon is the focal point and the door to everything else (tap → the island panel slides down: きろく, むらびと, settings, あそびかた).
  // The day needs zero taps (the Watch and the Shortcut fill the trees);
  // ハイタッチ lives with the partner's villager: a tap on them and mine walks over for it (no card).
  // The app asks no daily questions: the band under the scene is しずえ's, and her dialogue box shows only when she has
  // news (the harvest). Tap the jar → the wallet (ごほうび); a tree → its popup; the partner → a high-five; the say button (bottom right) → the phrase picker.
  import { onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import IslandScene from '#lib/components/island/IslandScene.svelte';
  import { emit } from '#lib/components/motion/bus.svelte.ts';
  import Bubble from '#lib/components/ui/Bubble.svelte';
  import Hud from '#lib/components/island/Hud.svelte';
  import HudJar from '#lib/components/island/HudJar.svelte';
  import { week } from '#lib/store/week.svelte.ts';
  import { ui } from '#lib/ui-state/ui.svelte.ts';
  import { toasts } from '#lib/ui-state/toast.svelte.ts';
  import { t, hostLine } from '#lib/i18n/index.ts';
  import { birthdaysOn } from '#lib/components/island/birthday.ts';
  import { localDateAt } from '#lib/time/dates.ts';
  import { minuteNow } from '#lib/time/clock.ts';
  import type { Who } from '#lib/types.ts';

  let panelOpen = $state(false);
  /** しずえ's box's height while it shows: the island's say button (bottom right) stands over it. */
  let newsH = $state(0);

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
    if (!view) return null;
    // one of our birthdays (island/birthday.ts): 「うめさん、おたんじょうび おめでとう！」 (the harvest still comes first)
    const born = h ? [] : birthdaysOn(localDateAt(minuteNow().getTime()));
    if (born.length) return hostLine('birthday', { name: view.people[born[0]].villagerName });
    if (!h) return null;
    return h.confirmedBy.includes(view.me) ? hostLine('harvest_waiting', { name: view.people[view.partner].villagerName }) : hostLine('harvest_ready');
  });

  /** Whose villager name (the guest's too). */
  const nameOf = (w: Who) => (!view ? '' : w === 'G' ? view.guest.villagerName : view.people[w].villagerName);
  /** The banner's face: whose villager (the guest's too). */
  const faceOf = (w: Who) => w;

  // A tap on another's villager (IslandScene: in place, sent over the relay): the banner, and (the partner) both hop (R4).
  function sendHighFive(who: Who) {
    if (!view) return;
    toasts.show(t('island.highfiveSent', { name: nameOf(who) }), 1800, { person: faceOf(who), reaction: 'encouraging' });
    if (who === (view.viewer === 'G' ? 'A' : view.partner)) emit('highfive-sent');
  }

  // A failed save (the store's toast, by its code, not its wording) → my villager looks sheepish (R17).
  $effect(() => {
    if (toasts.current?.code === 'save-failed') emit('sync-error');
  });

  // My partner's high-five reached this phone (IslandScene: the relay's, live or held while I was away; once each):
  // the banner with their villager, but not over the harvest: it waits until that closes, and not over another
  // banner: one at a time.
  let gotFive = $state<Who | null>(null);
  $effect(() => {
    const v = week.view, from = gotFive;
    if (!from || !v || ui.overlay || toasts.current) return;
    gotFive = null;
    later(() => toasts.show(t('island.highfiveGot', { name: nameOf(from) }), 3200, { person: faceOf(from), reaction: 'love' }), 700);
  });
  // The guest's villager came ashore on my island (its app opened): a banner, NH's 「○○が あそびに きたよ！」
  function guestArrived(name: string) {
    if (!ui.overlay) toasts.show(t('guest.arrived', { name }), 2800, { person: 'G', reaction: 'joy' });
  }
</script>

{#if view && me}
  <main class="island" class:covered={ui.overlay} style:--news-lift={news && newsH ? `calc(${newsH}px + var(--gap) + 4px)` : null}>
    <h1 class="sr-only">{t('app.name')}</h1>
    <!-- DOM order = focus / VoiceOver order = the visual order: the heading, today's ベル, the jar beside it, the scene (trees,
         villagers), then しずえ's box at the bottom. All are absolutely placed, so the order costs no layout; the stacking
         comes from the --z-* scale (tokens.css). -->
    <Hud bells={view.wallet.today} bind:panelOpen>
      {#snippet jar()}
        <HudJar {view} covered={panelOpen || ui.overlay} onjar={() => goto(resolve('/jar'))} {later} />
      {/snippet}
    </Hud>
    <div class="top">
      <IslandScene {view} onhighfive={sendHighFive} onhighfivegot={(who) => (gotFive = who)} onguest={guestArrived} paused={panelOpen} />
    </div>
    <!-- しずえ's box, when she has news, floats over the sea at the bottom, so nothing in the scene moves when she speaks. -->
    {#if news}<div class="news" bind:clientHeight={newsH}><Bubble text={news} host={false} /></div>{/if}
  </main>
{/if}

<style>
  /* The island is centred in the visible ocean, from the horizon down to the bottom of the screen (above the home
     indicator), never under the ribbon: IslandScene centres it between the horizon and --island-bottom, and keeps
     the horizon under --hud-bottom (the ribbon's lip, tokens.css). */
  .island {
    --hud-bottom: calc(var(--hud-top) + var(--hit) + var(--lip-h));
    --island-bottom: var(--safe-bottom);
    --scene-h: var(--vh-fill);
    position: relative; max-width: var(--col); margin: 0 auto; height: var(--vh-fill); overflow: hidden;
  }
  .top { position: absolute; inset: 0; overflow: hidden; }
  /* Under the harvest only the island shows through the tint: no HUD, no dialogue. */
  .covered :global(.hud), .covered :global(.ribbon-wrap), .covered .news { visibility: hidden; }
  /* しずえ's box: over the sea at the bottom, the column's width, above the home indicator */
  .news {
    position: absolute; z-index: var(--z-dock); left: calc(var(--side) + var(--safe-left)); right: calc(var(--side) + var(--safe-right));
    bottom: calc(var(--pad-bottom) + var(--gap));
  }
  .news :global(.bubble) { margin-bottom: 0; }
</style>
