<script lang="ts">
  // 旅の壺 Trip Jar: one hero total, the next rung only (ladder one tap away), layers against their own
  // max, payday cue, quiet weekly estimate, and the Treat Purse (one primary action: 使う).
  import Sheet from '#lib/components/Sheet.svelte';
  import Rope from '#lib/components/Rope.svelte';
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
  let purseOpen = $state(false);
  let picked = $state<(typeof TREATS)[number] | null>(null);

  // Jar strata: B at the bottom, A in the middle, team on top (mockup), proportional to the layers.
  const strata = $derived.by(() => {
    if (!jar) return { b: 0, a: 0, team: 0 };
    const sum = Math.max(1, jar.layers.A + jar.layers.B + jar.layers.team);
    const h = 174; // fill height inside the jar drawing (y 58 → 232)
    return { b: (jar.layers.B / sum) * h, a: (jar.layers.A / sum) * h, team: (jar.layers.team / sum) * h };
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
      <h1><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-jar" /></svg>{t('jar.title')}</h1>
      <HelpButton topic="jar" />
    </div>

    <svg class="bigjar" viewBox="0 0 200 240" aria-hidden="true">
      <defs><clipPath id="bj"><path d="M64 30 Q24 48 24 96 V200 Q24 232 56 232 H144 Q176 232 176 200 V96 Q176 48 136 30 Z" /></clipPath></defs>
      <rect x="58" y="6" width="84" height="24" rx="7" fill="#F2B53A" stroke="#4A3A2C" stroke-width="3" />
      <path d="M64 30 Q24 48 24 96 V200 Q24 232 56 232 H144 Q176 232 176 200 V96 Q176 48 136 30 Z" fill="#DDF2FB" fill-opacity=".85" />
      <g clip-path="url(#bj)">
        <rect x="0" y={232 - strata.b} width="200" height={strata.b + 10} fill="#B79CE0" />
        <rect x="0" y={232 - strata.b - strata.a} width="200" height={strata.a} fill="#FFB38A" />
        <path d="M0 {232 - strata.b - strata.a - strata.team} q25 -6 50 0 t50 0 t50 0 t50 0 V{232 - strata.b - strata.a} H0Z" fill="#7BC67E" />
      </g>
      <path d="M64 30 Q24 48 24 96 V200 Q24 232 56 232 H144 Q176 232 176 200 V96 Q176 48 136 30 Z" fill="none" stroke="#4A3A2C" stroke-width="3" />
      <path d="M44 100 Q40 130 44 160" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".7" />
      <path class="glint" d="M160 40 l4 -9 l4 9 l9 4 l-9 4 l-4 9 l-4 -9 l-9 -4 z" fill="#FFD66B" />
    </svg>

    <div class="total big">{formatYen(jar.totalYen)}</div>

    <button type="button" class="card rung" onclick={() => (ladderOpen = true)}>
      <svg class="rart" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="22" fill="#DDF2FB" /><ellipse cx="24" cy="36" rx="16" ry="6" fill="#E9D8B4" /><path d="M25 34 Q23 24 28 15" stroke="#8A5A3B" stroke-width="3" fill="none" stroke-linecap="round" /><path d="M28 15 Q20 10 15 15 M28 15 Q36 9 40 14 M28 15 Q26 8 21 8" stroke="#4E9A55" stroke-width="3.5" fill="none" stroke-linecap="round" /></svg>
      {#if jar.nextRung}
        <span class="rtxt">
          <span class="rl">{t('jar.next')} <b>{t('rung.' + jar.nextRung.key)}</b></span>
          <Rope pct={nextPct} />
          <span class="rleft">{t('jar.left', { yen: formatYen(jar.nextRung.remainingYen) })}</span>
        </span>
        <span class="rgoal big">{formatYen(jar.nextRung.yen)}</span>
      {:else}
        <span class="rtxt"><span class="rl"><b>{t('jar.allReached')}</b></span></span>
      {/if}
      <span class="chev" aria-hidden="true">›</span>
    </button>

    <div class="layers">
      {#each layers as l (l.key)}
        {@const fill = 25 * Math.max(0.08, Math.min(1, l.ratio))}
        <div class="layer">
          <svg class="minijar" viewBox="0 0 30 36" aria-hidden="true">
            <path d="M8 4 H22 V8 Q28 10 28 16 V30 Q28 34 24 34 H6 Q2 34 2 30 V16 Q2 10 8 8Z" fill="#fff" stroke="#4A3A2C" stroke-width="2" />
            <path d="M3 {33 - fill} H27 V30 Q27 33 24 33 H6 Q3 33 3 30Z" style:fill={l.color} />
          </svg>
          <b class="money">{formatYen(l.yen)}</b>
          <span>{l.name}</span>
        </div>
      {/each}
    </div>

    <div class="quiet">
      {#if jar.transfer}
        {#if jar.transfer.done}
          <span class="payday done"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-check" /></svg>{t('jar.payday.done')}</span>
        {:else}
          <button type="button" class="payday" onclick={() => jar.transfer && transferDone(jar.transfer.month)}>
            {t('jar.payday.todo', { yen: formatYen(jar.transfer.amountYen) })}
          </button>
        {/if}
      {/if}
      <span class="wk">{t('jar.week', { yen: formatYen(jar.thisWeekEstimateYen) })}</span>
    </div>

    {#each jar.pendingSpends ?? [] as s (s.id)}
      <div class="spend card">
        <span>{s.label} <b class="money">{formatYen(s.amountYen)}</b></span>
        {#if s.by === view.me}
          <span class="waiting">{t('purse.waiting')}</span>
        {:else}
          <button type="button" class="btn small" onclick={() => approveSpend(s.id)}>{t('purse.approve')}</button>
        {/if}
      </div>
    {/each}

    <div class="purse">
      <svg viewBox="0 0 48 48" aria-hidden="true"><use href="#i-purse" /></svg>
      <div><div class="lbl">{t('purse.title')}</div><div class="big">{formatYen(jar.purseYen)}</div></div>
      <button type="button" class="go" onclick={() => (purseOpen = true)}>{t('purse.spend')}</button>
    </div>
  </main>

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
  .jar-screen { display: flex; flex-direction: column; gap: 14px; }
  .bigjar { width: 125px; height: 150px; margin: 4px auto 0; display: block; overflow: visible; }
  .glint { animation: glint 4s ease-in-out infinite; }
  .total { font-size: 3rem; text-align: center; margin-top: -2px; }

  .rung { appearance: none; cursor: pointer; text-align: left; color: var(--text); display: flex; align-items: center; gap: 12px; padding: 12px 14px; width: 100%; }
  .rung:active { transform: translateY(3px); box-shadow: var(--sh-lip-pressed); }
  .rart { width: 48px; height: 48px; flex: none; }
  .rtxt { flex: 1; min-width: 0; display: grid; gap: 5px; }
  .rl { font-weight: 700; font-size: var(--fs-body); color: var(--text-soft); }
  .rl b { font-size: 1.2rem; color: var(--text); }
  .rleft { font-size: var(--fs-caption); font-weight: 700; color: var(--leaf-ink); }
  :global(:root[data-theme="night"]) .rleft { color: var(--leaf-soft); }
  .rgoal { font-size: 1.25rem; }
  .chev { font: 700 1.6rem var(--font-display); color: var(--text-faint); }

  .layers { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .layer { border-radius: var(--r-sm); padding: 8px 6px; text-align: center; background: var(--surface); border: 2px solid var(--edge); }
  .minijar { display: block; width: 30px; height: 36px; margin: 0 auto 4px; }
  .layer b { display: block; font-size: 1.05rem; }
  .layer span { font-size: var(--fs-caption); font-weight: 700; color: var(--text-soft); }

  .quiet { display: grid; justify-items: center; gap: 8px; }
  .payday {
    appearance: none; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; min-height: 36px; padding: 6px 14px;
    border-radius: var(--r-pill); background: var(--surface); border: 2px dashed var(--leaf); font-size: var(--fs-caption); font-weight: 700; color: var(--text);
  }
  .payday.done { cursor: default; background: #EAF7E6; border: 2px solid var(--leaf-soft); color: var(--leaf-ink); }
  .payday svg { width: 16px; height: 16px; }
  .wk { font-size: var(--fs-caption); font-weight: 700; color: var(--text-faint); }

  .spend { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 10px 14px; }
  .waiting { font-size: var(--fs-caption); font-weight: 700; color: var(--text-faint); }

  .purse {
    display: flex; align-items: center; gap: 12px; padding: 12px 14px; color: var(--ink);
    background: var(--coral-soft); border: 2px solid var(--coral); border-radius: var(--r-lg); box-shadow: 0 4px 0 #E8B4A8;
  }
  .purse svg { width: 46px; height: 46px; flex: none; }
  .purse .lbl { font-weight: 700; font-size: var(--fs-caption); color: var(--coral-ink); }
  .purse .big { font-size: 1.9rem; }
  .go {
    appearance: none; border: 0; cursor: pointer; margin-left: auto; min-height: 48px; padding: 0 22px; border-radius: var(--r-pill);
    background: #fff; color: var(--ink); font-weight: 700; font-size: var(--fs-body-lg); box-shadow: 0 3px 0 #E8B4A8;
  }
  .go:active { transform: translateY(2px); box-shadow: 0 1px 0 #E8B4A8; }

  .sheet-head { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
  .hd-ic { width: 40px; height: 40px; color: var(--leaf-deep); flex: none; }
  .sheet-head h2 { font-size: 1.35rem; }
  .hd-amt { margin-left: auto; font-size: 2rem; }

  .ladder { list-style: none; margin: 0; padding: 0; display: grid; gap: 4px; }
  .lr { display: flex; align-items: center; gap: 12px; min-height: 56px; padding: 0 6px; border-bottom: 2px dashed var(--edge); }
  .lr:last-child { border-bottom: 0; }
  .dot { width: 30px; height: 30px; flex: none; border-radius: 50%; border: 2.5px solid var(--sand-deep); display: grid; place-items: center; }
  .lr.done .dot { background: var(--leaf); border-color: var(--leaf); }
  .lr.done .dot svg { width: 16px; height: 16px; color: var(--ink); }
  .lr.next .dot { border-color: var(--gold); box-shadow: var(--sh-glow); }
  .ln { flex: 1; font: 600 1.15rem var(--font-display); display: grid; gap: 4px; }
  .la { font-size: 1.1rem; }
  .lr.done .ln, .lr.done .la { color: var(--text-faint); }

  .shelf { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
  .item {
    appearance: none; cursor: pointer; position: relative; border-radius: var(--r-md); background: var(--paper); color: var(--ink);
    border: 2px solid var(--paper-edge); box-shadow: var(--sh-lip); padding: 10px 6px; text-align: center; min-height: 116px;
    display: grid; justify-items: center; align-content: center; gap: 2px;
  }
  .item.sel { border-color: var(--coral); background: var(--coral-soft); }
  .item:disabled { opacity: .45; cursor: default; }
  .art { width: 44px; height: 44px; margin-bottom: 4px; }
  .item b { font: 600 .9rem var(--font-body); }
  .item .p { font-size: 1rem; color: var(--coral-ink); }
  .both { position: absolute; top: 6px; right: 6px; width: 20px; height: 20px; color: #F28BA8; }
  .confirm { margin-top: 16px; display: grid; gap: 10px; }
  .confirm p { margin: 0; text-align: center; font-weight: 700; font-size: var(--fs-body-lg); }
  .confirm small { display: block; font-size: var(--fs-caption); color: var(--text-faint); }
</style>
