<script lang="ts">
  // 日曜の収穫 (Sunday harvest overlay, ADR 0019 §4, ≤ 60 s): the week's recap → the bonus lands in the wallet.
  // The island stays visible behind a light cool tint; しずえ's dialogue box, one card and the CTA sit at the bottom,
  // in the thumb zone. Recap (round 17 IA §4.6): per person the five badges (ADR 0021; lit = met, +badges.bells each)
  // under one 「バッジ」 label and their bonus, then ふたりボーナス (+duoPerBadge for each badge both met) and the
  // week's bonus as the one big number. 「受け取る」 is a ceremony (the bonus counts either way): it records that I saw
  // it, then the end card drops the bonus into the one shared wallet (ADR 0022): coins fall into the jar, a +N pops and
  // fades, and the balance counts up (the one resting number). No confetti (not in the games): an item-get beat.
  // A real modal (U9): a native <dialog> opened with showModal() (inert background, focus trap; Esc = あとで).
  import type { HarvestView, PersonId, WeekView } from '#lib/types.ts';
  import { RING_FRUITS, RULES } from '#lib/config/rules.ts';
  import Avatar from '../characters/Avatar.svelte';
  import Emote from '../characters/Emote.svelte';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import { Tween, prefersReducedMotion } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';
  import Bells from '../ui/Bells.svelte';
  import Bubble from '../ui/Bubble.svelte';
  import NavButton from '../ui/NavButton.svelte';
  import BadgeRow from '../ui/BadgeRow.svelte';
  import Jar from '../island/Jar.svelte';
  import { walletFill } from '../wallet/fill.ts';
  import { confirmHarvest } from '#lib/store/actions.ts';
  import { formatBells, formatNum, t } from '#lib/i18n/index.ts';
  import { lockScroll } from '../ui/scrollLock.ts';
  import { cue } from '#lib/sound/cues.ts';

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
  const people: PersonId[] = $derived([me, partner]);
  const b = $derived(harvest.bonus);
  const bonusTotal = $derived(b.A + b.B + b.duo);

  /** Each person's five badges for the harvested week. */
  const badges = $derived(harvest.ringBadges);

  let step = $state<'tally' | 'done'>('tally');

  /** End card: the wallet counts up from before the bonus to now (at once under reduced motion). */
  const shown = new Tween(0, { duration: 1400, easing: cubicOut });
  const partnerDone = $derived(harvest.confirmedBy.includes(partner));

  function countUp() {
    const after = view.wallet.balance;
    shown.set(Math.max(0, after - bonusTotal), { duration: 0 });
    shown.set(after, prefersReducedMotion.current ? { duration: 0 } : { delay: 700 });
  }

  function receive() {
    onkeep?.();
    const r = confirmHarvest();
    if (r.ok) {
      step = 'done';
      countUp();
      // the item-get fanfare (it ducks the music); the coins fall into the jar silently under it: NH's item-get
      // plays alone (round 14 review R3)
      cue('harvest-receive');
    } else cue('boop');
  }

  // Sounds (docs/design/sound.md §5): the badges reveal one by one (BadgeRow stagger 0.5 s + 0.6 s per person +
  // 0.15 s per fruit); once the last one is up, NH's Nook Miles achievement jingle if any badge was met.
  const anyBadge = $derived(people.some((p) => RING_FRUITS.some((f) => badges[p][f])));
  $effect(() => {
    if (step !== 'tally' || !anyBadge) return;
    const id = setTimeout(() => cue('badge-met'), (0.5 + 0.6 + RING_FRUITS.length * 0.15 + 0.1) * 1000);
    return () => clearTimeout(id);
  });

  function modal(node: HTMLDialogElement) {
    if (!node.open) node.showModal?.();
    node.focus();
    // the island behind stays put while the overlay is up (round 10 H2)
    return { destroy: lockScroll() };
  }
  const hostLine = $derived(step === 'tally' ? t('harvest.hello') : t('harvest.doneHost'));
