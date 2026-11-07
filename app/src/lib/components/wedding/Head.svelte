<script lang="ts">
  // けっこんしき's banner (docs/wedding.md): our own photo (static/wedding/hero.webp) darkened toward its foot and left
  // for the type: the big countdown (「あと 336 日」, 「今日」 on the day, 「12 日前」 after it), the two names on a yuzu
  // plate, the day, time and venue; at the right the rose ring on a paper disc (the board's percent round a posy), the
  // percent and done / total under it. (設定 is the sheet's third tab.)
  import OfficialArt from '../characters/OfficialArt.svelte';
  import { asset } from '$app/paths';
  import { formatDate } from '#lib/i18n/format.ts';
  import { formatNum, t } from '#lib/i18n/index.ts';
  import { toPercent, type Overall } from '#lib/wedding/progress.ts';
  import type { BoardConfig } from '#lib/wedding/config.ts';

  interface Props {
    config: BoardConfig;
    /** Days to the wedding (negative after it), null with no date. */
    days: number | null;
    /** The board's percent and its done / total (the store's overall). */
    sum: Overall;
  }
  let { config, days, sum }: Props = $props();
  const label = $derived(days === null ? t('wed.noDate') : days > 0 ? t('wed.daysLabel', { n: formatNum(days) }) : days === 0 ? t('wed.dayOfLabel') : t('wed.pastLabel', { n: formatNum(-days) }));
  const names = $derived(config.p1 || config.p2 ? t('wed.names', { a: config.p1 || '…', b: config.p2 || '…' }) : '');
  const when = $derived([config.date ? `${formatDate(config.date)}${config.time ? ` ${config.time}` : ''}` : '', config.venue].filter(Boolean).join(' · '));
  const [pre, post] = $derived(t(days !== null && days < 0 ? 'wed.past' : 'wed.days', { n: '#' }).split('#'));
  const pct = $derived(toPercent(sum.percent));
  /** The ring's arc (r 40: 251 around). */
  const C = 2 * Math.PI * 40;
</script>

<section class="band" data-wed-top aria-label={t('wed.title')}>
  <img src={asset('wedding/hero.webp')} alt={t('wed.photo')} width="1200" height="563" decoding="async" />
  <div class="in">
    <div class="who">
      <p class="days" data-wed-days={days ?? ''} aria-label={label}>
        {#if days === null}
          <span class="w" aria-hidden="true">{t('wed.noDate')}</span>
        {:else if days === 0}
          <b class="n day" aria-hidden="true">{t('wed.dayOf')}</b>
        {:else}
          <span class="w" aria-hidden="true">{pre}</span><b class="n" aria-hidden="true">{formatNum(Math.abs(days))}</b><span class="w" aria-hidden="true">{post}</span>
        {/if}
      </p>
      {#if names}<p class="plate names" data-wed-names>{names}</p>{/if}
      {#if when}<p class="when">{when}</p>{/if}
    </div>
    {#if sum.total}
      <div class="prep" role="img" aria-label={t('wed.prepLabel', { pct, done: sum.done, total: sum.total })} data-wed-progress={pct}>
        <span class="ring" aria-hidden="true">
          <svg viewBox="0 0 96 96">
            <circle class="track" cx="48" cy="48" r="40" />
            {#if pct > 0}<circle class="fill" cx="48" cy="48" r="40" stroke-dasharray="{(C * pct) / 100} {C}" transform="rotate(-90 48 48)" />{/if}
          </svg>
          <span class="posy"><OfficialArt key="flowers/pink-roses" size={34} eager /></span>
          <b class="pct">{pct}<small>%</small></b>
        </span>
        <span class="tally" aria-hidden="true" data-wed-tally="{sum.done}/{sum.total}">{sum.done} / {sum.total}</span>
      </div>
    {/if}
  </div>
</section>

<style>
  .band { position: relative; flex: none; height: 184px; overflow: hidden; background: var(--c-ink-soft); color: #fff; }
  img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: 50% 35%; }
  :global(:root[data-tod='night']) img { filter: brightness(.8) saturate(.9); }
  /* darker toward the foot and the left, under the type */
  .band::after {
    content: ''; position: absolute; inset: 0; pointer-events: none;
    background: linear-gradient(180deg, rgb(30 20 16 / 0) 25%, rgb(30 20 16 / .6) 100%), linear-gradient(90deg, rgb(30 20 16 / .45), rgb(30 20 16 / 0) 50%);
  }
  .in { position: absolute; left: 16px; right: 14px; bottom: 12px; z-index: 1; display: flex; align-items: flex-end; gap: 12px; }
  .in p { margin: 0; }
  .who { flex: 1; min-width: 0; display: grid; justify-items: start; gap: 7px; text-shadow: 0 1px 8px rgb(0 0 0 / .35); }
  .days { display: flex; align-items: baseline; gap: 4px; line-height: 1; white-space: nowrap; }
  .w { font: 700 var(--fs-talk)/1 var(--font-ui); }
  .n { font: 600 46px/.9 var(--font-num); font-variant-numeric: tabular-nums; letter-spacing: .01em; }
  .n.day { font: 700 var(--fs-title)/1 var(--font-ui); }
  .names { max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-left: 2px; text-shadow: none; }
  .when { max-width: 100%; font: 700 var(--fs-s)/1.3 var(--font-ui); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  /* the rose ring on a paper disc (the time of day's --bg), the percent under the posy, done / total under it */
  .prep { flex: none; display: grid; justify-items: center; gap: 5px; }
  .ring {
    position: relative; width: 104px; height: 104px; border-radius: 50%; display: grid; place-items: center; align-content: center;
    background: color-mix(in srgb, var(--bg) 94%, transparent); color: var(--text); box-shadow: 0 4px 14px rgb(20 12 8 / .28);
  }
  .ring svg { position: absolute; inset: 4px; width: calc(100% - 8px); height: calc(100% - 8px); }
  .track { fill: none; stroke: color-mix(in srgb, var(--c-rose) 24%, var(--bg)); stroke-width: 7; }
  .fill { fill: none; stroke: var(--c-rose); stroke-width: 7; stroke-linecap: round; transition: stroke-dasharray 600ms cubic-bezier(.25, .8, .25, 1); }
  .posy { position: relative; line-height: 0; margin-top: -4px; }
  .pct { position: relative; font: 600 20px/1 var(--font-num); font-variant-numeric: tabular-nums; }
  .pct small { font-size: .6em; margin-left: 1px; }
  .tally {
    font: 600 var(--fs-s)/1 var(--font-num); font-variant-numeric: tabular-nums; white-space: nowrap; padding: 3px 9px; border-radius: 999px;
    background: color-mix(in srgb, var(--bg) 94%, transparent); color: var(--text-soft);
  }
</style>
