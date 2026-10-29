<script lang="ts">
  // 島 Island (v5 §3): the scene full bleed under a light HUD (clock, NookPhone, the score ribbon = the one
  // focal point) and ONE action (今夜のチェック) in the thumb zone. しずえ's dialogue box shows only when she
  // has news (a pending question, harvest, payday, "grew", an answer just given); a pending 「筋トレでしたか？」
  // puts NH's choice list in the action's slot. Tap the jar → 旅の壺; my villager → check-in; the partner → sheet.
  import { onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import type { FruitKey } from '#lib/types.ts';
  import { FRUITS } from '#lib/config/rules.ts';
  import IslandScene from '#lib/components/island/IslandScene.svelte';
  import { emit } from '#lib/components/motion/bus.svelte.ts';
  import Bubble from '#lib/components/Bubble.svelte';
  import CheckinSheet from '#lib/components/CheckinSheet.svelte';
  import ChoiceList from '#lib/components/ChoiceList.svelte';
  import Hud from '#lib/components/Hud.svelte';
  import PartnerSheet from '#lib/components/PartnerSheet.svelte';
  import Toast from '#lib/components/Toast.svelte';
  import { week } from '#lib/client/week.svelte.ts';
  import { ui } from '#lib/client/ui.svelte.ts';
  import { highFive, confirmPending } from '#lib/client/actions.ts';
  import { t, hostLine } from '#lib/i18n/index.ts';

  let checkinOpen = $state(false);
  let partnerOpen = $state(false);
  let phoneOpen = $state(false);
  /** The partner's high-five toast (their icon, not しずえ's; U6). */
  let fiveToast = $state<{ text: string; id: number } | null>(null);
  /** My fruit % when the check-in sheet opened, to name the fruit that actually grew (U7). */
  let before = $state<Record<FruitKey, number> | null>(null);

  const view = $derived(week.view);
  const me = $derived(view ? view.people[view.me] : null);
  const pending = $derived(view?.pending[0] ?? null);
  /** Today's ticks out of 3: the button says how many are left, and only 3/3 reads as done (round 5 U4). */
  const ticksToday = $derived(view ? (me?.habits?.ticksByDate[view.today] ?? []).length : 0);
  const habitCount = $derived(me?.habits?.keys.length ?? 3);
  const checkedIn = $derived(ticksToday > 0);
  const allChecked = $derived(ticksToday >= habitCount);
  /** しずえ says what an answer just did (U3), for a few seconds; then her usual line again. */
  let said = $state<{ text: string; id: number } | null>(null);

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
  const grew = $derived(me && before ? (FRUITS.find((f) => me.fruits[f].pct > before![f]) ?? null) : null);

  /** "Grew" is news for a few seconds after the check-in sheet closes. */
  let grewNews = $state<FruitKey | null>(null);

  /** しずえ's news, or null (then she stays away and the island is HUD-light). */
  const news = $derived.by((): string | null => {
    if (!view) return null;
    if (pending) return t('pending.ask', { label: pending.label });
    if (said) return said.text;
    // After my 壺に入れる (also in demo, whose host key is fixed): 「うめさんの番です！」 until they drop theirs.
    if (view.harvest?.confirmedBy.includes(view.me)) return hostLine('harvest_waiting', { name: view.people[view.partner].villagerName });
    const key = view.juniper.key.replace(/^(juniper|host)\./, '');
    if (key === 'harvest_ready' || key === 'payday') return hostLine(key, view.juniper.params);
    if (grewNews) return hostLine('grew', { fruit: grewNews, activity: grewNews });
    return null;
  });

  // はい counts it at once (the store recomputes the fruit); しずえ says so and my villager hops.
  function answer(yes: boolean) {
    if (!pending) return;
    confirmPending(pending.kind, pending.id, yes);
    const msg = { text: yes ? t('pending.counted', { activity: t('fruit.coconut') }) : t('pending.skipped'), id: Date.now() };
    said = msg;
    later(() => said?.id === msg.id && (said = null), 4000);
    if (yes) emit('checkin-saved');
  }

  function openCheckin() {
    if (me) before = Object.fromEntries(FRUITS.map((f) => [f, me.fruits[f].pct])) as Record<FruitKey, number>;
    checkinOpen = true;
  }

  // Closing the check-in sheet with today ticked → my villager hops (R2, style guide §M.5).
  function celebrate() {
    if (checkedIn) emit('checkin-saved');
    const g = grew;
    if (g) {
      grewNews = g;
      later(() => grewNews === g && (grewNews = null), 6000);
    }
  }

  // The partner sheet has closed by now, so R4 plays in the scene behind it.
  function sendHighFive() {
    if (!view) return;
    highFive();
    week.showToast(t('island.highfiveSent', { name: view.people[view.partner].villagerName }), 1800, { reaction: 'encouraging' });
    emit('highfive-sent');
  }

  // A failed save (the store's toast, by its code, not its wording: review P9) → my villager looks sheepish (R17).
  $effect(() => {
    if (week.toast?.code === 'save-failed') emit('sync-error');
  });

  // M5: tell me when my partner sent a high-five today (once per new one, per device), but not over
  // the harvest: wait until it closes (U6), and not over another banner: one at a time (round 5 U13).
  $effect(() => {
    const v = week.view;
    if (!v || v.highFivesToday <= 0 || ui.overlay || week.toast) return;
    const k = `hf-seen:${v.today}`;
    const seen = Number(localStorage.getItem(k) ?? 0);
    if (v.highFivesToday > seen) {
      localStorage.setItem(k, String(v.highFivesToday));
      later(() => {
        const toast = { text: t('island.highfiveGot', { name: v.people[v.partner].villagerName }), id: Date.now() };
        fiveToast = toast;
        later(() => fiveToast === toast && (fiveToast = null), 3200);
      }, 700);
    }
  });
</script>

{#if view && me}
  <main class="island" class:covered={ui.overlay}>
    <div class="top">
      <IslandScene {view} onpartner={() => (partnerOpen = true)} onme={openCheckin} onjar={() => goto(resolve('/jar'))}
        paused={checkinOpen || partnerOpen || phoneOpen} />
      <Hud score={me.score} today={view.today} bind:phoneOpen />
    </div>

    <!-- F1: one fixed slot under the scene (round 6 band table): しずえ's box on top when she has news, the action
         below; a question puts the box and NH's choice list in one row. The slot never changes height. -->
    <div class="below" class:ask={!!pending}>
      {#if news}
        <div class="news">
          <Bubble text={news} host={false} />
          {#if pending}
            <ChoiceList choices={[{ label: t('common.yes'), run: () => answer(true) }, { label: t('common.no'), run: () => answer(false) }]} />
          {/if}
        </div>
      {/if}
      {#if !pending}
        <button type="button" class="btn" class:paper={allChecked} onclick={openCheckin}>
          {#if allChecked}<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-check" /></svg>{t('island.checkedIn')}
          {:else if checkedIn}{t('island.checkinLeft', { n: habitCount - ticksToday })}
          {:else}{t('island.checkin')}{/if}
        </button>
      {/if}
    </div>
  </main>
  <CheckinSheet bind:open={checkinOpen} onclose={celebrate} />
  <PartnerSheet bind:open={partnerOpen} onhighfive={sendHighFive} />
  {#if fiveToast && !ui.overlay && !week.toast}
    {#key fiveToast.id}<Toast text={fiveToast.text} person={view.partner} reaction="love" />{/key}
  {/if}
{/if}

<style>
  /* v5 §3 + round 6 F1 (band table): the chrome under the scene is ONE fixed slot, tall enough for しずえ's box
     (--talk-lines lines + nameplate) over the action (or the box + the choice list in one row), on the flat map
     sea. Its height is a constant per viewport, so the scene (100dvh − --chrome-below, stage bottom-anchored)
     never moves when she speaks or goes quiet. ≈ 176 at 393×852, 150 at 375×667, 142 at 320×568. */
  .island {
    --talk-h: calc(var(--talk-lines) * var(--fs-talk) * 1.5 + 20px + 14px + var(--lip-h));
    --chrome-below: calc(var(--talk-h) + 8px + var(--cta-h) + var(--lip-h) + var(--gap) + var(--pad-bottom));
    --scene-h: max(300px, calc(100dvh - var(--chrome-below)));
    position: relative; max-width: var(--col); margin: 0 auto; height: 100dvh; overflow: hidden;
    display: flex; flex-direction: column;
  }
  .top { position: relative; height: var(--scene-h); flex: none; overflow: hidden; display: flex; flex-direction: column; justify-content: flex-end; }
  .below {
    height: var(--chrome-below); flex: none; display: flex; flex-direction: column; justify-content: flex-end; gap: 8px;
    padding: var(--gap) calc(var(--side) + var(--safe-right)) calc(var(--pad-bottom) + var(--lip-h)) calc(var(--side) + var(--safe-left));
  }
  /* Under the harvest only the island shows through the tint: no HUD, no dialogue, no action. */
  .covered :global(.hud), .covered :global(.ribbon-wrap), .covered .below { visibility: hidden; }
  .news { display: grid; }
  .news :global(.bubble) { margin-bottom: 0; }
  /* A question: the box and the choices stacked on its right share one row (the action's slot is theirs). */
  .ask .news { grid-template-columns: 1fr auto; gap: 10px; align-items: end; --talk-lines: 2; }
</style>
