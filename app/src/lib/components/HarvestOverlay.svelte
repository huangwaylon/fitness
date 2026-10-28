<script lang="ts">
  // 日曜の収穫 (Sunday harvest overlay, ≤ 60 s): tally → rung reached (optional) → next promise → 壺に入れる.
  import { untrack } from 'svelte';
  import type { HarvestView, PersonId, PromiseKind, PromiseResult } from '#lib/types.ts';
  import { RUNGS } from '#lib/config/rules.ts';
  import Villager from './Villager.svelte';
  import PromiseEditor from './PromiseEditor.svelte';
  import Bubble from './Bubble.svelte';
  import { week } from '#lib/client/week.svelte.ts';
  import type { WeekView } from '#lib/types.ts';
  import { confirmHarvest, setPromise } from '#lib/client/actions.ts';
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
  const steps = $derived<('tally' | 'rung' | 'promise')[]>(rung ? ['tally', 'rung', 'promise'] : ['tally', 'promise']);
  const juniLine = $derived(step === 'tally' ? t('harvest.hello') : step === 'rung' ? t('harvest.rungReached') : t('harvest.promiseAsk'));
  const CONFETTI = ['#E8F59A', '#FFB38A', '#7BC67E', '#F28BA8', '#8FD3F4', '#F6E7B0'];
</script>

