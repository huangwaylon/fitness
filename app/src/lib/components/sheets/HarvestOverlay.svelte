<script lang="ts">
  // 日曜の収穫 (Sunday harvest overlay, v5 §4, ≤ 60 s): tally → rung reached (optional) → 壺に入れる → end card.
  // The island stays visible behind a light cool tint; しずえ's dialogue box, one card (rows: villager icon, the four
  // official fruit by ripeness, + ¥) and the CTA sit at the bottom, in the thumb zone. The jar total is the one
  // big number. A real modal (U9): a native <dialog> opened with showModal() (inert background, focus trap; Esc = あとで).
  // Round 5: only the team's stars (U7); the purse is one line under the total (U6); after 壺に入れる the end card
  // fills the jar (the one jar drawing) and counts its total up before going back to 島 (U5). No confetti (not in
  // the games): the end card plays an item-get beat (the jar pops, a sparkle).
  import type { HarvestView, PersonId, WeekView } from '#lib/types.ts';
  import { FRUITS, RUNGS } from '#lib/config/rules.ts';
  import Villager from '../characters/Villager.svelte';
  import Avatar from '../characters/Avatar.svelte';
  import Emote from '../characters/Emote.svelte';
  import { Tween, prefersReducedMotion } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';
  import Yen from '../ui/Yen.svelte';
  import Bubble from '../ui/Bubble.svelte';
  import Jar, { jarFill } from '../island/Jar.svelte';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import { confirmHarvest } from '#lib/store/actions.ts';
  import { fruitArt } from '#lib/art.ts';
  import { ripeness } from './ripeness.ts';
  import { t, formatYen } from '#lib/i18n/index.ts';
  import { lockScroll } from '../ui/scrollLock.ts';

  interface Props {
    view: WeekView;
    harvest: HarvestView;
    onlater: () => void;
    /** Called before the harvest is confirmed: keep the overlay up for the end card. */
    onkeep?: () => void;
    /** The end card's 島へもどる. */
    ondone?: () => void;
  }
  let { view, harvest, onlater, onkeep, ondone }: Props = $props();

  const me = $derived(view.me);
  const partner = $derived(view.partner);
  const p = $derived(harvest.payout);
  const jarTotal = $derived(p.A.fruitYen + p.B.fruitYen + p.teamYen);
  const purseTotal = $derived(p.A.purseYen + p.B.purseYen);
  const rungKey = $derived(harvest.rungsReached.at(-1) ?? null);
  const rung = $derived(rungKey ? RUNGS.find((r) => r.key === rungKey) ?? null : null);
  const nextRung = $derived(rung ? RUNGS.find((r) => r.yen > rung.yen) ?? null : null);

  let step = $state<'tally' | 'rung' | 'done'>('tally');

  /** End card: the jar total counts up from before this harvest to after it, and the jar fills. */
  const after = $derived(view.jar.totalYen);
  const before = $derived(Math.max(0, after - jarTotal));
  /** The jar's one fill rule (Jar.svelte); this harvest is a lighter band on top, ≥ 10% of the glass tall. */
  const newFill = $derived(jarFill(after, view.jar));
  const oldFill = $derived(Math.max(0, Math.min(jarFill(before, view.jar), newFill - 0.1)));
  const shown = new Tween(0, { duration: 1400, easing: cubicOut });
  let filled = $state(false);
  const partnerDone = $derived(harvest.confirmedBy.includes(partner));

  /** The end card: the band fills and the total counts up (at once under reduced motion, live: review P10). */
  function countUp() {
    shown.set(before, { duration: 0 });
    if (prefersReducedMotion.current) {
      shown.set(after, { duration: 0 });
      filled = true;
      return;
    }
    requestAnimationFrame(() => (filled = true));
    shown.set(after, { delay: 500 });
  }
  $effect(() => {
    if (prefersReducedMotion.current && step === 'done') shown.set(after, { duration: 0 });
  });

  function drop() {
    onkeep?.();
    const r = confirmHarvest();
    if (r.ok) {
      step = 'done';
      countUp();
    }
  }

  const people: PersonId[] = $derived([me, partner]);
  /** The fruits' ripeness, when the view is still the harvested week (Sunday evening); else plain icons. */
  const sameWeek = $derived(view.weekKey === harvest.weekKey);

  function modal(node: HTMLDialogElement) {
    if (!node.open) node.showModal?.();
    node.focus();
    // the island behind stays put while the overlay is up (round 10 H2)
    return { destroy: lockScroll() };
  }
  const steps = $derived<('tally' | 'rung' | 'done')[]>(rung ? ['tally', 'rung', 'done'] : ['tally', 'done']);
  const hostLine = $derived(step === 'tally' ? t('harvest.hello') : step === 'rung' ? t('harvest.rungReached') : t('harvest.doneHost'));
  /** Island-evaluation stars (§T.5): ceil(score / 20), 0–5; shown only as the pair's total (★ out of 10). */
  const stars = (score: number) => Math.max(0, Math.min(5, Math.ceil(score / 20)));
  const teamStars = $derived(stars(p.A.score) + stars(p.B.score));
