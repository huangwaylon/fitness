<script lang="ts">
  // 旅の壺 Trip Jar (style guide v4 §T.4, §R.2): a cream hero (jar art + total) with a wavy edge over the
  // Nook Miles+ periwinkle page, しずえ's one line, then ≤ 3 pastel Miles+ cards: next trip (the ladder of
  // stamped rungs is one tap away), the Treat Purse (Bells pill; 使う opens DIY-card treats), the jar's layers.
  // 使う stays quiet until the purse can pay for the cheapest treat, and says how far that is (U4).
  import Sheet from '#lib/components/Sheet.svelte';
  import Rope from '#lib/components/Rope.svelte';
  import Bubble from '#lib/components/Bubble.svelte';
  import OfficialArt from '#lib/components/OfficialArt.svelte';
  import Yen from '#lib/components/Yen.svelte';
  import HelpButton from '#lib/components/HelpButton.svelte';
  import { week } from '#lib/client/week.svelte.ts';
  import { spendPurse, approveSpend, transferDone } from '#lib/client/actions.ts';
  import { MONEY, SEASONS } from '#lib/config/rules.ts';
  import { t, formatYen, hostLine } from '#lib/i18n/index.ts';

  /** Miles+ card colours, one per card / rung. */
  const PASTELS = ['var(--card-butter)', 'var(--card-teal)', 'var(--card-pink)', 'var(--card-lime)', 'var(--card-lilac)'];
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
    return 18 + Math.max(0, Math.min(1, ratio)) * 150; // y 232 → 64
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
      color: who === 'A' ? 'var(--p-apricot)' : 'var(--p-plum)'
    });
    return [row(view.me), row(view.partner), { key: 'team', name: t('jar.team'), yen: jar.layers.team, ratio: jar.layers.team / teamMax, color: 'var(--c-leaf)' }];
  });

  /** しずえ's one line here: how far the next trip is (the rung card shows the bar). */
  const line = $derived(
    jar?.nextRung ? hostLine('next_rung', { rung: jar.nextRung.key, yen: jar.nextRung.remainingYen }) : t('jar.allReached')
  );
  const nextPct = $derived(jar?.nextRung ? (jar.totalYen / jar.nextRung.yen) * 100 : 100);
  const nextUnreachedKey = $derived(jar?.rungs.find((r) => !r.reached)?.key ?? null);

  function markPayday() {
    if (!jar?.transfer) return;
    transferDone(jar.transfer.month);
    week.showToast(t('jar.paydayNoted'), 1800);
  }

  async function spend() {
    if (!picked) return;
    const needsBoth = picked.yen >= MONEY.purseNeedsBothAtYen;
    const r = await spendPurse(t(`treat.${picked.key}`), picked.yen, needsBoth);
    if (r.ok) {
      purseOpen = false;
      picked = null;
      const pending = r.data?.status ? r.data.status === 'pending' : needsBoth;
      week.showToast(pending ? t('purse.waiting') : t('purse.enjoy'));
    }
  }
</script>

