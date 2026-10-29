<script lang="ts">
  // 島 Island (style guide v4 §R.1): the scene (height = 100dvh − the chrome below it), one しずえ line,
  // ONE primary action (今夜のチェック) in the thumb zone. A pending 「筋トレでしたか？」 is asked in しずえ's
  // bubble and two chips take the button's slot (same height, no jump). After today's check-in the button
  // goes quiet. Tap my villager → check-in sheet; the partner → partner sheet.
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import type { FruitKey } from '#lib/types.ts';
  import { FRUITS } from '#lib/config/rules.ts';
  import IslandScene from '#lib/components/island/IslandScene.svelte';
  import { emit } from '#lib/components/motion/bus.svelte.ts';
  import Bubble from '#lib/components/Bubble.svelte';
  import CheckinSheet from '#lib/components/CheckinSheet.svelte';
  import HelpButton from '#lib/components/HelpButton.svelte';
  import PartnerSheet from '#lib/components/PartnerSheet.svelte';
  import SyncPill from '#lib/components/SyncPill.svelte';
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
  const grew = $derived(me && before ? (FRUITS.find((f) => me.fruits[f].pct > before![f]) ?? null) : null);

  /** U8: the unripe fruit closest to ripe, as "{fruit}, {n} more {unit}". Needs my raw numbers. */
  const UNIT: Record<FruitKey, string> = { peach: 'nearly_min', coconut: 'nearly_day', apple: 'nearly_day', pear: 'nearly_tick' };
  function nearlyLine(): string | null {
    if (!me) return null;
    const open = FRUITS.filter((f) => me.fruits[f].pct < 100 && me.fruits[f].target !== undefined && me.fruits[f].actual !== undefined);
    if (!open.length) return null;
    const f = open.reduce((a, b) => (me.fruits[b].pct > me.fruits[a].pct ? b : a));
    const n = Math.ceil((me.fruits[f].target ?? 0) - (me.fruits[f].actual ?? 0));
    return n > 0 ? hostLine(UNIT[f], { activity: f, n }) : null;
  }

  const line = $derived.by(() => {
    if (!view) return '';
    if (pending) return t('pending.ask', { label: pending.label });
    if (said) return said.text;
    // After my 壺に入れる (also in demo, whose host key is fixed): 「まめさんの番です！」 until they drop theirs.
    if (view.harvest?.confirmedBy.includes(view.me)) return hostLine('harvest_waiting', { name: view.people[view.partner].villagerName });
    const key = view.juniper.key.replace(/^(juniper|host)\./, '');
    if (key === 'harvest_ready' || key === 'harvest_waiting' || key === 'payday') return hostLine(key, view.juniper.params);
    if (grew) return hostLine('grew', { fruit: grew, activity: grew });
    if (key === 'default' || key === 'pending_confirm') return nearlyLine() ?? hostLine('default');
    return hostLine(key, view.juniper.params);
  });

  // はい counts it at once (the store recomputes the fruit); しずえ says so and my villager hops.
  function answer(yes: boolean) {
    if (!pending) return;
    confirmPending(pending.kind, pending.id, yes);
    const msg = { text: yes ? t('pending.counted', { activity: t('fruit.coconut') }) : t('pending.skipped'), id: Date.now() };
    said = msg;
    setTimeout(() => said?.id === msg.id && (said = null), 5000);
    if (yes) emit('checkin-saved');
  }

  function openCheckin() {
    if (me) before = Object.fromEntries(FRUITS.map((f) => [f, me.fruits[f].pct])) as Record<FruitKey, number>;
    checkinOpen = true;
  }

  // Closing the check-in sheet with today ticked → my villager hops (R2, style guide §M.5).
  function celebrate() {
    if (checkedIn) emit('checkin-saved');
  }

  // The partner sheet has closed by now, so R4 plays in the scene behind it.
  function sendHighFive() {
    if (!view) return;
    highFive();
    week.showToast(t('island.highfiveSent', { name: view.people[view.partner].villagerName }), 1800, { reaction: 'encouraging' });
    emit('highfive-sent');
  }

  // A failed save (the store's toast) → my villager looks sheepish (R17).
  $effect(() => {
    if (week.toast?.text === t('state.saveFailed')) emit('sync-error');
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
      setTimeout(() => {
        const toast = { text: t('island.highfiveGot', { name: v.people[v.partner].villagerName }), id: Date.now() };
        fiveToast = toast;
        setTimeout(() => fiveToast === toast && (fiveToast = null), 3200);
      }, 700);
    }
  });
</script>

{#if view}
  <main class="island">
    <div class="top">
      <IslandScene {view} onpartner={() => (partnerOpen = true)} onme={openCheckin} onjar={() => goto(resolve('/jar'))}
        paused={checkinOpen || partnerOpen || phoneOpen} />
    </div>
    <div class="status-row">
      <SyncPill />
      <HelpButton bind:open={phoneOpen} />
    </div>

    <div class="below">
      <Bubble text={line} host={pending ? 'stand' : 'wave'} />

      <!-- One primary action in the thumb zone. A pending question swaps in two chips, same slot. -->
      <div class="slot">
        {#if pending}
          <button type="button" class="btn" onclick={() => answer(true)}>{t('common.yes')}</button>
          <button type="button" class="btn paper" onclick={() => answer(false)}>{t('common.no')}</button>
        {:else}
          <button type="button" class="btn" class:paper={allChecked} onclick={openCheckin}>
            {#if allChecked}<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-check" /></svg>{t('island.checkedIn')}
            {:else if checkedIn}<svg viewBox="0 0 48 48" aria-hidden="true"><use href="#i-bowl" /></svg>{t('island.checkinLeft', { n: habitCount - ticksToday })}
            {:else}<svg viewBox="0 0 48 48" aria-hidden="true"><use href="#i-bowl" /></svg>{t('island.checkin')}{/if}
          </button>
        {/if}
      </div>
    </div>
  </main>
  <CheckinSheet bind:open={checkinOpen} onclose={celebrate} />
  <PartnerSheet bind:open={partnerOpen} onhighfive={sendHighFive} />
  {#if fiveToast && !ui.overlay && !week.toast}
    {#key fiveToast.id}<Toast text={fiveToast.text} person={view.partner} reaction="love" />{/key}
  {/if}
{/if}

<style>
  /* §R.1: the scene takes what the chrome below leaves (sky absorbs the difference); nothing scrolls. */
  .island {
    --chrome-below: calc(3 * var(--gap) + var(--host-h) + var(--cta-h) + var(--dock-h) + var(--dock-bottom));
    --scene-h: clamp(300px, calc(100dvh - var(--chrome-below)), 600px);
    position: relative; max-width: var(--col); margin: 0 auto; height: 100dvh; overflow: hidden;
  }
  .top { position: relative; height: var(--scene-h); overflow: hidden; display: flex; flex-direction: column; justify-content: flex-end; container-type: inline-size; }
  .below {
    display: grid; gap: var(--gap); padding: var(--gap) calc(var(--side) + var(--safe-right)) 0 calc(var(--side) + var(--safe-left));
  }
  .below > :global(.talk) { height: var(--host-h); align-items: flex-end; }
  .slot { display: flex; gap: 10px; height: var(--cta-h); }
  .slot .btn { margin-bottom: 0; }
</style>
