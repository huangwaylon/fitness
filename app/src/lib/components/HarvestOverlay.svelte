<script lang="ts">
  // 日曜の収穫 (Sunday harvest overlay v4 §R.6, §T.5, ≤ 60 s): tally → rung reached (optional) → 壺に入れる.
  // Person rows: villager icon, the four official fruit (ripeness), island-evaluation stars, amount in a Bells
  // pill. The jar total sits in the Miles-style navy pill. Confetti in the §M.4 colours (none under reduced motion).
  // A real modal (U9): a native <dialog> opened with showModal() (inert background, focus trap; Esc = あとで).
  // Rows show name + the four fruits + yen, not a scoreboard (U3, U12); しずえ keeps one outfit (U5).
  import type { HarvestView, PersonId, WeekView } from '#lib/types.ts';
  import { FRUITS, RUNGS } from '#lib/config/rules.ts';
  import Villager from './Villager.svelte';
  import Avatar from './Avatar.svelte';
  import Yen from './Yen.svelte';
  import Bubble from './Bubble.svelte';
  import OfficialArt from './OfficialArt.svelte';
  import { week } from '#lib/client/week.svelte.ts';
  import { confirmHarvest } from '#lib/client/actions.ts';
  import { fruitArt } from '#lib/client/assets.ts';
  import { ripeness } from './FruitRing.svelte';
  import { t, formatYen } from '#lib/i18n/index.ts';

  interface Props {
    view: WeekView;
    harvest: HarvestView;
    onlater: () => void;
  }
  let { view, harvest, onlater }: Props = $props();

  const me = $derived(view.me);
  const partner = $derived(view.partner);
  const p = $derived(harvest.payout);
  const jarTotal = $derived(p.A.fruitYen + p.B.fruitYen + p.teamYen);
  const purseTotal = $derived(p.A.purseYen + p.B.purseYen);
  const rungKey = $derived(harvest.rungsReached.at(-1) ?? null);
  const rung = $derived(rungKey ? RUNGS.find((r) => r.key === rungKey) ?? null : null);
  const nextRung = $derived(rung ? RUNGS.find((r) => r.yen > rung.yen) ?? null : null);

  let step = $state<'tally' | 'rung'>('tally');
  let busy = $state(false);

  async function drop() {
    busy = true;
    const r = await confirmHarvest();
    busy = false;
    if (r.ok && !harvest.confirmedBy.includes(partner)) {
      week.showToast(t('harvest.waiting', { name: view.people[partner].villagerName }), 3200);
    }
  }

  const people: PersonId[] = $derived([me, partner]);
  /** The fruits' ripeness, when the view is still the harvested week (Sunday evening); else plain icons. */
  const sameWeek = $derived(view.weekKey === harvest.weekKey);

  function modal(node: HTMLDialogElement) {
    if (!node.open) node.showModal?.();
    node.focus();
  }
  const steps = $derived<('tally' | 'rung')[]>(rung ? ['tally', 'rung'] : ['tally']);
  const hostLine = $derived(step === 'tally' ? t('harvest.hello') : t('harvest.rungReached'));
  /** Island-evaluation stars (§T.5): ceil(score / 20), 0–5. */
  const stars = (score: number) => Math.max(0, Math.min(5, Math.ceil(score / 20)));
  // Confetti (§M.4 colours): 36 pieces, CSS only; skipped under reduced motion.
  const COLOURS = ['#FF7FA8', '#FFD84D', '#6ED07A', '#6FCFF6', '#B98AE8', '#FF9B5C'];
  const CONFETTI = Array.from({ length: 36 }, (_, i) => ({
    x: (i * 37) % 100, c: COLOURS[i % 6], d: (i % 12) * 0.12, r: (i * 53) % 360, round: i % 3 === 0, dur: 2.4 + (i % 5) * 0.3
  }));
</script>

