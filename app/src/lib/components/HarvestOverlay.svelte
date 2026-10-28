<script lang="ts">
  // 日曜の収穫 (Sunday harvest overlay, ≤ 60 s): tally → rung reached (optional) → next promise → 壺に入れる.
  import { untrack } from 'svelte';
  import type { HarvestView, PersonId, PromiseKind, PromiseResult } from '#lib/types.ts';
  import { RUNGS } from '#lib/config/rules.ts';
  import Villager from './Villager.svelte';
  import PromiseEditor from './PromiseEditor.svelte';
  import { week, type WeekViewX } from '#lib/client/week.svelte.ts';
  import { confirmHarvest, setPromise } from '#lib/client/actions.ts';
  import { t, formatYen } from '#lib/i18n/index.ts';

  interface Props {
    view: WeekViewX;
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

  let step = $state<'tally' | 'rung' | 'promise'>('tally');
  let busy = $state(false);

  // Promise defaults: this week's promise carried over, else empty.
  const cur = untrack(() => view.people[view.me].promise);
  let daysMask = $state(cur?.daysMask ?? 0);
  let kind = $state<PromiseKind>(cur?.kind ?? 'any');
  let note = $state(cur?.note ?? '');

  function next() {
    step = step === 'tally' && rung ? 'rung' : 'promise';
  }

  async function drop() {
    busy = true;
    if (daysMask > 0) await setPromise(daysMask, kind, note);
    const r = await confirmHarvest();
    busy = false;
    if (r.ok && !harvest.confirmedBy.includes(partner)) {
      week.showToast(t('harvest.waiting', { name: view.people[partner].villagerName }), 3200);
    }
  }

  function mark(r: PromiseResult | null): { sym: string; key: string } | null {
    if (!r) return null;
    return { kept: { sym: '✓', key: 'kept' }, open: { sym: '○', key: 'open' }, paused: { sym: '', key: 'paused' } }[r];
  }
  const people: PersonId[] = $derived([me, partner]);
  const CONFETTI = ['#E8F59A', '#FFB38A', '#7BC67E', '#F28BA8', '#8FD3F4', '#F6E7B0'];
</script>

<div class="overlay" role="dialog" aria-modal="true" aria-label={t('harvest.title')}>
  <div class="stars" aria-hidden="true">
    <i style="top:9%;left:10%"></i><i style="top:12%;left:78%;animation-delay:.6s"></i>
    <i style="top:19%;left:5%;animation-delay:1.2s"></i><i style="top:86%;left:92%;animation-delay:.3s"></i>
  </div>
  {#if step !== 'promise'}
    <div class="confetti" aria-hidden="true">
      {#each CONFETTI as c, i (i)}<i style="left:{10 + i * 15}%;background:{c};animation-delay:{(step === 'tally' ? 3 : 0) + i * 0.3}s"></i>{/each}
    </div>
  {/if}

  <div class="col">
    <div class="head">
      <span class="pill">{t('harvest.title')}</span>
      <button type="button" class="pill later" onclick={onlater}>{t('common.later')}</button>
    </div>

    {#if step === 'tally'}
      <section class="tally" aria-live="polite">
        {#each people as who, i (who)}
          <div class="trow" style="animation-delay:{0.3 + i * 0.7}s">
            <span class="av"><Villager person={who} size={42} label={view.people[who].villagerName} /></span>
            <span class="sc big">{p[who].score}</span>
            <span class="yen big">{formatYen(p[who].fruitYen)}</span>
          </div>
        {/each}
        <div class="trow" style="animation-delay:1.7s">
          <span class="av team"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-us" /></svg></span>
          <span class="sc team-l">{t('harvest.team')}</span>
          <span class="yen big">{formatYen(p.teamYen)}</span>
        </div>
        <div class="ttotal">
          <span class="lbl">
            <svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-jar" /></svg>
            <span>{t('harvest.jar')}<br /><span class="prov">{t('harvest.provisional')}</span></span>
          </span>
          <span class="big total">{formatYen(jarTotal)}</span>
        </div>
      </section>

      {#if purseTotal > 0}
        <div class="purse-n">
          <svg viewBox="0 0 48 48" aria-hidden="true"><use href="#i-purse" /></svg>
          <span class="lbl">{t('harvest.purse')}</span>
          <span class="big">+{formatYen(purseTotal)}</span>
        </div>
      {/if}

      <div class="promises">
        <h3>{t('promise.last')}</h3>
        <div class="marks">
          {#each people as who (who)}
            {@const m = mark(harvest.promiseResults[who])}
            {#if m}
              <span class="prom">
                <Villager person={who} size={34} />
                <i class="mk {m.key}" aria-label={t('promise.result.' + m.key)}>
                  {#if m.key === 'paused'}<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-cozy" /></svg>{:else}{m.sym}{/if}
                </i>
              </span>
            {/if}
          {/each}
        </div>
      </div>

      <div class="cta"><button type="button" class="btn moon" onclick={next}>{t('common.next')}</button></div>
    {:else if step === 'rung' && rung}
      <div class="rung">
        <svg class="hero" viewBox="0 0 300 260" aria-hidden="true">
          <circle cx="150" cy="120" r="110" fill="#2B3A5C" /><circle cx="150" cy="120" r="110" fill="none" stroke="#F6E7B0" stroke-width="3" stroke-dasharray="4 10" />
          <ellipse cx="150" cy="190" rx="100" ry="28" fill="#E9D8B4" /><ellipse cx="150" cy="182" rx="80" ry="18" fill="#7BC67E" />
          <path d="M160 180 Q150 130 172 88" stroke="#8A5A3B" stroke-width="9" fill="none" stroke-linecap="round" />
          <path d="M172 88 Q140 64 116 86 M172 88 Q204 58 230 80 M172 88 Q160 50 136 52 M172 88 Q192 100 196 126" stroke="#4E9A55" stroke-width="12" fill="none" stroke-linecap="round" />
          <use href={me === 'B' ? '#v-mochi' : '#v-bean'} x="90" y="146" width="48" height="48" />
          <use href={partner === 'B' ? '#v-mochi' : '#v-bean'} x="186" y="146" width="50" height="50" />
          <circle cx="232" cy="44" r="16" fill="#FFD66B" />
        </svg>
        <div class="rname">{t('rung.' + rung.key)}</div>
        <div class="ramt big">{formatYen(rung.yen)}</div>
        {#if nextRung}<div class="rnext">{t('harvest.nextRung', { place: t('rung.' + nextRung.key), yen: formatYen(nextRung.yen) })}</div>{/if}
      </div>
      <div class="cta"><button type="button" class="btn moon" onclick={next}>{t('harvest.yay')}</button></div>
    {:else}
      <div class="promise-step">
        <h2>{t('promise.next')}</h2>
        <PromiseEditor bind:daysMask bind:kind bind:note night />
      </div>
      <div class="cta">
        <button type="button" class="btn moon" disabled={busy} onclick={drop}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-jar" /></svg>{t('harvest.drop')}
        </button>
      </div>
    {/if}
  </div>
</div>

<style>
  .overlay {
    position: fixed; inset: 0; z-index: 60; overflow: auto; color: var(--night-ink);
    background: linear-gradient(180deg, #16203A 0%, var(--night-sky) 40%, var(--night-sky-2) 100%);
    animation: fade var(--dur-base) var(--ease-soft);
  }
  @keyframes fade { from { opacity: 0; } to { opacity: 1; } }
  .col {
    position: relative; max-width: var(--col); margin: 0 auto; min-height: 100%; display: flex; flex-direction: column; gap: 14px;
    padding: calc(var(--safe-top) + 8px) calc(16px + var(--safe-right)) calc(var(--safe-bottom) + 18px) calc(16px + var(--safe-left));
  }
  .head { display: flex; justify-content: space-between; align-items: center; min-height: 48px; }
  .pill { background: rgba(51, 69, 107, .9); border-color: var(--night-edge); color: var(--night-ink); box-shadow: 0 2px 0 #18213A; }
  .later { cursor: pointer; min-height: 44px; }
  .stars, .confetti { position: fixed; inset: 0; pointer-events: none; overflow: hidden; }
  .stars i { position: absolute; width: 3px; height: 3px; border-radius: 50%; background: #fff; animation: twinkle 3s ease-in-out infinite; }
  .confetti i { position: absolute; top: -20px; width: 12px; height: 8px; border-radius: 8px 0; animation: fall 4.5s linear infinite; }

  .tally {
    background: var(--night-card); border: 2px solid var(--night-edge); border-radius: var(--r-lg);
    box-shadow: 0 4px 0 #18213A, 0 18px 40px rgba(0, 0, 0, .35); padding: 6px 16px;
  }
  .trow { display: flex; align-items: center; gap: 12px; min-height: 62px; border-bottom: 2px dashed var(--night-edge); opacity: 0; animation: rowIn .5s var(--ease-soft) forwards; }
  .av { width: 42px; height: 42px; flex: none; border-radius: 50%; background: var(--night-sky-2); display: grid; place-items: center; overflow: hidden; }
  .av.team svg { width: 24px; height: 24px; color: #F28BA8; }
  .sc { font-size: 1.9rem; min-width: 62px; }
  .team-l { font: 700 1.2rem var(--font-body); }
  .yen { margin-left: auto; font-size: 1.45rem; color: var(--moon); }
  .ttotal { display: flex; justify-content: space-between; align-items: center; min-height: 66px; opacity: 0; animation: rowIn .6s var(--ease-bounce) 2.4s forwards; }
  .ttotal .lbl { display: flex; align-items: center; gap: 8px; font-weight: 700; color: var(--night-ink-soft); line-height: 1.3; }
  .ttotal .lbl svg { width: 28px; height: 28px; }
  .total { font-size: 2.5rem; color: var(--moon); text-shadow: 0 0 18px rgba(246, 231, 176, .45); }
  .prov { display: inline-flex; font: 700 11px var(--font-body); color: var(--night-ink-soft); background: rgba(255, 255, 255, .08); border-radius: var(--r-pill); padding: 2px 9px; }

  .purse-n {
    display: flex; align-items: center; gap: 12px; padding: 10px 16px; border-radius: var(--r-md);
    background: rgba(255, 155, 135, .14); border: 2px solid rgba(255, 155, 135, .6);
    opacity: 0; animation: rowIn .6s var(--ease-soft) 3s forwards;
  }
  .purse-n svg { width: 36px; height: 36px; }
  .purse-n .lbl { font-weight: 700; color: #FFC9BC; }
  .purse-n .big { margin-left: auto; font-size: 1.5rem; color: #FFC9BC; }

  .promises { padding: 10px 16px; border-radius: var(--r-md); background: rgba(51, 69, 107, .7); border: 2px solid var(--night-edge); opacity: 0; animation: rowIn .6s var(--ease-soft) 3.4s forwards; }
  .promises h3 { font-size: .95rem; color: var(--night-ink-soft); margin-bottom: 6px; }
  .marks { display: flex; gap: 22px; }
  .prom { display: flex; align-items: center; gap: 8px; }
  .mk { width: 30px; height: 30px; border-radius: 50%; display: grid; place-items: center; font-style: normal; font-weight: 700; font-size: 16px; background: rgba(232, 245, 154, .18); color: var(--firefly); }
  .mk.open { background: rgba(255, 255, 255, .08); color: var(--night-ink-soft); }
  .mk.paused { background: rgba(159, 168, 232, .2); }
  .mk svg { width: 18px; height: 18px; }

  .cta { margin-top: auto; padding-top: 8px; }

  .rung { text-align: center; display: grid; justify-items: center; gap: 6px; margin-top: 4vh; }
  .hero { width: min(300px, 80vw); height: auto; }
  .rname { font: 700 2.6rem var(--font-display); margin-top: 12px; }
  .ramt { font-size: 3rem; color: var(--moon); text-shadow: 0 0 18px rgba(246, 231, 176, .45); }
  .rnext { font-weight: 700; color: var(--night-ink-soft); margin-top: 10px; }

  .promise-step { display: grid; gap: 14px; margin-top: 2vh; }
  .promise-step h2 { font-size: 1.6rem; }
</style>
