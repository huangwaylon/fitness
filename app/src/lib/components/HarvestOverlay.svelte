<script lang="ts">
  // 日曜の収穫 (Sunday harvest overlay, v5 §4, ≤ 60 s): tally → rung reached (optional) → 壺に入れる → end card.
  // The island stays visible behind a 30% tint; しずえ's dialogue box, one card (rows: villager icon, the four
  // official fruit by ripeness, + ¥) and the CTA sit at the bottom, in the thumb zone. The jar total is the one
  // big number. A real modal (U9): a native <dialog> opened with showModal() (inert background, focus trap; Esc = あとで).
  // Round 5: only the team's stars (U7); the purse is one line under the total (U6); after 壺に入れる the end card
  // fills the jar and counts its total up before going back to 島 (U5).
  import type { HarvestView, PersonId, WeekView } from '#lib/types.ts';
  import { FRUITS, RUNGS } from '#lib/config/rules.ts';
  import Villager from './Villager.svelte';
  import Avatar from './Avatar.svelte';
  import Emote from './Emote.svelte';
  import { reducedMotion } from './motion/clock.ts';
  import Yen from './Yen.svelte';
  import Bubble from './Bubble.svelte';
  import OfficialArt from './OfficialArt.svelte';
  import { confirmHarvest } from '#lib/client/actions.ts';
  import { fruitArt } from '#lib/client/assets.ts';
  import { ripeness } from './FruitRing.svelte';
  import { t, formatYen } from '#lib/i18n/index.ts';

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
  let busy = $state(false);
  /** Live (review P10): the count-up and confetti follow the setting even if it changes while open. */
  const reduced = $derived(reducedMotion());

  /** End card: the jar total counts up from before this harvest to after it, and the jar fills. */
  const after = $derived(view.jar.totalYen);
  const before = $derived(Math.max(0, after - jarTotal));
  /** Jar fill (0–0.82 of the glass, never a solid block); this harvest is a lighter band on top, ≥ 10% tall. */
  const fillOf = (yen: number) => 0.82 * Math.max(0.08, Math.min(1, view.jar.nextRung ? yen / view.jar.nextRung.yen : 1));
  const oldFill = $derived(Math.min(fillOf(before), fillOf(after) - 0.1));
  let shown = $state(0);
  let filled = $state(false);
  const partnerDone = $derived(harvest.confirmedBy.includes(partner));

  function countUp() {
    shown = before;
    if (reduced) {
      shown = after;
      filled = true;
      return;
    }
    const t0 = performance.now();
    const DUR = 1400;
    requestAnimationFrame(() => (filled = true));
    const frame = (now: number) => {
      const k = Math.min(1, (now - t0) / DUR);
      shown = Math.round(before + (after - before) * (1 - (1 - k) ** 3));
      if (reduced) shown = after;
      else if (k < 1 && step === 'done') requestAnimationFrame(frame);
    };
    setTimeout(() => requestAnimationFrame(frame), 500);
  }

  async function drop() {
    busy = true;
    onkeep?.();
    const r = await confirmHarvest();
    busy = false;
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
  }
  const steps = $derived<('tally' | 'rung' | 'done')[]>(rung ? ['tally', 'rung', 'done'] : ['tally', 'done']);
  const hostLine = $derived(step === 'tally' ? t('harvest.hello') : step === 'rung' ? t('harvest.rungReached') : t('harvest.doneHost'));
  /** Island-evaluation stars (§T.5): ceil(score / 20), 0–5; shown only as the pair's total (★ out of 10). */
  const stars = (score: number) => Math.max(0, Math.min(5, Math.ceil(score / 20)));
  const teamStars = $derived(stars(p.A.score) + stars(p.B.score));
  // Confetti (§M.4 colours): 36 pieces, CSS only; skipped under reduced motion.
  const COLOURS = ['var(--c-yuzu)', 'var(--c-leaf)', 'var(--c-mint)', 'var(--c-coral)', 'var(--c-cream)'];
  const CONFETTI = Array.from({ length: 24 }, (_, i) => ({
    x: (i * 37) % 100, c: COLOURS[i % 5], d: (i % 12) * 0.12, r: (i * 53) % 360, round: i % 3 === 0, dur: 2.4 + (i % 5) * 0.3
  }));
