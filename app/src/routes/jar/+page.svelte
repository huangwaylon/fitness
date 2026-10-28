<script lang="ts">
  // 旅の壺 Trip Jar: one hero total, the next rung only (ladder one tap away), layers against their own
  // max, payday cue, quiet weekly estimate, and the Treat Purse (one primary action: 使う).
  import Sheet from '#lib/components/Sheet.svelte';
  import Rope from '#lib/components/Rope.svelte';
  import LeafCoin from '#lib/components/LeafCoin.svelte';
  import HelpButton from '#lib/components/HelpButton.svelte';
  import { week } from '#lib/client/week.svelte.ts';
  import { spendPurse, approveSpend, transferDone } from '#lib/client/actions.ts';
  import { MONEY, SEASONS } from '#lib/config/rules.ts';
  import { t, formatYen, parseLocalDate } from '#lib/i18n/index.ts';

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
  let layersOpen = $state(false);
  let purseOpen = $state(false);
  let picked = $state<(typeof TREATS)[number] | null>(null);

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
    const start = parseLocalDate(SEASONS[0].from).getTime() - 14 * 86400000; // incl. 2 calibration weeks
    const since = Math.floor((parseLocalDate(view.weekKey).getTime() - start) / (7 * 86400000));
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
    return [row(view.me), row(view.partner), { key: 'team', name: t('jar.team'), yen: jar.layers.team, ratio: jar.layers.team / teamMax, color: 'var(--leaf)' }];
  });

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
  <main class="screen jar-screen">
    <div class="screen-head">
      <h1><span class="tile" style:--tile="var(--app-jar)"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#app-jar" /></svg></span>{t('jar.title')}</h1>
      <HelpButton topic="jar" />
    </div>

    <button type="button" class="hero" aria-label={t('jar.layersOpen')} onclick={() => (layersOpen = true)}>
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
      <span class="total"><LeafCoin size={36} spin={jar.totalYen} /><span class="hero-num">{formatYen(jar.totalYen)}</span></span>
      <span class="wk">{t('jar.week', { yen: formatYen(jar.thisWeekEstimateYen) })}</span>
    </button>

    <button type="button" class="card rung" onclick={() => (ladderOpen = true)}>
      <span class="tape" style:--tape="var(--c-sky-soft)">{t('jar.next')}</span>
      <svg class="rart" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="22" fill="var(--c-sky-soft)" /><ellipse cx="24" cy="36" rx="16" ry="6" fill="var(--beach)" /><path d="M25 34 Q23 24 28 15" stroke="var(--trunk)" stroke-width="3" fill="none" stroke-linecap="round" /><path d="M28 15 Q20 10 15 15 M28 15 Q36 9 40 14 M28 15 Q26 8 21 8" stroke="var(--c-leaf-lip)" stroke-width="3.5" fill="none" stroke-linecap="round" /><circle cx="38" cy="10" r="4" fill="var(--c-yuzu)" /></svg>
      {#if jar.nextRung}
        <span class="rtxt">
          <span class="rl"><b>{t('rung.' + jar.nextRung.key)}</b><span class="rgoal money">{formatYen(jar.nextRung.yen)}</span></span>
          <Rope pct={nextPct} height={14} label={t('jar.left', { yen: formatYen(jar.nextRung.remainingYen) })} />
          <span class="rleft">{t('jar.left', { yen: formatYen(jar.nextRung.remainingYen) })}</span>
        </span>
      {:else}
        <span class="rtxt"><span class="rl"><b>{t('jar.allReached')}</b></span></span>
      {/if}
      <span class="chev" aria-hidden="true">›</span>
    </button>

    {#if jar.transfer}
      {#if jar.transfer.done}
        <p class="payday done"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-check" /></svg>{t('jar.payday.done')}</p>
      {:else}
        <button type="button" class="payday" onclick={markPayday}>
          <span class="pd-l">{t('jar.payday')}</span>
          <span class="pd-t">{t('jar.payday.todo', { yen: formatYen(jar.transfer.amountYen) })}</span>
          <span class="tick" aria-hidden="true"></span>
        </button>
      {/if}
    {/if}

    {#each jar.pendingSpends ?? [] as s (s.id)}
      <div class="spend card plain">
        <svg viewBox="0 0 24 24" class="both-ic" aria-hidden="true"><use href="#i-us" /></svg>
        <span class="sp-l">{s.label} <b class="money">{formatYen(s.amountYen)}</b></span>
        {#if s.by === view.me}
          <span class="waiting">{t('purse.waiting')}</span>
        {:else}
          <button type="button" class="btn coral small" onclick={() => approveSpend(s.id)}>{t('purse.approve')}</button>
        {/if}
      </div>
    {/each}

    <div class="purse card">
      <span class="tape" style:--tape="var(--c-coral-soft)">{t('purse.title')}</span>
      <svg class="pic" viewBox="0 0 48 48" aria-hidden="true"><use href="#i-purse" /></svg>
      <span class="big pamt">{formatYen(jar.purseYen)}</span>
      <button type="button" class="btn coral small go" onclick={() => (purseOpen = true)}>{t('purse.spend')}</button>
    </div>
  </main>

  <Sheet bind:open={layersOpen} label={t('jar.layers')}>
    <div class="sheet-head">
      <svg viewBox="0 0 24 24" class="hd-ic" aria-hidden="true"><use href="#i-jar" /></svg>
      <h2>{t('jar.layers')}</h2>
      <span class="big hd-amt">{formatYen(jar.totalYen)}</span>
    </div>
    <div class="layers">
      {#each layers as l (l.key)}
        {@const fill = 25 * Math.max(0.08, Math.min(1, l.ratio))}
        <div class="layer card plain">
          <svg class="minijar" viewBox="0 0 30 36" aria-hidden="true">
            <path d="M8 4 H22 V8 Q28 10 28 16 V30 Q28 34 24 34 H6 Q2 34 2 30 V16 Q2 10 8 8Z" fill="var(--c-bubble)" stroke="var(--c-ink)" stroke-width="2" />
            <path d="M3 {33 - fill} H27 V30 Q27 33 24 33 H6 Q3 33 3 30Z" style:fill={l.color} />
          </svg>
          <b class="money">{formatYen(l.yen)}</b>
          <span>{l.name}</span>
        </div>
      {/each}
    </div>
  </Sheet>

  <Sheet bind:open={ladderOpen} label={t('jar.ladder')}>
    <div class="sheet-head">
      <svg viewBox="0 0 24 24" class="hd-ic" aria-hidden="true"><use href="#i-island" /></svg>
      <h2>{t('jar.ladder')}</h2>
    </div>
    <ul class="ladder">
      {#each jar.rungs as r (r.key)}
        {@const next = r.key === nextUnreachedKey}
        <li class="lr" class:done={r.reached} class:next>
          <span class="dot">{#if r.reached}<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-check" /></svg>{/if}</span>
          <span class="ln">{t('rung.' + r.key)}{#if next}<Rope pct={(jar.totalYen / r.yen) * 100} height={10} />{/if}</span>
          <span class="la money">{formatYen(r.yen)}</span>
        </li>
      {/each}
    </ul>
  </Sheet>

  <Sheet bind:open={purseOpen} label={t('purse.title')} onclose={() => (picked = null)}>
    <div class="sheet-head">
      <svg viewBox="0 0 48 48" class="hd-ic" aria-hidden="true"><use href="#i-purse" /></svg>
      <h2>{t('purse.title')}</h2>
      <span class="big hd-amt">{formatYen(jar.purseYen)}</span>
    </div>
    <div class="shelf">
      {#each TREATS as item (item.key)}
        {@const out = item.yen > jar.purseYen}
        <button type="button" class="item" class:sel={picked?.key === item.key} disabled={out} aria-pressed={picked?.key === item.key} onclick={() => (picked = item)}>
          {#if item.yen >= MONEY.purseNeedsBothAtYen}<svg class="both" viewBox="0 0 24 24" aria-label={t('purse.both')}><use href="#i-us" /></svg>{/if}
          <svg class="art" viewBox={item.vb} aria-hidden="true"><use href="#{item.icon}" /></svg>
          <b>{t(`treat.${item.key}`)}</b>
          <span class="p money">{formatYen(item.yen)}</span>
        </button>
      {/each}
    </div>
    {#if picked}
      <div class="confirm">
        <p>{t('purse.confirm', { label: t(`treat.${picked.key}`) })}{#if picked.yen >= MONEY.purseNeedsBothAtYen}<small>{t('purse.both')}</small>{/if}</p>
        <button type="button" class="btn coral" onclick={spend}>{t('purse.go')} {formatYen(picked.yen)}</button>
      </div>
    {/if}
  </Sheet>
{/if}

<style>
  .jar-screen { display: flex; flex-direction: column; gap: 18px; }
  .hero { appearance: none; background: none; border: 0; padding: 0; cursor: pointer; color: var(--text); display: grid; justify-items: center; gap: 2px; }
  .bigjar { width: 132px; height: 158px; display: block; overflow: visible; transform-origin: 50% 100%; transition: transform var(--dur-base) var(--ease-bounce); }
  .hero:active .bigjar { transform: scale(1.05, .94); transition-duration: var(--dur-tap); }
  .glint { animation: glint 4s ease-in-out infinite; }
  .total { margin-top: 6px; display: flex; align-items: center; gap: 8px; }
  .wk { font-size: var(--fs-caption); font-weight: 700; color: var(--text-faint); }

  .rung { appearance: none; cursor: pointer; text-align: left; color: var(--text); display: flex; align-items: center; gap: 12px; padding: 20px 16px 14px; width: 100%; font: inherit; }
  .rung:active { transform: translateY(3px); box-shadow: var(--sh-lip-pressed); }
  .rart { width: 52px; height: 52px; flex: none; }
  .rtxt { flex: 1; min-width: 0; display: grid; gap: 6px; }
  .rl { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
  .rl b { font-size: var(--fs-h2); font-weight: 900; }
  .rgoal { font-size: 1.1rem; color: var(--text-soft); }
  .rleft { font-size: var(--fs-caption); font-weight: 700; color: var(--c-leaf-ink); }
  :global(:root[data-theme="night"]) .rleft { color: var(--c-leaf-soft); }
  .chev { font: 700 1.6rem var(--font-num); color: var(--text-faint); }

  .payday {
    appearance: none; cursor: pointer; display: flex; align-items: center; gap: 10px; min-height: 52px; padding: 6px 10px 6px 16px; margin: 0;
    border-radius: var(--r-pill); background: var(--surface); border: 2px dashed var(--c-leaf); color: var(--text); font: inherit; text-align: left;
  }
  .pd-l { font-size: var(--fs-micro); font-weight: 700; color: var(--text-faint); white-space: nowrap; }
  .pd-t { flex: 1; font-weight: 700; font-size: var(--fs-body); }
  .tick { width: 32px; height: 32px; border-radius: 50%; border: 3px solid var(--c-leaf); flex: none; background: var(--bg); }
  .payday:active .tick { background: var(--c-leaf-soft); }
  .payday.done { cursor: default; justify-content: center; border-style: solid; border-color: var(--c-leaf-soft); background: var(--c-leaf-soft); color: var(--c-leaf-ink); font-weight: 700; font-size: var(--fs-caption); min-height: 40px; }
  .payday.done svg { width: 18px; height: 18px; }

  .spend { display: flex; align-items: center; gap: 10px; padding: 10px 14px; }
  .both-ic { width: 22px; height: 22px; color: var(--p-berry); flex: none; }
  .sp-l { flex: 1; font-weight: 700; }
  .waiting { font-size: var(--fs-caption); font-weight: 700; color: var(--text-faint); }

  .purse { display: flex; align-items: center; gap: 12px; padding: 22px 16px 12px; background: var(--c-coral-soft); border-color: var(--c-coral); box-shadow: 0 4px 0 var(--c-coral-lip); color: var(--c-ink); --stitch: rgba(224, 127, 107, .45); }
  .pic { width: 48px; height: 48px; flex: none; }
  .pamt { font-size: 2rem; flex: 1; }
  .go { min-width: 96px; }

  .layers { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 8px; }
  .layer { text-align: center; padding: 12px 6px; display: grid; justify-items: center; gap: 4px; }
  .minijar { display: block; width: 40px; height: 48px; }
  .layer b { font-size: 1.1rem; }
  .layer span { font-size: var(--fs-caption); font-weight: 700; color: var(--text-soft); }

  .sheet-head { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
  .hd-ic { width: 40px; height: 40px; color: var(--text-soft); flex: none; }
  .sheet-head h2 { font-size: var(--fs-h2); }
  .hd-amt { margin-left: auto; font-size: 2rem; }

  .ladder { list-style: none; margin: 0; padding: 0; display: grid; gap: 4px; }
  .lr { display: flex; align-items: center; gap: 12px; min-height: 56px; padding: 0 6px; border-bottom: 2px dashed var(--stitch); }
  .lr:last-child { border-bottom: 0; }
  .dot { width: 32px; height: 32px; flex: none; border-radius: 50%; border: 3px solid var(--stitch); background: var(--bg); display: grid; place-items: center; }
  .lr.done .dot { background: var(--c-leaf); border-color: var(--c-leaf-lip); }
  .lr.done .dot svg { width: 16px; height: 16px; color: var(--ink); }
  .lr.next .dot { border-color: var(--c-yuzu-lip); background: var(--c-yuzu); box-shadow: var(--sh-glow); animation: if-pop var(--dur-pop) var(--ease-bounce) both; }
  .ln { flex: 1; font: 900 1.1rem var(--font-ui); display: grid; gap: 6px; }
  .la { font-size: 1.1rem; }
  .lr.done .ln, .lr.done .la { color: var(--text-faint); }

  .shelf { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
  .item {
    appearance: none; cursor: pointer; position: relative; border-radius: var(--r-card); background: var(--c-paper); color: var(--c-ink);
    border: 2px solid var(--paper-edge); box-shadow: 0 4px 0 var(--sand-deep); outline: 2px dashed var(--c-stitch); outline-offset: -6px;
    transition: transform var(--dur-base) var(--ease-bounce); padding: 10px 6px; text-align: center; min-height: 116px;
    display: grid; justify-items: center; align-content: center; gap: 2px;
  }
  .item:active:not(:disabled) { transform: translateY(3px) scale(1.04, .94); transition-duration: var(--dur-tap); }
  .item.sel { border-color: var(--c-coral); background: var(--c-coral-soft); box-shadow: 0 4px 0 var(--c-coral-lip); outline-color: rgba(224, 127, 107, .5); transform: translateY(-3px); }
  .item:disabled { opacity: .45; cursor: default; }
  .art { width: 44px; height: 44px; margin-bottom: 4px; }
  .item b { font: 700 .9rem var(--font-ui); }
  .item .p { font-size: 1rem; color: var(--coral-ink); }
  .both { position: absolute; top: 6px; right: 6px; width: 20px; height: 20px; color: #F28BA8; }
  .confirm { margin-top: 16px; display: grid; gap: 10px; }
  .confirm p { margin: 0; text-align: center; font-weight: 700; font-size: var(--fs-body-lg); }
  .confirm small { display: block; font-size: var(--fs-caption); color: var(--text-faint); }
</style>
