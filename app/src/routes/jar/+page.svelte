<script lang="ts">
  // 旅の壺 Trip Jar (v5 §4): `◀ 島へ` + the NookPhone, the hero (the jar + the total = the screen's one focal
  // point, then 今週 ≈ ¥), and two cream Nook Miles+ cards in one skin: the trip (miles ticket, 次は 沖縄, a bar,
  // あと ¥; tap = the ladder) and ごほうび財布 (Nook Shopping, 使う). Payday is an NH banner. No しずえ here.
  // 使う stays quiet until the purse can pay for the cheapest treat (U4). Payday ✓ and 使う！ show at once but
  // wait 5 s with 取り消す on the banner before they are sent (U9).
  import { resolve } from '$app/paths';
  import Sheet from '#lib/components/Sheet.svelte';
  import Rope from '#lib/components/Rope.svelte';
  import OfficialArt from '#lib/components/OfficialArt.svelte';
  import Yen from '#lib/components/Yen.svelte';
  import HelpButton from '#lib/components/HelpButton.svelte';
  import { week } from '#lib/client/week.svelte.ts';
  import { spendPurse, approveSpend, transferDone, UNDO_MS } from '#lib/client/actions.ts';
  import { tick } from 'svelte';
  import { MONEY, SEASONS } from '#lib/config/rules.ts';
  import { t, formatYen } from '#lib/i18n/index.ts';
  import { dateMs } from '#lib/scoring/dates.ts';

  const TREATS = [
    { key: 'cafe', yen: 2000, icon: 'i-cafe', vb: '0 0 48 48' },
    { key: 'movie', yen: 4000, icon: 'i-film', vb: '0 0 40 40' },
    { key: 'onsen', yen: 5000, icon: 'i-onsen', vb: '0 0 48 48' },
    { key: 'karaoke', yen: 3000, icon: 'i-mic', vb: '0 0 48 48' },
    { key: 'hike', yen: 4500, icon: 'i-hike', vb: '0 0 48 48' },
    { key: 'yakiniku', yen: 10000, icon: 'i-yakiniku', vb: '0 0 48 48' }
  ] as const;

  const view = $derived(week.view);
  const jar = $derived(view?.jar ?? null);

  let ladderOpen = $state(false);
  let purseOpen = $state(false);
  let picked = $state<(typeof TREATS)[number] | null>(null);
  const cheapest = TREATS.reduce((a, b) => (b.yen < a.yen ? b : a));
  const canSpend = $derived(!!jar && jar.purseYen >= cheapest.yen);

  // The big jar fills toward the next trip (one combined total; per-person layers are one tap deeper, M8).
  const fillH = $derived.by(() => {
    if (!jar) return 0;
    const ratio = jar.nextRung ? jar.totalYen / jar.nextRung.yen : 1;
    return 18 + Math.max(0, Math.min(1, ratio)) * 128; // y 214 → 86: glass always shows above the coins
  });

  /** Weeks paid so far, for "against your own max" mini-jars. Server may send jar.weeks. */
  const weeks = $derived.by(() => {
    if (!jar || !view) return 1;
    if (jar.weeks) return jar.weeks;
    const start = dateMs(SEASONS[0].from) - 14 * 86400000; // incl. 2 calibration weeks
    const since = Math.floor((dateMs(view.weekKey) - start) / (7 * 86400000));
    const floor = Math.ceil(Math.max(jar.layers.A / MONEY.yenPerFruit / 100, jar.layers.B / MONEY.yenPerFruit / 100, jar.layers.team / MONEY.teamYenPerFruit / 100));
    return Math.max(1, since, floor);
  });

  const layers = $derived.by(() => {
    if (!jar || !view) return [];
    const personMax = weeks * MONEY.yenPerFruit * 100;
    const teamMax = weeks * MONEY.teamYenPerFruit * 100;
    const row = (who: 'A' | 'B') => ({
      key: who,
      name: view.people[who].villagerName,
      yen: jar.layers[who],
      ratio: jar.layers[who] / personMax,
      color: who === 'A' ? 'var(--c-yuzu)' : 'var(--c-mint)'
    });
    return [row(view.me), row(view.partner), { key: 'team', name: t('jar.teamShort'), yen: jar.layers.team, ratio: jar.layers.team / teamMax, color: 'var(--c-leaf)' }];
  });

  const nextPct = $derived(jar?.nextRung ? (jar.totalYen / jar.nextRung.yen) * 100 : 100);
  const nextUnreachedKey = $derived(jar?.rungs.find((r) => !r.reached)?.key ?? null);

  let paydayDone = $state<HTMLElement | undefined>();
  let paydayBtn = $state<HTMLElement | undefined>();

  /**
   * A banner with 取り消す for the undo window. It names what was done (round 5 N5), and hovering, touching or
   * focusing it holds both the banner and the send (N7).
   */
  function undoToast(text: string, reaction: string, r: { undo?: () => boolean; hold?: (ms: number | null) => void }, after?: () => void) {
    const undo = r.undo;
    week.showToast(text, UNDO_MS, {
      reaction,
      hold: r.hold,
      ...(undo ? { action: { label: t('common.undo'), run: () => { if (undo()) after?.(); } } } : {})
    });
  }

  async function markPayday() {
    if (!jar?.transfer) return;
    const r = await transferDone(jar.transfer.month);
    undoToast(t('jar.paydayNotedYen', { yen: formatYen(jar.transfer.amountYen) }), 'pleased', r, async () => {
      await tick();
      paydayBtn?.focus();
    });
    await tick();
    paydayDone?.focus(); // U15: focus stays on the row (now ✓), not <body>
  }

  async function spend() {
    if (!picked) return;
    const needsBoth = picked.yen >= MONEY.purseNeedsBothAtYen;
    const label = t(`treat.${picked.key}`);
    const yen = formatYen(picked.yen);
    const r = await spendPurse(label, picked.yen, needsBoth);
    if (r.ok) {
      purseOpen = false;
      picked = null;
      const pending = r.data?.status ? r.data.status === 'pending' : needsBoth;
      undoToast(t(pending ? 'purse.asked' : 'purse.spent', { label, yen }), pending ? 'thought' : 'joy', r);
    }
  }