</script>

<dialog class="overlay" aria-label={t('harvest.title')} tabindex="-1" use:modal
  oncancel={(e) => { e.preventDefault(); if (step === 'done') ondone?.(); else onlater(); }}>

  <div class="col">
    <div class="head">
      <span class="plate">{t('harvest.title')}</span>
      <span class="steps" aria-hidden="true">{#each steps as s (s)}<i class:on={s === step}></i>{/each}</span>
      {#if step !== 'done'}<button type="button" class="later" onclick={onlater}>{t('common.later')}</button>{:else}<span class="later-sp"></span>{/if}
    </div>

    <div class="bottom">
      <Bubble text={hostLine} host={false} />

      {#if step === 'tally'}
        <section class="card tally" aria-live="polite">
          {#each people as who, i (who)}
            {@const pv = view.people[who]}
            <div class="trow" style="animation-delay:{0.3 + i * 0.6}s">
              <Avatar person={who} villager={pv.villager} size={40} />
              <span class="who">
                <b class="nm">{pv.villagerName}</b>
                <span class="frs" aria-hidden="true">
                  {#each FRUITS as f (f)}<span class="fr {sameWeek ? ripeness(pv.fruits[f].pct) : ''}"><OfficialArt key={fruitArt(f)} size="var(--fr)" /></span>{/each}
                </span>
              </span>
              <b class="plus money">+{formatYen(p[who].fruitYen)}</b>
            </div>
          {/each}
          <div class="trow" style="animation-delay:1.5s">
            <span class="av team"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.6l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z" /></svg></span>
            <span class="who"><b class="nm">{t('harvest.team')}</b>
              <span class="stars" role="img" aria-label="{t('harvest.teamStars')} ★{teamStars}/10"><span aria-hidden="true">★ {teamStars}/10</span></span>
            </span>
            <b class="plus money">+{formatYen(p.teamYen)}</b>
          </div>
          <div class="total">
            <span class="lbl">{t('harvest.jar')} <small>{t('harvest.provisional')}</small></span>
            <Yen yen={jarTotal} class="hero-num" />
            {#if purseTotal > 0}<span class="mini">{t('harvest.purse')} <b class="money">+{formatYen(purseTotal)}</b></span>{/if}
          </div>
        </section>
        {#if rung}<button type="button" class="btn" onclick={() => (step = 'rung')}>{t('common.next')}</button>
        {:else}<button type="button" class="btn" onclick={drop}>{t('harvest.drop')}</button>{/if}
      {:else if step === 'rung' && rung}
        <section class="card rung">
          <div class="hero">
            <span class="port"><OfficialArt key="deco/airport" width="100%" /></span>
            <span class="v v1"><span class="re"><Emote id="mark-sparkle" bare hold size={30} /></span><Villager person={me} size={64} expression="cheer" /></span>
            <span class="v v2"><span class="re"><Emote id="mark-heart" bare hold size={30} /></span><Villager person={partner} size={64} expression="cheer" /></span>
          </div>
          <b class="rname">{t('rung.' + rung.key)}</b>
          <span class="hero-num">{formatYen(rung.yen)}</span>
          {#if nextRung}<span class="mini">{t('harvest.nextRung', { place: t('rung.' + nextRung.key), yen: formatYen(nextRung.yen) })}</span>{/if}
        </section>
        <button type="button" class="btn" onclick={drop}>{t('harvest.drop')}</button>
      {:else if step === 'done'}
        <section class="card done" role="status">
          <span class="djar"><span class="get" aria-hidden="true"><Emote id="mark-sparkle" bare hold size={28} /></span><Jar fill={oldFill} band={filled ? newFill : oldFill} width="80px" /></span>
          <b class="dhead">{t('harvest.done', { yen: formatYen(jarTotal) })}</b>
          <span class="hero-num">{formatYen(Math.round(shown.current))}</span>
          {#if !partnerDone}<span class="mini">{t('harvest.waiting', { name: view.people[partner].villagerName })}</span>{/if}
        </section>
        <button type="button" class="btn" onclick={() => ondone?.()}>{t('harvest.home')}</button>
      {/if}
    </div>
  </div>
</dialog>

<style>
  /* The island stays visible (v5 §4) under a cool tint (F3) that fades in below the sky: by day a light
     periwinkle over the sea and island only, so the clouds stay white and the sun yellow; softer at night. */
  .overlay {
    position: fixed; inset: 0; z-index: 60; overflow: hidden auto; overscroll-behavior: contain;
    width: 100%; height: 100%; max-width: none; max-height: none; margin: 0; padding: 0; border: 0;
    --fr: clamp(20px, 6.4vw, 30px); color: var(--text);
    background: linear-gradient(to bottom, rgba(58, 72, 134, 0) 22%, rgba(58, 72, 134, .18) 48%);
    animation: fade var(--dur-base) var(--ease-soft);
  }
  :global(:root[data-tod='night']) .overlay { background: rgba(30, 36, 80, .16); }
  .overlay:focus { outline: none; }
  .overlay::backdrop { background: transparent; }
  @keyframes fade { from { opacity: 0; } to { opacity: 1; } }
  .col {
    position: relative; z-index: 1; max-width: 440px; margin: 0 auto; min-height: 100%; display: flex; flex-direction: column; justify-content: space-between; gap: 12px;
    padding: calc(var(--safe-top) + 12px) calc(var(--side) + var(--safe-right)) var(--pad-bottom) calc(var(--side) + var(--safe-left));
  }
  .head { display: flex; justify-content: space-between; align-items: center; min-height: 44px; gap: 8px; }
  .steps { display: flex; gap: 6px; }
  .steps i { width: 8px; height: 8px; border-radius: 50%; background: color-mix(in srgb, var(--c-cream) 60%, transparent); transition: all var(--dur-base) var(--ease-bounce); }
  .steps i.on { width: 22px; border-radius: 4px; background: var(--c-yuzu); }
  .later, .later-sp { min-width: 80px; }
  .later {
    appearance: none; border: 0; cursor: pointer; min-height: 44px; padding: 0 16px; border-radius: var(--r-btn);
    background: var(--c-cream); color: var(--c-ink); box-shadow: 0 var(--lip-h) 0 var(--c-lip); font: 700 var(--fs-body)/1 var(--font-ui);
  }
  .bottom { display: grid; gap: var(--gap); --talk-lines: 2; }
  .bottom :global(.talk) { margin-bottom: -4px; }

  .tally { display: grid; padding: 8px 16px 14px; }
  /* Rows grow in one by one, so the card grows with them (no empty height while revealing). */
  .trow { display: flex; align-items: center; gap: 10px; overflow: hidden; animation: rowGrow .5s var(--ease-soft) both; }
  @keyframes rowGrow { from { max-height: 0; opacity: 0; padding-block: 0; } to { max-height: 110px; opacity: 1; padding-block: 6px; } }
  .who { flex: 1; min-width: 0; display: grid; gap: 3px; }
  .nm { font-size: var(--fs-body); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .frs { display: flex; gap: 3px; }
  .fr { display: block; flex: none; line-height: 0; }
  .fr.bud { opacity: .55; filter: saturate(.3); }
  .fr.small { opacity: .8; filter: saturate(.7); }
  .stars { font: 700 var(--fs-body)/1 var(--font-num); color: var(--text-soft); }
  .av { width: 40px; height: 40px; flex: none; border-radius: 50%; background: color-mix(in srgb, var(--c-yuzu) 45%, var(--c-cream)); display: grid; place-items: center; }
  .av.team svg { width: 24px; height: 24px; fill: var(--c-yuzu-lip); }
  .plus { font-size: var(--fs-talk); flex: none; }

  .total { display: grid; justify-items: center; gap: 4px; padding-top: 10px; margin-top: 6px; box-shadow: 0 -2px 0 color-mix(in srgb, var(--lip) 50%, transparent); overflow: hidden; animation: totalGrow .6s var(--ease-soft) 2.1s both; }
  /* Like the rows, the total takes no room until it arrives, so the card is always sized to what it shows (round 7 F11). */
  @keyframes totalGrow { from { max-height: 0; opacity: 0; padding-top: 0; margin-top: 0; } to { max-height: 220px; opacity: 1; padding-top: 10px; margin-top: 6px; } }
  .lbl { font-weight: 700; color: var(--text-soft); }
  .lbl small { font-size: var(--fs-s); }
  .total :global(.hero-num) { animation: if-pop var(--dur-pop) var(--ease-bounce) 2.3s both; }
  .mini { font-weight: 700; font-size: var(--fs-body); color: var(--text-soft); }

  .done, .rung { display: grid; justify-items: center; gap: 6px; text-align: center; }
  /* NH's item-get beat instead of confetti: the jar pops up with a sparkle over it. */
  .djar { position: relative; display: block; line-height: 0; animation: if-pop var(--dur-pop) var(--ease-bounce) both; }
  .get { position: absolute; right: -18px; top: -10px; line-height: 0; animation: if-pop var(--dur-pop) var(--ease-bounce) .3s both; }
  .dhead, .rname { font-size: var(--fs-title); }

  .hero { position: relative; width: min(220px, 64vw); padding-bottom: 6px; animation: if-pop var(--dur-pop) var(--ease-bounce) both; }
  .port { display: block; }
  .v { position: absolute; bottom: 0; display: grid; justify-items: center; }
  .v1 { left: -8%; }
  .v2 { right: -8%; }
  .re { line-height: 0; animation: if-pop var(--dur-pop) var(--ease-bounce) .5s both; }

  @media (max-height: 700px), (max-width: 359px) {
    .hero { width: min(160px, 50vw); }
  }
</style>