</script>

<dialog class="overlay" aria-label={t('harvest.title')} tabindex="-1" use:modal
  oncancel={(e) => { e.preventDefault(); if (step === 'done') ondone?.(); else onlater(); }}>
  {#key step}
    {#if !reduced}<div class="confetti" aria-hidden="true">
      {#each CONFETTI as c, i (i)}<i class:round={c.round} style="left:{c.x}%;background:{c.c};animation-delay:{(step === 'tally' ? 2.6 : step === 'done' ? 0.9 : 0.2) + c.d}s;animation-duration:{c.dur}s;--r:{c.r}deg"></i>{/each}
    </div>{/if}
  {/key}

  <div class="col">
    <div class="head">
      <span class="plate">{t('harvest.title')}</span>
      <span class="steps" aria-hidden="true">{#each steps as s (s)}<i class:on={s === step}></i>{/each}</span>
      {#if step !== 'done'}<button type="button" class="later" onclick={onlater}>{t('common.later')}</button>{:else}<span class="later-sp"></span>{/if}
    </div>

    <div class="bottom">
      <Bubble text={hostLine} host={step === 'tally' ? 'wave' : 'bow'} size={56} />

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
        {:else}<button type="button" class="btn" disabled={busy} onclick={drop}>{t('harvest.drop')}</button>{/if}
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
        <button type="button" class="btn" disabled={busy} onclick={drop}>{t('harvest.drop')}</button>
      {:else if step === 'done'}
        <section class="card done" role="status">
          <svg class="djar" viewBox="0 0 200 240" aria-hidden="true">
            <defs><clipPath id="hv-jar"><path d="M64 30 Q24 48 24 96 V200 Q24 232 56 232 H144 Q176 232 176 200 V96 Q176 48 136 30 Z" /></clipPath></defs>
            <path d="M64 30 Q24 48 24 96 V200 Q24 232 56 232 H144 Q176 232 176 200 V96 Q176 48 136 30 Z" fill="#DDF2FB" fill-opacity=".85" />
            <g clip-path="url(#hv-jar)">
              <rect class="coins new" x="0" y="30" width="200" height="202" fill="var(--c-yuzu)" opacity=".6" style:--f={filled ? fillOf(after) : oldFill} />
              <rect class="coins" x="0" y="30" width="200" height="202" fill="var(--c-yuzu)" style:--f={oldFill} />
            </g>
            <rect x="56" y="8" width="88" height="26" rx="9" fill="var(--c-yuzu)" />
            <rect x="56" y="26" width="88" height="8" rx="4" fill="var(--c-yuzu-lip)" />
            <path d="M46 100 Q42 130 46 160" stroke="#fff" stroke-width="8" stroke-linecap="round" opacity=".7" fill="none" />
          </svg>
          <b class="dhead">{t('harvest.done', { yen: formatYen(jarTotal) })}</b>
          <span class="hero-num">{formatYen(shown)}</span>
          {#if !partnerDone}<span class="mini">{t('harvest.waiting', { name: view.people[partner].villagerName })}</span>{/if}
        </section>
        <button type="button" class="btn" onclick={() => ondone?.()}>{t('harvest.home')}</button>
      {/if}
    </div>
  </div>
</dialog>

<style>
  /* The island stays visible behind a 30% tint (v5 §4). */
  .overlay {
    position: fixed; inset: 0; z-index: 60; overflow: auto; overscroll-behavior: contain;
    width: 100%; height: 100%; max-width: none; max-height: none; margin: 0; padding: 0; border: 0;
    --fr: 24px; background: rgba(74, 58, 44, .3); color: var(--text);
    animation: fade var(--dur-base) var(--ease-soft);
  }
  :global(:root[data-tod='night']) .overlay { background: rgba(30, 36, 80, .3); }
  .overlay:focus { outline: none; }
  .overlay::backdrop { background: transparent; }
  @keyframes fade { from { opacity: 0; } to { opacity: 1; } }
  .col {
    position: relative; max-width: 440px; margin: 0 auto; min-height: 100%; display: flex; flex-direction: column; justify-content: space-between; gap: 12px;
    padding: calc(var(--safe-top) + 12px) calc(var(--side) + var(--safe-right)) var(--pad-bottom) calc(var(--side) + var(--safe-left));
  }
  .head { display: flex; justify-content: space-between; align-items: center; min-height: 44px; gap: 8px; }
  .steps { display: flex; gap: 6px; }
  .steps i { width: 8px; height: 8px; border-radius: 50%; background: rgba(255, 249, 227, .6); transition: all var(--dur-base) var(--ease-bounce); }
  .steps i.on { width: 22px; border-radius: 4px; background: var(--c-yuzu); }
  .later, .later-sp { min-width: 80px; }
  .later {
    appearance: none; border: 0; cursor: pointer; min-height: 44px; padding: 0 16px; border-radius: var(--r-btn);
    background: var(--c-cream); color: var(--c-ink); box-shadow: 0 3px 0 var(--c-lip); font: 700 var(--fs-body)/1 var(--font-ui);
  }
  .bottom { display: grid; gap: var(--gap); --talk-lines: 2; }
  .bottom :global(.talk) { margin-bottom: -4px; }

  .confetti { position: fixed; inset: 0; pointer-events: none; overflow: hidden; z-index: 3; }
  .confetti i {
    position: absolute; top: -16px; width: 6px; height: 10px; border-radius: 2px; opacity: 0;
    animation: drop 2.6s cubic-bezier(.3, .6, .5, 1) both;
  }
  .confetti i.round { width: 6px; height: 6px; border-radius: 50%; }
  @keyframes drop {
    0% { opacity: 1; transform: translateY(0) rotate(0); }
    85% { opacity: 1; }
    100% { opacity: 0; transform: translateY(105vh) rotate(calc(var(--r) + 540deg)); }
  }

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

  .total { display: grid; justify-items: center; gap: 4px; padding-top: 10px; margin-top: 6px; box-shadow: 0 -2px 0 color-mix(in srgb, var(--lip) 50%, transparent); animation: rowIn .6s var(--ease-soft) 2.1s both; }
  .lbl { font-weight: 700; color: var(--text-soft); }
  .lbl small { font-size: var(--fs-s); }
  .total :global(.hero-num) { animation: if-pop var(--dur-pop) var(--ease-bounce) 2.3s both; }
  .mini { font-weight: 700; font-size: var(--fs-body); color: var(--text-soft); }

  .done, .rung { display: grid; justify-items: center; gap: 6px; text-align: center; }
  .djar { width: 96px; height: 116px; display: block; animation: if-pop var(--dur-pop) var(--ease-bounce) both; }
  .coins { transform-box: fill-box; transform-origin: 50% 100%; transform: scaleY(var(--f)); }
  .coins.new { transition: transform 1.4s var(--ease-soft) .4s; }
  .dhead, .rname { font-size: var(--fs-title); }
  @media (prefers-reduced-motion: reduce) { .coins { transition: none; } }
  @keyframes rowIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }

  .hero { position: relative; width: min(220px, 64vw); padding-bottom: 6px; animation: if-pop var(--dur-pop) var(--ease-bounce) both; }
  .port { display: block; }
  .v { position: absolute; bottom: 0; display: grid; justify-items: center; }
  .v1 { left: -8%; }
  .v2 { right: -8%; }
  .re { line-height: 0; animation: if-pop var(--dur-pop) var(--ease-bounce) .5s both; }

  @media (max-height: 700px), (max-width: 359px) {
    .bottom :global(.hero-num) { font-size: 2.25rem; }
    .hero { width: min(160px, 50vw); }
  }
  @media (max-width: 339px) { .overlay { --fr: 20px; } }
  @media (prefers-reduced-motion: reduce) { .confetti { display: none; } }
</style>