<dialog class="overlay" aria-label={t('harvest.title')} tabindex="-1" use:modal
  oncancel={(e) => { e.preventDefault(); onlater(); }}>
  {#key step}
    <div class="confetti" aria-hidden="true">
      {#each CONFETTI as c, i (i)}<i class:round={c.round} style="left:{c.x}%;background:{c.c};animation-delay:{(step === 'tally' ? 2.6 : 0.2) + c.d}s;animation-duration:{c.dur}s;--r:{c.r}deg"></i>{/each}
    </div>
  {/key}

  <div class="col">
    <div class="head">
      <span class="pill title"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-jar" /></svg>{t('harvest.title')}</span>
      <span class="steps" aria-hidden="true">{#each steps as s (s)}<i class:on={s === step}></i>{/each}</span>
      <button type="button" class="pill later" onclick={onlater}>{t('common.later')}</button>
    </div>

    <Bubble text={hostLine} host={step === 'tally' ? 'wave' : 'bow'} />

    {#if step === 'tally'}
      <section class="tally miles" style:--card="var(--card-butter)" aria-live="polite">
        {#each people as who, i (who)}
          {@const pv = view.people[who]}
          <div class="trow" style="animation-delay:{0.3 + i * 0.7}s">
            <Avatar person={who} villager={pv.villager} size={40} />
            <span class="who">
              <b class="nm">{pv.villagerName}</b>
              <span class="frs" aria-hidden="true">
                {#each FRUITS as f (f)}<span class="fr {sameWeek ? ripeness(pv.fruits[f].pct) : ''}"><OfficialArt key={fruitArt(f)} size="var(--fr)" /></span>{/each}
              </span>
              <span class="stars" role="img" aria-label="{stars(p[who].score)}/5">
                {#each [0, 1, 2, 3, 4] as s (s)}<svg viewBox="0 0 24 24" class:on={s < stars(p[who].score)} style="animation-delay:{0.6 + i * 0.7 + s * 0.12}s"><path d="M12 2.6l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z" /></svg>{/each}
              </span>
            </span>
            <Yen yen={p[who].fruitYen} sign="+" pill />
          </div>
        {/each}
        <div class="trow" style="animation-delay:1.7s">
          <span class="av team"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-heart" /></svg></span>
          <span class="who"><b class="nm">{t('harvest.team')}</b></span>
          <Yen yen={p.teamYen} sign="+" pill />
        </div>
      </section>

      <div class="total">
        <span class="lbl">{t('harvest.jar')} <span class="prov">{t('harvest.provisional')}</span></span>
        <span class="navy money"><OfficialArt key="money/bells" size="1em" />{formatYen(jarTotal)}</span>
      </div>

      {#if purseTotal > 0}
        <div class="mini">
          <svg viewBox="0 0 48 48" aria-hidden="true"><use href="#i-purse" /></svg>
          <span class="pl">{t('purse.title')}</span>
          <Yen yen={purseTotal} sign="+" pill />
        </div>
      {/if}

      <div class="cta">
        {#if rung}<button type="button" class="btn yuzu" onclick={() => (step = 'rung')}>{t('common.next')}</button>{:else}<button type="button" class="btn yuzu" disabled={busy} onclick={drop}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-jar" /></svg>{t('harvest.drop')}
        </button>{/if}
      </div>
    {:else if rung}
      <div class="rung">
        <div class="hero">
          <span class="port"><OfficialArt key="deco/airport" width="100%" /></span>
          <span class="v v1"><span class="re"><OfficialArt key="reactions/pose-viva" size={34} /></span><Villager person={me} size={72} expression="cheer" /></span>
          <span class="v v2"><span class="re"><OfficialArt key="reactions/joy" size={34} /></span><Villager person={partner} size={72} expression="cheer" /></span>
        </div>
        <div class="rname">{t('rung.' + rung.key)}</div>
        <span class="navy money"><OfficialArt key="money/bells" size="1em" />{formatYen(rung.yen)}</span>
        {#if nextRung}<div class="rnext">{t('harvest.nextRung', { place: t('rung.' + nextRung.key), yen: formatYen(nextRung.yen) })}</div>{/if}
      </div>
      <div class="cta">
        <button type="button" class="btn yuzu" disabled={busy} onclick={drop}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-jar" /></svg>{t('harvest.drop')}
        </button>
      </div>
    {/if}
  </div>
</dialog>

<style>
  /* Night sky (§R.6, §1.2 periwinkle): always night colours, whatever the clock says. */
  .overlay {
    position: fixed; inset: 0; z-index: 60; overflow: auto; overscroll-behavior: contain;
    width: 100%; height: 100%; max-width: none; max-height: none; margin: 0; padding: 0; border: 0;
    --text: #FFF6E0; --text-soft: #D2D9F5; --fr: 24px;
    color: var(--text);
    background:
      radial-gradient(circle, rgba(255, 255, 255, .7) 1.2px, transparent 1.8px) 11px 23px / 61px 53px,
      radial-gradient(circle, rgba(255, 243, 196, .6) 1px, transparent 1.6px) 29px 7px / 43px 71px,
      linear-gradient(180deg, #3A4886 0%, #5565B0 55%, #7584CC 100%);
    background-attachment: fixed;
    animation: fade var(--dur-base) var(--ease-soft);
  }
  .overlay:focus { outline: none; }
  .overlay::backdrop { background: transparent; }
  @keyframes fade { from { opacity: 0; } to { opacity: 1; } }
  .col {
    position: relative; max-width: 420px; margin: 0 auto; min-height: 100%; display: flex; flex-direction: column; gap: 14px;
    padding: calc(var(--safe-top) + 16px) calc(16px + var(--safe-right)) 0 calc(16px + var(--safe-left));
  }
  .head { display: flex; justify-content: space-between; align-items: center; min-height: 44px; gap: 8px; }
  .title svg { width: 18px; height: 18px; }
  .steps { display: flex; gap: 6px; }
  .steps i { width: 8px; height: 8px; border-radius: 50%; background: rgba(255, 255, 255, .4); transition: all var(--dur-base) var(--ease-bounce); }
  .steps i.on { width: 22px; border-radius: 4px; background: var(--c-moon); }
  .later { cursor: pointer; min-height: 44px; padding: 0 16px; }
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

  .tally { padding: 4px 14px; }
  /* Rows grow in one by one, so the card grows with them (no empty height while revealing). */
  .trow {
    display: flex; align-items: center; gap: 10px; border-bottom: 2px dashed rgba(201, 154, 46, .35); overflow: hidden;
    animation: rowGrow .5s var(--ease-soft) both;
  }
  .trow:last-child { border-bottom: 0; }
  @keyframes rowGrow { from { max-height: 0; opacity: 0; padding-block: 0; } to { max-height: 110px; opacity: 1; padding-block: 8px; } }
  .who { flex: 1; min-width: 0; display: grid; gap: 3px; }
  .nm { font-weight: 700; font-size: var(--fs-body-lg); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .frs { display: flex; gap: 3px; }
  .fr { display: block; flex: none; line-height: 0; }
  .fr.bud { opacity: .55; filter: saturate(.3); }
  .fr.small { opacity: .8; filter: saturate(.7); }
  .stars { display: flex; gap: 1px; }
  .stars svg { width: 18px; height: 18px; fill: var(--star-off); stroke: var(--star-edge); stroke-width: 1.5; stroke-linejoin: round; animation: if-pop var(--dur-pop) var(--ease-bounce) both; }
  .stars svg.on { fill: var(--star-on); }
  .av { width: 40px; height: 40px; flex: none; border-radius: var(--r-blob); background: var(--card-pink); display: grid; place-items: center; }
  .av.team svg { width: 24px; height: 24px; color: var(--p-berry); }
  .trow :global(.bells) { flex: none; }

  .total { display: grid; justify-items: center; gap: 8px; animation: rowIn .6s var(--ease-soft) 2.4s both; }
  .lbl { font-weight: 700; }
  .prov { display: inline-flex; font: 700 var(--fs-micro) var(--font-ui); color: var(--text); background: rgba(255, 255, 255, .16); border-radius: var(--r-pill); padding: 2px 9px; vertical-align: middle; }
  /* Miles-style navy pill: one number per screen (§T.5). */
  .navy {
    display: inline-flex; align-items: center; gap: .3em; padding: 10px 24px 10px 16px; border-radius: var(--r-pill);
    background: var(--miles-navy); color: #fff; border: 3px solid rgba(255, 243, 196, .85); font: 700 var(--fs-hero)/1 var(--font-num);
    box-shadow: 0 5px 0 #26306A, inset 0 2px 0 rgba(255, 255, 255, .2); animation: if-pop var(--dur-pop) var(--ease-bounce) 2.6s both;
  }
  .rung .navy { animation-delay: .3s; }
  .mini {
    display: flex; align-items: center; justify-content: center; gap: 12px; min-height: 56px; padding: 6px 14px; border-radius: var(--r-card);
    background: rgba(255, 255, 255, .12); border: 2px dashed rgba(255, 255, 255, .4); animation: rowIn .6s var(--ease-soft) 3s both;
  }
  .mini svg { width: 32px; height: 32px; }
  .pl { font-weight: 700; }
  @keyframes rowIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }

  .cta {
    position: sticky; bottom: 0; margin-top: auto; z-index: 4;
    padding: 12px 0 calc(var(--safe-bottom) + 16px);
    background: linear-gradient(transparent, #7584CC 40%);
  }

  .rung { text-align: center; display: grid; justify-items: center; gap: 6px; }
  .hero { position: relative; width: min(240px, 70vw); padding-bottom: 8px; animation: if-pop var(--dur-pop) var(--ease-bounce) both; }
  .port { display: block; opacity: .95; }
  .v { position: absolute; bottom: 0; display: grid; justify-items: center; }
  .v1 { left: -6%; }
  .v2 { right: -6%; }
  .re { line-height: 0; animation: if-pop var(--dur-pop) var(--ease-bounce) .5s both; }
  .rname { font: 900 2.2rem/1.1 var(--font-ui); margin-top: 6px; }
  .rnext { font-weight: 700; margin-top: 6px; }

  @media (max-height: 700px), (max-width: 359px) {
    .navy { font-size: 2.25rem; }
    .col { gap: 10px; }
  }
  @media (max-width: 339px) {
    .overlay { --fr: 20px; }
    .trow { flex-wrap: wrap; }
    .trow :global(.bells) { margin-left: 50px; }
  }
  @media (max-height: 600px) { .hero { width: min(180px, 60vw); } }
  @media (prefers-reduced-motion: reduce) { .confetti { display: none; } }
</style>