<div class="overlay" role="dialog" aria-modal="true" aria-label={t('harvest.title')}>
  {#if step !== 'promise'}
    <div class="confetti" aria-hidden="true">
      {#each CONFETTI as c, i (i)}<i style="left:{8 + i * 16}%;background:{c};animation-delay:{(step === 'tally' ? 3 : 0) + i * 0.3}s"></i>{/each}
    </div>
  {/if}

  <div class="col">
    <div class="head">
      <span class="pill title"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-jar" /></svg>{t('harvest.title')}</span>
      <span class="steps" aria-hidden="true">{#each steps as s (s)}<i class:on={s === step}></i>{/each}</span>
      <button type="button" class="pill later" onclick={onlater}>{t('common.later')}</button>
    </div>

    <Bubble text={juniLine} expression={step === 'promise' ? 'happy' : 'cheer'} />

    {#if step === 'tally'}
      <section class="tally card" aria-live="polite">
        {#each people as who, i (who)}
          <div class="trow" style="animation-delay:{0.3 + i * 0.7}s">
            <span class="av"><Villager person={who} size={44} label={view.people[who].villagerName} /></span>
            <span class="sc big">{p[who].score}</span>
            <span class="yen big">+{formatYen(p[who].fruitYen)}</span>
          </div>
        {/each}
        <div class="trow" style="animation-delay:1.7s">
          <span class="av team"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-us" /></svg></span>
          <span class="sc team-l">{t('harvest.team')}</span>
          <span class="yen big">+{formatYen(p.teamYen)}</span>
        </div>
        <div class="ttotal">
          <span class="lbl">
            <svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-jar" /></svg>
            <span>{t('harvest.jar')}<br /><span class="prov">{t('harvest.provisional')}</span></span>
          </span>
          <span class="big total">{formatYen(jarTotal)}</span>
        </div>
      </section>

      <div class="minis">
        {#if purseTotal > 0}
          <div class="mini purse-n">
            <svg viewBox="0 0 48 48" aria-hidden="true"><use href="#i-purse" /></svg>
            <span class="big">+{formatYen(purseTotal)}</span>
          </div>
        {/if}
        <div class="mini promises" aria-label={t('promise.last')}>
          {#each people as who (who)}
            {@const m = mark(harvest.promiseResults[who])}
            {#if m}
              <span class="prom">
                <Villager person={who} size={32} />
                <i class="mk {m.key}" aria-label={t('promise.result.' + m.key)}>
                  {#if m.key === 'paused'}<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-cozy" /></svg>{:else}{m.sym}{/if}
                </i>
              </span>
            {/if}
          {/each}
        </div>
      </div>

      <div class="cta"><button type="button" class="btn yuzu" onclick={next}>{t('common.next')}</button></div>
    {:else if step === 'rung' && rung}
      <div class="rung">
        <div class="hero">
          <svg viewBox="0 0 300 240" aria-hidden="true">
            <circle cx="150" cy="120" r="110" fill="var(--night-sky-2)" /><circle cx="150" cy="120" r="110" fill="none" stroke="var(--moon)" stroke-width="3" stroke-dasharray="4 10" />
            <ellipse cx="150" cy="190" rx="104" ry="28" fill="var(--c-paper-2)" /><ellipse cx="150" cy="182" rx="84" ry="18" fill="var(--c-leaf)" />
            <path d="M160 180 Q150 130 172 88" stroke="var(--trunk)" stroke-width="9" fill="none" stroke-linecap="round" />
            <path d="M172 88 Q140 64 116 86 M172 88 Q204 58 230 80 M172 88 Q160 50 136 52 M172 88 Q192 100 196 126" stroke="var(--c-leaf-lip)" stroke-width="12" fill="none" stroke-linecap="round" />
            <circle cx="232" cy="44" r="16" fill="var(--c-yuzu)" />
          </svg>
          <span class="v1"><Villager person={me} size={72} expression="cheer" emote /></span>
          <span class="v2"><Villager person={partner} size={72} expression="cheer" emote /></span>
        </div>
        <div class="rname">{t('rung.' + rung.key)}</div>
        <div class="ramt hero-num">{formatYen(rung.yen)}</div>
        {#if nextRung}<div class="rnext">{t('harvest.nextRung', { place: t('rung.' + nextRung.key), yen: formatYen(nextRung.yen) })}</div>{/if}
      </div>
      <div class="cta"><button type="button" class="btn yuzu" onclick={next}>{t('harvest.yay')}</button></div>
    {:else}
      <div class="promise-step card">
        <span class="tape" style:--tape="var(--c-moon)">{t('promise.next')}</span>
        <PromiseEditor bind:daysMask bind:kind bind:note night />
      </div>
      <div class="cta">
        <button type="button" class="btn yuzu" disabled={busy} onclick={drop}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-jar" /></svg>{t('harvest.drop')}
        </button>
      </div>
    {/if}
  </div>
</div>

<style>
  .overlay {
    position: fixed; inset: 0; z-index: 60; overflow: auto; color: var(--night-ink);
    --surface: var(--night-card); --edge: var(--night-edge); --stitch: #5A6F9C; --sh-lip: 0 4px 0 #18213A;
    --text: var(--night-ink); --text-soft: var(--night-ink-soft); --text-faint: var(--night-ink-soft); --bg: var(--night-sky); --lip: #18213A;
    background: radial-gradient(circle, rgba(255, 255, 255, .5) 1.2px, transparent 1.8px) 11px 23px / 61px 53px, radial-gradient(circle, rgba(246, 231, 176, .4) 1px, transparent 1.6px) 29px 7px / 43px 71px, linear-gradient(180deg, #16203A 0%, var(--night-sky) 45%, var(--night-sky-2) 100%);
    background-attachment: fixed;
    animation: fade var(--dur-base) var(--ease-soft);
  }
  @keyframes fade { from { opacity: 0; } to { opacity: 1; } }
  .col {
    position: relative; max-width: var(--col); margin: 0 auto; min-height: 100%; display: flex; flex-direction: column; gap: 14px;
    padding: calc(var(--safe-top) + 8px) calc(16px + var(--safe-right)) calc(var(--safe-bottom) + 18px) calc(16px + var(--safe-left));
  }
  .head { display: flex; justify-content: space-between; align-items: center; min-height: 48px; gap: 8px; }
  .pill { background: rgba(51, 69, 107, .9); border-color: var(--night-edge); color: var(--night-ink); box-shadow: 0 3px 0 #18213A; }
  .title svg { width: 18px; height: 18px; }
  .steps { display: flex; gap: 6px; }
  .steps i { width: 8px; height: 8px; border-radius: 50%; background: var(--night-edge); transition: all var(--dur-base) var(--ease-bounce); }
  .steps i.on { width: 22px; border-radius: 4px; background: var(--moon); }
  .later { cursor: pointer; min-height: 44px; }
  .confetti { position: fixed; inset: 0; pointer-events: none; overflow: hidden; }
  .confetti i { position: absolute; top: -20px; width: 12px; height: 8px; border-radius: 8px 0; animation: fall 4.5s linear infinite; }

  .tally { padding: 6px 18px; box-shadow: 0 4px 0 #18213A, 0 18px 40px rgba(0, 0, 0, .35); }
  .trow { display: flex; align-items: center; gap: 12px; min-height: 62px; border-bottom: 2px dashed var(--stitch); opacity: 0; animation: rowIn .5s var(--ease-soft) forwards; }
  .av { width: 46px; height: 46px; flex: none; border-radius: 50%; background: var(--night-sky-2); display: grid; place-items: center; overflow: hidden; }
  .av.team svg { width: 26px; height: 26px; color: var(--p-berry); }
  .sc { font-size: 1.9rem; min-width: 62px; }
  .team-l { font: 900 1.1rem var(--font-ui); }
  .yen { margin-left: auto; font-size: 1.45rem; color: var(--moon); }
  .ttotal { display: flex; justify-content: space-between; align-items: center; min-height: 70px; opacity: 0; animation: rowIn .6s var(--ease-bounce) 2.4s forwards; }
  .ttotal .lbl { display: flex; align-items: center; gap: 8px; font-weight: 700; color: var(--night-ink-soft); line-height: 1.3; }
  .ttotal .lbl svg { width: 28px; height: 28px; }
  .total { font-size: 2.5rem; color: var(--moon); text-shadow: 0 0 18px rgba(246, 231, 176, .45); }
  .prov { display: inline-flex; font: 700 var(--fs-micro) var(--font-ui); color: var(--night-ink-soft); background: rgba(255, 255, 255, .08); border-radius: var(--r-pill); padding: 2px 9px; }

  .minis { display: flex; gap: 10px; }
  .mini {
    flex: 1; display: flex; align-items: center; justify-content: center; gap: 12px; min-height: 60px; padding: 8px 14px; border-radius: var(--r-card);
    opacity: 0; animation: rowIn .6s var(--ease-soft) 3s forwards;
  }
  .purse-n { background: rgba(255, 155, 135, .14); border: 2px solid rgba(255, 155, 135, .6); }
  .purse-n svg { width: 34px; height: 34px; }
  .purse-n .big { font-size: 1.35rem; color: #FFC9BC; }
  .promises { background: rgba(51, 69, 107, .7); border: 2px solid var(--night-edge); gap: 16px; animation-delay: 3.4s; }
  .prom { display: flex; align-items: center; gap: 6px; }
  .mk { width: 30px; height: 30px; border-radius: 50%; display: grid; place-items: center; font-style: normal; font-weight: 700; font-size: 16px; background: rgba(232, 245, 154, .18); color: var(--firefly); }
  .mk.open { background: rgba(255, 255, 255, .08); color: var(--night-ink-soft); }
  .mk.paused { background: rgba(159, 168, 232, .2); }
  .mk svg { width: 18px; height: 18px; }

  .cta { margin-top: auto; padding-top: 8px; }

  .rung { text-align: center; display: grid; justify-items: center; gap: 4px; }
  .hero { position: relative; width: min(300px, 78vw); animation: if-pop var(--dur-pop) var(--ease-bounce) both; }
  .hero svg { width: 100%; height: auto; display: block; }
  .v1, .v2 { position: absolute; bottom: 14%; }
  .v1 { left: 18%; }
  .v2 { right: 18%; }
  .rname { font: 900 2.4rem/1.1 var(--font-ui); margin-top: 6px; }
  .ramt { color: var(--moon); text-shadow: 0 0 18px rgba(246, 231, 176, .45); }
  .rnext { font-weight: 700; color: var(--night-ink-soft); margin-top: 6px; }

  .promise-step { padding: 26px 14px 14px; }
</style>