</script>

{#if view && jar}
  <main class="jar-screen">
    <div class="top">
      <a class="back" href={resolve('/')}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 5 L8 12 L16 19 Z" /></svg>{t('jar.back')}</a>
      <HelpButton />
    </div>
    <h1 class="sr-only">{t('jar.title')}</h1>

    <div class="hero">
      <svg class="bigjar" viewBox="0 0 200 240" aria-hidden="true">
        <defs><clipPath id="bj"><path d="M64 30 Q24 48 24 96 V200 Q24 232 56 232 H144 Q176 232 176 200 V96 Q176 48 136 30 Z" /></clipPath></defs>
        <ellipse cx="100" cy="236" rx="78" ry="6" fill="rgba(40, 60, 40, .18)" />
        <path d="M64 30 Q24 48 24 96 V200 Q24 232 56 232 H144 Q176 232 176 200 V96 Q176 48 136 30 Z" class="glass" />
        <g clip-path="url(#bj)">
          <rect x="0" y={232 - fillH} width="200" height={fillH + 8} fill="var(--c-yuzu)" />
          <rect x="0" y={232 - fillH} width="200" height="8" fill="var(--c-yuzu-lip)" opacity=".5" />
        </g>
        <rect x="56" y="8" width="88" height="26" rx="9" fill="var(--c-yuzu)" />
        <rect x="56" y="26" width="88" height="8" rx="4" fill="var(--c-yuzu-lip)" />
        <path d="M46 100 Q42 130 46 160" stroke="#fff" stroke-width="8" stroke-linecap="round" opacity=".7" fill="none" />
      </svg>
      <Yen yen={jar.totalYen} class="hero-num total" />
      <span class="wk">{t('jar.week', { yen: formatYen(jar.thisWeekEstimateYen) })}</span>
    </div>

    {#if jar.transfer && !jar.transfer.done}
      <button type="button" class="payday" onclick={markPayday} bind:this={paydayBtn}>
        <span class="pico" aria-hidden="true"><OfficialArt key="money/bells" size={28} /></span>
        <span class="ptxt">{t('jar.payday.todo', { yen: formatYen(jar.transfer.amountYen) })}</span>
        <svg class="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5 L16 12 L9 19" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" /></svg>
      </button>
    {/if}

    <div class="cards">
      <button type="button" class="card trip" aria-label={t('jar.ladderOpen')} onclick={() => (ladderOpen = true)}>
        <span class="art"><OfficialArt key="money/miles-ticket" size={44} eager /></span>
        {#if jar.nextRung}
          <span class="body">
            <span class="row"><small>{t('jar.next')}</small><b>{t('rung.' + jar.nextRung.key)}</b></span>
            <Rope pct={nextPct} height={12} label={t('jar.left', { yen: formatYen(jar.nextRung.remainingYen) })} />
            <span class="left money">{t('jar.left', { yen: formatYen(jar.nextRung.remainingYen) })}</span>
          </span>
        {:else}
          <span class="body"><b>{t('jar.allReached')}</b></span>
        {/if}
        <svg class="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5 L16 12 L9 19" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" /></svg>
      </button>

      <div class="card purse">
        <span class="art"><OfficialArt key="phone/nook-shopping" size={44} eager /></span>
        <span class="body">
          <span class="row"><small>{t('purse.title')}</small></span>
          <Yen yen={jar.purseYen} class="purse-yen" />
        </span>
        {#if canSpend}
          <button type="button" class="btn small" onclick={() => (purseOpen = true)}>{t('purse.spend')}</button>
        {:else}
          <span class="need">{t('purse.need', { yen: formatYen(cheapest.yen) })}</span>
        {/if}
      </div>

      {#each jar.pendingSpends ?? [] as s (s.id)}
        <div class="card spend">
          <span class="body"><b>{s.label}</b> <span class="money">{formatYen(s.amountYen)}</span></span>
          {#if s.by === view.me}
            <span class="need">{t('purse.waiting')}</span>
          {:else}
            <button type="button" class="btn small" onclick={() => approveSpend(s.id)}>{t('purse.approve')}</button>
          {/if}
        </div>
      {/each}

      {#if jar.transfer?.done}
        <p class="paid" tabindex="-1" bind:this={paydayDone}><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-check" /></svg>{t('jar.payday.done')}</p>
      {/if}
    </div>
  </main>

  <Sheet bind:open={ladderOpen} label={t('jar.ladder')} title={t('jar.ladder')}>
    <ul class="card ladder">
      {#each jar.rungs as r, i (r.key)}
        {@const next = r.key === nextUnreachedKey}
        <li class:done={r.reached} class:next>
          <span class="mark">{#if r.reached}<OfficialArt key="money/miles" size={28} />{:else}<span class="dot" style:animation-delay="{i * 80}ms"></span>{/if}</span>
          <span class="ln">{t('rung.' + r.key)}{#if next}<Rope pct={(jar.totalYen / r.yen) * 100} height={10} />{/if}</span>
          <span class="money">{formatYen(r.yen)}</span>
        </li>
      {/each}
    </ul>
    <section class="card layers" aria-label={t('jar.layers')}>
      {#each layers as l (l.key)}
        {@const fill = 25 * Math.max(0.08, Math.min(1, l.ratio))}
        <div class="layer">
          <svg class="minijar" viewBox="0 0 30 36" aria-hidden="true">
            <path d="M8 4 H22 V8 Q28 10 28 16 V30 Q28 34 24 34 H6 Q2 34 2 30 V16 Q2 10 8 8Z" class="glass" />
            <path d="M3 {33 - fill} H27 V30 Q27 33 24 33 H6 Q3 33 3 30Z" style:fill={l.color} />
          </svg>
          <span class="ln">{l.name}</span>
          <b class="money">{formatYen(l.yen)}</b>
        </div>
      {/each}
    </section>
  </Sheet>

  <Sheet bind:open={purseOpen} label={t('purse.title')} title={t('purse.title')} onclose={() => (picked = null)}>
    <div class="shelf">
      {#each TREATS as item (item.key)}
        {@const out = item.yen > jar.purseYen}
        <button type="button" class="card item" class:sel={picked?.key === item.key} disabled={out} aria-pressed={picked?.key === item.key} onclick={() => (picked = item)}>
          {#if item.yen >= MONEY.purseNeedsBothAtYen}<svg class="both" viewBox="0 0 24 24" role="img" aria-label={t('purse.both')}><use href="#i-heart" /></svg>{/if}
          <svg class="ic" viewBox={item.vb} aria-hidden="true"><use href="#{item.icon}" /></svg>
          <b>{t(`treat.${item.key}`)}</b>
          <span class="money">{formatYen(item.yen)}</span>
        </button>
      {/each}
    </div>
    {#snippet footer()}
      <button type="button" class="btn" disabled={!picked} onclick={spend}>{t('purse.go')}{#if picked}<span class="money">{formatYen(picked.yen)}</span>{/if}</button>
    {/snippet}
  </Sheet>
{/if}

<style>
  .jar-screen {
    --jar-h: 132px;
    max-width: var(--col); margin: 0 auto; min-height: 100dvh;
    padding: calc(var(--safe-top) + 8px) calc(var(--side) + var(--safe-right)) calc(var(--pad-bottom) + 16px) calc(var(--side) + var(--safe-left));
  }
  .top { display: flex; justify-content: space-between; align-items: center; height: 52px; margin-right: -6px; }
  /* NH's back pill. */
  .back {
    display: inline-flex; align-items: center; gap: 6px; min-height: 44px; padding: 0 16px 0 12px; border-radius: var(--r-btn);
    background: var(--c-cream); color: var(--c-ink); box-shadow: 0 var(--lip-h) 0 var(--c-lip); text-decoration: none;
    font: 700 var(--fs-body)/1 var(--font-ui);
  }
  .back svg { width: 16px; height: 16px; fill: var(--c-yuzu-lip); }
  .back:active { transform: translateY(2px); box-shadow: 0 1px 0 var(--c-lip); }

  .hero { display: grid; justify-items: center; gap: 6px; padding: 4px 0 20px; color: var(--text); }
  .bigjar { height: var(--jar-h); width: calc(var(--jar-h) * 200 / 240); display: block; margin-bottom: 6px; }
  .glass { fill: #DDF2FB; fill-opacity: .85; }
  .hero :global(.total) { font-size: min(var(--fs-hero), 12vw); }
  .wk { font-size: var(--fs-body); font-weight: 700; color: var(--text-soft); }

  /* Payday (F7): a quiet cream NH banner with a small bells icon, well under the total (body text, no button fill). */
  .payday {
    appearance: none; border: 0; cursor: pointer; width: 100%; min-height: 48px; margin: 0 0 18px; padding: 6px 12px 6px 10px;
    display: flex; align-items: center; gap: 10px; text-align: left;
    border-radius: var(--r-chip); background: var(--c-cream); color: var(--c-ink-soft); box-shadow: 0 var(--lip-h) 0 var(--c-lip);
    font: 700 var(--fs-body)/1.3 var(--font-ui);
  }
  .payday .pico { flex: none; line-height: 0; }
  .payday .ptxt { flex: 1; min-width: 0; word-break: auto-phrase; text-wrap: balance; }
  .payday .chev { width: 16px; height: 16px; flex: none; color: var(--c-lip); }
  .payday:active { transform: translateY(3px); box-shadow: 0 1px 0 var(--c-lip); }

  .cards { display: grid; gap: 16px; }
  .card { display: flex; align-items: center; gap: 14px; min-height: 84px; }
  .trip { appearance: none; border: 0; cursor: pointer; text-align: left; width: 100%; font: inherit; }
  .trip:active { transform: translateY(3px); box-shadow: 0 1px 0 var(--lip); }
  .art { flex: none; width: 48px; display: grid; place-items: center; line-height: 0; }
  .body { flex: 1; min-width: 0; display: grid; gap: 6px; }
  .row { display: flex; align-items: baseline; gap: 8px; }
  .row small { font-size: var(--fs-body); font-weight: 700; color: var(--text-soft); }
  .row b, .body > b { font-size: var(--fs-title); }
  .left { font-size: var(--fs-body); color: var(--text-soft); }
  .chev { width: 24px; height: 24px; flex: none; color: var(--text-soft); }
  .purse :global(.purse-yen) { font-size: var(--fs-title); }
  .purse .btn { flex: none; min-width: 96px; margin-bottom: 4px; }
  .need { flex: none; max-width: 9em; text-align: right; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); word-break: auto-phrase; }
  .spend { min-height: 64px; }
  .paid { margin: 0; display: flex; justify-content: center; align-items: center; gap: 6px; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  .paid svg { width: 16px; height: 16px; }

  .ladder { list-style: none; margin: 0 0 16px; padding: 6px 16px; display: grid; }
  .ladder li { display: flex; align-items: center; gap: 12px; min-height: 52px; }
  .ladder li + li { box-shadow: 0 -2px 0 color-mix(in srgb, var(--lip) 50%, transparent); }
  .mark { width: 32px; display: grid; place-items: center; flex: none; }
  .dot { width: 12px; height: 12px; border-radius: 50%; background: var(--lip); }
  .ln { flex: 1; min-width: 0; font-weight: 700; font-size: var(--fs-talk); display: grid; gap: 6px; }
  .ladder .money { font-size: var(--fs-body); }
  .ladder li.done { color: var(--text-soft); }
  .layers { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
  .layer { display: grid; justify-items: center; gap: 4px; text-align: center; min-width: 0; }
  .minijar { display: block; width: 32px; height: 38px; }
  .layer .ln { font-size: var(--fs-s); color: var(--text-soft); max-width: 100%; overflow-wrap: anywhere; }
  .layer b { font-size: var(--fs-body); }

  .shelf { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; padding-bottom: 8px; }
  @media (max-width: 339px) { .shelf { grid-template-columns: repeat(2, 1fr); } }
  .item {
    appearance: none; border: 0; cursor: pointer; padding: 12px 6px 10px; text-align: center; min-height: 112px; font: inherit;
    flex-direction: column; justify-content: center; gap: 2px; transition: transform var(--dur-base) var(--ease-bounce);
  }
  .item:active:not(:disabled) { transform: translateY(3px) scale(1.04, .94); transition-duration: var(--dur-tap); }
  .item.sel { background: var(--c-leaf); color: var(--c-ink); box-shadow: 0 var(--lip-h) 0 var(--c-leaf-lip); transform: translateY(-3px); }
  .item:disabled { cursor: default; opacity: .5; }
  .ic { width: 44px; height: 44px; margin-bottom: 4px; }
  .item b { font-size: var(--fs-body); line-height: 1.2; }
  .item .money { font-size: var(--fs-body); }
  .both { position: absolute; top: 8px; right: 8px; width: 18px; height: 18px; color: var(--c-coral); }

  @media (max-height: 700px), (max-width: 359px) {
    .jar-screen { --jar-h: 96px; }
    .hero { padding-bottom: 14px; }
    .cards { gap: 12px; }
    .card { min-height: 72px; padding: 12px 14px; }
  }
  @media (max-width: 339px) {
    .jar-screen { --jar-h: 84px; }
    .hero :global(.total) { font-size: 2.25rem; }
  }
</style>