{#if view && jar}
  <main class="jar-screen">
    <header class="hero-wrap">
      <div class="status-row">
        <h1 class="title"><span class="tile"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#app-jar" /></svg></span>{t('jar.title')}</h1>
        <HelpButton />
      </div>
      <div class="hero">
        <svg class="bigjar" viewBox="0 0 200 240" aria-hidden="true">
          <defs><clipPath id="bj"><path d="M64 30 Q24 48 24 96 V200 Q24 232 56 232 H144 Q176 232 176 200 V96 Q176 48 136 30 Z" /></clipPath></defs>
          <ellipse cx="100" cy="236" rx="80" ry="7" fill="var(--sh-ground)" />
          <path d="M64 30 Q24 48 24 96 V200 Q24 232 56 232 H144 Q176 232 176 200 V96 Q176 48 136 30 Z" fill="var(--c-sky-soft)" fill-opacity=".9" />
          <g clip-path="url(#bj)">
            <path d="M0 {232 - fillH} q25 -7 50 0 t50 0 t50 0 t50 0 V240 H0Z" fill="var(--c-coin)" />
            <path d="M0 {238 - fillH} q25 -6 50 0 t50 0 t50 0 t50 0" stroke="var(--c-coin-shine)" stroke-width="4" fill="none" opacity=".8" />
            {#each [[60, 214], [96, 222], [134, 212], [78, 196], [118, 200], [150, 226], [46, 228]] as [cx, cy], i (i)}
              {#if cy > 232 - fillH + 8}<g><circle {cx} {cy} r="11" fill="var(--c-coin)" stroke="var(--c-coin-rim)" stroke-width="2.5" /><circle {cx} {cy} r="6" fill="none" stroke="var(--c-coin-rim)" stroke-width="1.5" opacity=".5" /></g>{/if}
            {/each}
          </g>
          <path d="M64 30 Q24 48 24 96 V200 Q24 232 56 232 H144 Q176 232 176 200 V96 Q176 48 136 30 Z" fill="none" stroke="var(--c-ink)" stroke-width="4" stroke-linejoin="round" />
          <rect x="56" y="8" width="88" height="26" rx="9" fill="var(--c-yuzu)" stroke="var(--c-ink)" stroke-width="4" />
          <path d="M66 15 H134" stroke="var(--c-yuzu-soft)" stroke-width="3" stroke-linecap="round" />
          <path d="M44 100 Q40 130 44 160" stroke="#fff" stroke-width="7" stroke-linecap="round" opacity=".75" />
          <path class="glint" d="M160 40 l4 -9 l4 9 l9 4 l-9 4 l-4 9 l-4 -9 l-9 -4 z" fill="var(--c-yuzu)" />
        </svg>
        <div class="totals">
          <Yen yen={jar.totalYen} class="hero-num total" />
          <span class="wk">{t('jar.week', { yen: formatYen(jar.thisWeekEstimateYen) })}</span>
        </div>
      </div>
      <Bubble text={line} host="stand" size="var(--jar-host)" />
      <svg class="wave" viewBox="0 0 120 12" preserveAspectRatio="none" aria-hidden="true"><path d="M0 0 H120 V4 Q112 12 105 6 T90 6 T75 6 T60 6 T45 6 T30 6 T15 6 T0 4 Z" /></svg>
    </header>

    <div class="cards">
      <button type="button" class="miles next" style:--card="var(--card-butter)" aria-label={t('jar.ladderOpen')} onclick={() => (ladderOpen = true)}>
        <span class="stamp" aria-hidden="true"></span>
        {#if jar.nextRung}
          <span class="rtxt">
            <span class="rl"><small>{t('jar.next')}</small><b>{t('rung.' + jar.nextRung.key)}</b><span class="rgoal money">{formatYen(jar.nextRung.yen)}</span></span>
            <Rope pct={nextPct} height={14} label={t('jar.left', { yen: formatYen(jar.nextRung.remainingYen) })} />
          </span>
        {:else}
          <span class="rtxt"><span class="rl"><b>{t('jar.allReached')}</b></span></span>
        {/if}
        <span class="chev" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M9 5 L16 12 L9 19" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" /></svg></span>
      </button>

      <div class="miles purse" style:--card="var(--card-pink)">
        <h2 class="ct">{t('purse.title')}</h2>
        <div class="prow">
          <Yen yen={jar.purseYen} pill />
          {#if canSpend}
            <button type="button" class="btn coral small go" onclick={() => (purseOpen = true)}>{t('purse.spend')}</button>
          {:else}
            <span class="need">{t('purse.need', { yen: formatYen(cheapest.yen - jar.purseYen), label: t(`treat.${cheapest.key}`) })}</span>
          {/if}
        </div>
      </div>

      {#if jar.transfer}
        {#if jar.transfer.done}
          <p class="payday done"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-check" /></svg>{t('jar.payday.done')}</p>
        {:else}
          <button type="button" class="payday" onclick={markPayday}>
            <span class="pd-t">{t('jar.payday.todo', { yen: formatYen(jar.transfer.amountYen) })}</span>
            <span class="tick" aria-hidden="true"></span>
          </button>
        {/if}
      {/if}

      {#each jar.pendingSpends ?? [] as s (s.id)}
        <div class="spend miles" style:--card="var(--card-teal)">
          <svg viewBox="0 0 24 24" class="both-ic" aria-hidden="true"><use href="#i-heart" /></svg>
          <span class="sp-l">{s.label} <b class="money">{formatYen(s.amountYen)}</b></span>
          {#if s.by === view.me}
            <span class="waiting">{t('purse.waiting')}</span>
          {:else}
            <button type="button" class="btn coral small" onclick={() => approveSpend(s.id)}>{t('purse.approve')}</button>
          {/if}
        </div>
      {/each}

      <section class="miles layers" style:--card="var(--card-lilac)" aria-label={t('jar.layers')}>
        <h2 class="ct">{t('jar.layers')}</h2>
        <div class="lgrid">
          {#each layers as l (l.key)}
            {@const fill = 25 * Math.max(0.08, Math.min(1, l.ratio))}
            <div class="layer">
              <svg class="minijar" viewBox="0 0 30 36" aria-hidden="true">
                <path d="M8 4 H22 V8 Q28 10 28 16 V30 Q28 34 24 34 H6 Q2 34 2 30 V16 Q2 10 8 8Z" fill="var(--c-bubble)" stroke="var(--c-ink)" stroke-width="2" />
                <path d="M3 {33 - fill} H27 V30 Q27 33 24 33 H6 Q3 33 3 30Z" style:fill={l.color} />
              </svg>
              <span class="ln">{l.name}</span>
              <b class="money">{formatYen(l.yen)}</b>
            </div>
          {/each}
        </div>
      </section>
    </div>
  </main>

  <Sheet bind:open={ladderOpen} label={t('jar.ladder')}>
    <h2 class="sheet-title">{t('jar.ladder')}</h2>
    <ul class="ladder">
      {#each jar.rungs as r, i (r.key)}
        {@const next = r.key === nextUnreachedKey}
        <li class="miles lr" class:done={r.reached} class:next style:--card={PASTELS[i % PASTELS.length]}>
          <span class="stamp" class:on={r.reached} style:animation-delay="{i * 80}ms">{#if r.reached}<OfficialArt key="money/miles" size={30} />{/if}</span>
          <span class="ln">{t('rung.' + r.key)}{#if next}<Rope pct={(jar.totalYen / r.yen) * 100} height={10} />{/if}</span>
          <span class="la money">{formatYen(r.yen)}</span>
        </li>
      {/each}
    </ul>
  </Sheet>

  <Sheet bind:open={purseOpen} label={t('purse.title')} onclose={() => (picked = null)}>
    <div class="sheet-head">
      <h2>{t('purse.title')}</h2>
      <Yen yen={jar.purseYen} pill />
    </div>
    <div class="shelf">
      {#each TREATS as item (item.key)}
        {@const out = item.yen > jar.purseYen}
        <button type="button" class="diy item" class:sel={picked?.key === item.key} disabled={out} aria-pressed={picked?.key === item.key} onclick={() => (picked = item)}>
          {#if item.yen >= MONEY.purseNeedsBothAtYen}<svg class="both" viewBox="0 0 24 24" role="img" aria-label={t('purse.both')}><use href="#i-heart" /></svg>{/if}
          <svg class="art" viewBox={item.vb} aria-hidden="true"><use href="#{item.icon}" /></svg>
          <b>{t(`treat.${item.key}`)}</b>
          <span class="p money">{out ? t('purse.short', { yen: formatYen(item.yen - jar.purseYen) }) : formatYen(item.yen)}</span>
        </button>
      {/each}
    </div>
    {#snippet footer()}
      {#if picked}
        <button type="button" class="btn coral" onclick={spend}>{t('purse.go')} {formatYen(picked.yen)}{#if picked.yen >= MONEY.purseNeedsBothAtYen}<small class="bothnote">· {t('purse.both')}</small>{/if}</button>
      {/if}
    {/snippet}
  </Sheet>
{/if}

<style>
  .jar-screen {
    --jar-h: 120px; --jar-host: 72px;
    max-width: var(--col); margin: 0 auto; min-height: 100dvh;
    padding-bottom: calc(var(--dock-h) + var(--dock-bottom) + 16px);
  }
  .hero-wrap {
    position: relative; background: var(--pat-dots), var(--bg); margin-bottom: 26px;
    padding: calc(var(--safe-top) + 60px) calc(var(--side) + var(--safe-right)) 4px calc(var(--side) + var(--safe-left));
  }
  .wave { position: absolute; left: 0; right: 0; bottom: -11px; width: 100%; height: 12px; display: block; fill: var(--bg); }
  .title { display: flex; align-items: center; gap: 10px; font-size: var(--fs-h2); color: var(--text); }
  .title .tile {
    width: 40px; height: 40px; border-radius: var(--r-squircle); display: grid; place-items: center; flex: none; background: var(--app-jar);
    box-shadow: 0 3px 0 color-mix(in srgb, var(--app-jar) 75%, #000 25%), inset 0 2px 0 rgba(255, 255, 255, .45); transform: rotate(-4deg);
  }
  .title .tile svg { width: 26px; height: 26px; color: var(--c-ink); }
  .hero { display: flex; align-items: center; justify-content: center; gap: 16px; color: var(--text); }
  .bigjar { height: var(--jar-h); width: calc(var(--jar-h) * 200 / 240); display: block; overflow: visible; flex: none; }
  .glint { animation: glint 4s ease-in-out infinite; }
  .totals { display: grid; gap: 6px; min-width: 0; }
  .totals :global(.total) { font-size: min(var(--fs-hero), 11vw); }
  .wk { font-size: var(--fs-caption); font-weight: 700; color: var(--text-soft); }
  .hero-wrap :global(.talk) { height: calc(var(--jar-host) + 4px); margin-top: 4px; }

  .cards { display: flex; flex-direction: column; gap: 22px; padding: 0 calc(var(--side) + var(--safe-right)) 0 calc(var(--side) + var(--safe-left)); }
  .ct { font-size: var(--fs-h2); font-weight: 900; text-align: center; margin-bottom: 10px; }

  .next { appearance: none; cursor: pointer; text-align: left; display: flex; align-items: center; gap: 12px; width: 100%; font: inherit; min-height: 76px; }
  .next:active { transform: translateY(3px); box-shadow: 0 1px 0 color-mix(in srgb, var(--card) 78%, #000 22%); }
  .rtxt { flex: 1; min-width: 0; display: grid; gap: 8px; }
  .rl { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; }
  .rl small { font-size: var(--fs-caption); font-weight: 700; color: var(--c-ink-soft); }
  .rl b { font-size: var(--fs-h2); font-weight: 900; }
  .rgoal { font-size: 1.05rem; color: var(--c-ink-soft); margin-left: auto; }
  .chev { width: 26px; height: 26px; color: var(--c-ink-soft); flex: none; }
  .chev svg { width: 100%; height: 100%; display: block; }

  .prow { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
  .prow :global(.bells) { font-size: 1.5rem; min-height: 44px; padding-left: 30px; }
  .go { min-width: 104px; }
  .need { flex: 1 1 8em; min-width: 0; text-align: right; word-break: auto-phrase; text-wrap: balance; font-weight: 700; font-size: var(--fs-caption); line-height: 1.35; color: var(--c-ink-soft); }

  .lgrid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
  .layer { display: grid; justify-items: center; gap: 4px; text-align: center; min-width: 0; }
  .minijar { display: block; width: 32px; height: 38px; }
  .layer .ln { font-size: var(--fs-caption); font-weight: 700; color: var(--c-ink-soft); max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .layer b { font-size: 1.05rem; }

  .payday {
    appearance: none; cursor: pointer; display: flex; align-items: center; gap: 10px; min-height: 56px; padding: 6px 10px 6px 18px; margin: 0;
    border-radius: var(--r-pill); background: var(--c-bubble); border: 2px dashed var(--c-leaf-lip); color: var(--c-ink); font: inherit; text-align: left;
  }
  .pd-t { flex: 1; font-weight: 700; font-size: var(--fs-body-lg); }
  .tick { width: 34px; height: 34px; border-radius: 50%; border: 3px solid var(--c-leaf); flex: none; background: #fff; }
  .payday:active .tick { background: var(--c-leaf-soft); }
  .payday.done { cursor: default; justify-content: center; border-style: solid; border-color: var(--c-leaf-soft); background: var(--c-leaf-soft); color: var(--c-leaf-ink); font-weight: 700; font-size: var(--fs-caption); min-height: 44px; }
  .payday.done svg { width: 18px; height: 18px; }

  .spend { display: flex; align-items: center; gap: 10px; padding: 10px 14px; }
  .both-ic { width: 22px; height: 22px; color: var(--p-berry); flex: none; }
  .sp-l { flex: 1; font-weight: 700; }
  .waiting { font-size: var(--fs-caption); font-weight: 700; color: var(--c-ink-soft); }

  .sheet-title { font-size: var(--fs-h2); text-align: center; margin-bottom: 14px; }
  .sheet-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 16px; }
  .sheet-head h2 { font-size: var(--fs-h2); }

  .ladder { list-style: none; margin: 0; padding: 0 0 6px; display: grid; gap: 12px; }
  .lr { display: flex; align-items: center; gap: 12px; min-height: 64px; padding: 10px 14px; }
  .ln { flex: 1; min-width: 0; font: 900 1.1rem var(--font-ui); display: grid; gap: 6px; }
  .la { font-size: 1.1rem; }
  .lr.done .ln, .lr.done .la { color: var(--c-ink-soft); }
  .lr.next { box-shadow: 0 4px 0 color-mix(in srgb, var(--card) 78%, #000 22%), var(--sh-glow); }

  .shelf { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
  @media (max-width: 339px) { .shelf { grid-template-columns: repeat(2, 1fr); } }
  .item {
    appearance: none; cursor: pointer; padding: 12px 6px 10px; text-align: center; min-height: 112px; font: inherit;
    display: grid; justify-items: center; align-content: center; gap: 2px; transition: transform var(--dur-base) var(--ease-bounce);
  }
  .item:active:not(:disabled) { transform: translateY(3px) scale(1.04, .94); transition-duration: var(--dur-tap); }
  .item.sel { border-color: var(--c-coral); background: var(--pat-grid), var(--c-coral-soft); box-shadow: 0 4px 0 var(--c-coral-lip); transform: translateY(-3px); }
  .item:disabled { cursor: default; box-shadow: none; opacity: .75; }
  .item:disabled .art, .item:disabled .both { opacity: .45; filter: grayscale(.6); }
  .art { width: 44px; height: 44px; margin-bottom: 4px; }
  .item b { font: 700 .9rem/1.2 var(--font-ui); }
  .item .p { font-size: .95rem; color: var(--c-coral-ink); }
  .item:disabled .p { color: var(--c-ink-talk); font-size: var(--fs-caption); }
  .both { position: absolute; top: 6px; right: 6px; width: 20px; height: 20px; color: var(--p-berry); }
  .bothnote { font-size: var(--fs-caption); margin-left: 4px; }

  @media (max-height: 700px), (max-width: 359px) {
    .jar-screen { --jar-h: 96px; --jar-host: 56px; }
    .totals :global(.total) { font-size: 2.25rem; }
    .cards { gap: 16px; }
    .hero-wrap { margin-bottom: 22px; }
  }
  @media (max-width: 339px) {
    .jar-screen { --jar-h: 84px; }
    .totals :global(.total) { font-size: 2rem; }
  }
</style>