</script>

<dialog class="overlay" aria-label={t('harvest.title')} tabindex="-1" use:modal
  oncancel={(e) => { e.preventDefault(); cue('back'); if (step === 'done') ondone?.(); else onlater(); }}>

  <div class="col">
    <div class="head">
      <span class="plate">{t('harvest.title')}</span>
      <span class="steps" aria-hidden="true">{#each ['tally', 'done'] as s (s)}<i class:on={s === step}></i>{/each}</span>
      {#if step !== 'done'}<NavButton kind="close" label={t('common.later')} onclick={onlater} />{:else}<span class="later-sp"></span>{/if}
    </div>

    <div class="bottom">
      <Bubble text={hostLine} host={false} />

      {#if step === 'tally'}
        <section class="card tally" aria-live="polite">
          <span class="bl">{t('badge.title')}</span>
          {#each people as who, i (who)}
            {@const pv = view.people[who]}
            <div class="trow" style="animation-delay:{0.3 + i * 0.6}s">
              <Avatar person={who} villager={pv.villager} size={40} />
              <span class="who">
                <b class="nm">{pv.villagerName}</b>
                <BadgeRow badges={badges[who]} size="var(--fr)" stagger={0.5 + i * 0.6} />
              </span>
              <b class="plus money">{formatBells(b[who], { signed: true })}</b>
            </div>
          {/each}
          <div class="trow duo" class:got={b.duo > 0} style="animation-delay:1.5s">
            <span class="av"><OfficialArt key="money/miles" size={30} /></span>
            <span class="who"><b class="nm">{t('harvest.duo')}</b>
              <small class="hint">{t('harvest.duoHint', { bells: formatBells(RULES[RULES.length - 1].badges.duoPerBadge) })}</small>
            </span>
            <b class="plus money">{b.duo > 0 ? formatBells(b.duo, { signed: true }) : '—'}</b>
          </div>
          <div class="total">
            <span class="lbl">{t('harvest.bonus')}</span>
            <Bells bells={bonusTotal} signed class="hero-num" />
          </div>
        </section>
        <button type="button" class="btn" data-sfx="self" onclick={receive}>{t('harvest.receive')}</button>
      {:else}
        <section class="card done" role="status">
          <b class="dhead">{t('harvest.done')}</b>
          <div class="pot" style:--d="0.3s">
            <span class="drop" aria-hidden="true">
              {#each [0, 1, 2] as k (k)}<i style:animation-delay="calc(var(--d) + {k * 0.12}s)"></i>{/each}
            </span>
            <span class="pic"><Jar fill={walletFill(shown.current)} width="52px" />
              <span class="get"><Emote id="mark-sparkle" bare hold size={24} /></span></span>
            <b class="add money">{formatBells(bonusTotal, { signed: true })}</b>
            <span class="bal money">{formatNum(shown.current)}<small>{t('bells.unit')}</small></span>
          </div>
          {#if !partnerDone}<span class="mini">{t('harvest.waiting', { name: view.people[partner].villagerName })}</span>{/if}
        </section>
        <button type="button" class="btn" data-sfx="confirm" onclick={() => ondone?.()}>{t('harvest.home')}</button>
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
    --fr: clamp(18px, 5.4vw, 26px); color: var(--text);
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
  .later-sp { width: var(--hit); }
  .bottom { display: grid; gap: var(--gap); --talk-lines: 2; }
  .bottom :global(.talk) { margin-bottom: -4px; }

  .tally { display: grid; padding: 8px 16px 14px; }
  .bl { font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); padding-top: 2px; }
  /* Rows grow in one by one, so the card grows with them (no empty height while revealing). */
  .trow { display: flex; align-items: center; gap: 10px; overflow: hidden; animation: rowGrow .5s var(--ease-soft) both; }
  @keyframes rowGrow { from { max-height: 0; opacity: 0; padding-block: 0; } to { max-height: 110px; opacity: 1; padding-block: 6px; } }
  .who { flex: 1; min-width: 0; display: grid; gap: 4px; justify-items: start; }
  .nm { font-size: var(--fs-body); max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .hint { font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  .av { width: 40px; height: 40px; flex: none; border-radius: 50%; background: color-mix(in srgb, var(--c-yuzu) 45%, var(--c-cream)); display: grid; place-items: center; line-height: 0; }
  .duo:not(.got) .av { filter: saturate(.2); opacity: .7; }
  .plus { font-size: var(--fs-talk); flex: none; }
  .duo:not(.got) .plus { color: var(--text-soft); }

  .total { display: grid; justify-items: center; gap: 4px; padding-top: 10px; margin-top: 6px; box-shadow: 0 -2px 0 color-mix(in srgb, var(--lip) 50%, transparent); overflow: hidden; animation: totalGrow .6s var(--ease-soft) 2.1s both; }
  /* Like the rows, the total takes no room until it arrives, so the card is always sized to what it shows (round 7 F11). */
  @keyframes totalGrow { from { max-height: 0; opacity: 0; padding-top: 0; margin-top: 0; } to { max-height: 220px; opacity: 1; padding-top: 10px; margin-top: 6px; } }
  .lbl { font-weight: 700; color: var(--text-soft); }
  .total :global(.hero-num) { animation: if-pop var(--dur-pop) var(--ease-bounce) 2.3s both; }
  .mini { font-weight: 700; font-size: var(--fs-s); color: var(--text-soft); }

  .done { display: grid; justify-items: center; gap: 10px; text-align: center; }
  .dhead { margin-top: -4px; font-size: var(--fs-talk); line-height: 1.3; }
  .pot { position: relative; display: grid; justify-items: center; gap: 2px; padding: 26px 6px 12px; width: 100%; border-radius: var(--r-btn); background: var(--fill-on-surface); }
  .pic { position: relative; line-height: 0; animation: if-pop var(--dur-pop) var(--ease-bounce) var(--d) both; }
  .get { position: absolute; right: -16px; top: -10px; line-height: 0; animation: if-pop var(--dur-pop) var(--ease-bounce) 1s both; }
  /* the +N pops in over the jar as its coins land, then fades: the balance below is the one resting number */
  .add { font-size: var(--fs-talk); color: var(--leaf-text); animation: add-pop 2.6s var(--ease-soft) calc(var(--d) + .2s) both; }
  @keyframes add-pop { 0% { opacity: 0; transform: translateY(6px) scale(.7); } 12% { opacity: 1; transform: none; } 75% { opacity: 1; } 100% { opacity: 0; transform: translateY(-6px); } }
  @media (prefers-reduced-motion: reduce) { .add { animation: none; } }
  .bal { font-size: var(--fs-talk); }
  .bal small { font: 700 .75em/1 var(--font-ui); margin-left: .25em; color: var(--text-soft); }
  /* three coins fall into the jar, one after another (the bonus landing) */
  .drop { position: absolute; left: 50%; top: 0; width: 0; height: 0; }
  .drop i {
    position: absolute; left: -8px; top: -6px; width: 16px; height: 16px; border-radius: 50%;
    background: radial-gradient(circle at 38% 35%, #fff6c4 0 18%, var(--jar-coin) 20% 62%, var(--jar-coin-rim) 64%);
    animation: coin-drop 700ms cubic-bezier(.5, 0, .8, .4) both;
  }
  .drop i:nth-child(2) { left: -16px; } .drop i:nth-child(3) { left: 0; }
  @keyframes coin-drop { 0% { transform: translateY(-40px) scale(.7); opacity: 0; } 20% { opacity: 1; } 85% { opacity: 1; } 100% { transform: translateY(34px) scale(.6); opacity: 0; } }
  @media (prefers-reduced-motion: reduce) { .drop { display: none; } }
</style>
