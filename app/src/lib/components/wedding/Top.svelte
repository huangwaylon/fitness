<script lang="ts">
  // けっこんしき's head (docs/wedding.md), one compact card: NH's wedding arch, the countdown (「あと 225にち」, 「きょう！」
  // on the day, 「12にち まえ」 after it) over the two names on a yuzu plate, the day and the venue; at the right the
  // bouquet: a ring of petals filling with the board's percent around a posy, the percent and the done / total of the
  // top-level tasks under it. Static (nothing here is tappable).
  import OfficialArt from '../characters/OfficialArt.svelte';
  import { formatDate } from '#lib/i18n/format.ts';
  import { formatNum, t } from '#lib/i18n/index.ts';
  import { toPercent, type Overall } from '#lib/wedding/progress.ts';
  import type { BoardConfig } from '#lib/wedding/config.ts';

  interface Props {
    config: BoardConfig;
    /** Days to the wedding (negative after it), null with no date. */
    days: number | null;
    /** The board's percent (0–1) and its done / total (the store's overall). */
    sum: Overall;
  }
  let { config, days, sum }: Props = $props();
  const pct = $derived(toPercent(sum.percent));
  /** The ring's arc (r 25: 157 around). */
  const C = 2 * Math.PI * 25;
  const label = $derived(days === null ? t('wed.noDate') : days > 0 ? t('wed.daysLabel', { n: formatNum(days) }) : days === 0 ? t('wed.dayOfLabel') : t('wed.pastLabel', { n: formatNum(-days) }));
  const names = $derived(config.p1 || config.p2 ? t('wed.names', { a: config.p1 || '…', b: config.p2 || '…' }) : '');
</script>

<section class="top" data-wed-top aria-label={t('wed.title')}>
  <span class="arch" aria-hidden="true"><OfficialArt key="deco/wedding-arch" size={80} eager /></span>
  <div class="count">
    <p class="days" data-wed-days={days ?? ''} aria-label={label}>
      {#if days === null}
        <span class="none">{t('wed.noDate')}</span>
      {:else if days > 0}
        {@const [pre, post] = t('wed.days', { n: '#' }).split('#')}
        <span class="w" aria-hidden="true">{pre}</span><b class="n" aria-hidden="true">{formatNum(days)}</b><span class="w" aria-hidden="true">{post}</span>
      {:else if days === 0}
        <b class="n day" aria-hidden="true">{t('wed.dayOf')}</b>
      {:else}
        {@const [pre, post] = t('wed.past', { n: '#' }).split('#')}
        <span class="w" aria-hidden="true">{pre}</span><b class="n past" aria-hidden="true">{formatNum(-days)}</b><span class="w" aria-hidden="true">{post}</span>
      {/if}
    </p>
    {#if names}<p class="plate names" data-wed-names>{names}</p>{/if}
    {#if config.date || config.venue}
      <p class="where">{#if config.date}<span>{formatDate(config.date)}{#if config.time}&nbsp;{config.time}{/if}</span>{/if}{#if config.venue}<span class="venue">{config.venue}</span>{/if}</p>
    {/if}
  </div>
  {#if sum.total}<div class="prep" role="img" aria-label={t('wed.prepLabel', { pct, done: sum.done, total: sum.total })} data-wed-progress={pct}>
    <span class="ring" aria-hidden="true">
      <svg viewBox="0 0 60 60">
        <circle class="track" cx="30" cy="30" r="25" />
        {#if pct > 0}<circle class="fill" cx="30" cy="30" r="25" stroke-dasharray="{(C * pct) / 100} {C}" transform="rotate(-90 30 30)" />{/if}
      </svg>
      <span class="posy"><OfficialArt key="flowers/pink-roses" size={28} eager /></span>
    </span>
    <b class="pct" aria-hidden="true">{pct}<small>%</small></b>
    <span class="tally" aria-hidden="true" data-wed-tally>{sum.done} / {sum.total}</span>
  </div>{/if}
</section>

<style>
  /* one card: a blush sky behind the arch (the board's own colour, cream at every time of day: a game object) */
  .top {
    --wed-pink: #F28DB0; --wed-blush: #FFE3EC;
    display: flex; align-items: center; gap: 10px; padding: 10px 12px 10px 8px; border-radius: var(--r-card);
    background: linear-gradient(170deg, var(--wed-blush), var(--c-cream) 62%); color: var(--c-ink);
    box-shadow: 0 var(--lip-h) 0 var(--c-lip);
  }
  .arch { flex: none; width: 76px; height: 80px; display: grid; place-items: end center; line-height: 0; filter: drop-shadow(0 3px 0 rgb(140 90 60 / .16)); }
  .count { flex: 1; min-width: 0; display: grid; justify-items: start; gap: 5px; }
  .count p { margin: 0; }
  .days { display: flex; align-items: baseline; flex-wrap: wrap; gap: 2px 4px; line-height: 1; }
  .w { font: 700 var(--fs-body)/1 var(--font-ui); color: var(--c-ink-soft); }
  .n { font: 700 var(--fs-hero)/1 var(--font-num); font-variant-numeric: tabular-nums; color: var(--c-ink); letter-spacing: .01em; }
  .n.day { font-family: var(--font-ui); font-size: var(--fs-title); color: #C2386A; }
  .n.past { font-size: var(--fs-title); }
  .none { font: 700 var(--fs-talk)/1.2 var(--font-ui); color: var(--c-ink-soft); }
  .count .names { max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-left: 2px; }
  .where { display: flex; flex-wrap: wrap; gap: 0 10px; max-width: 100%; font: 700 var(--fs-s)/1.35 var(--font-ui); color: var(--c-ink-soft); }
  .where span { white-space: nowrap; }
  /* a long venue (200 characters) on two lines at most */
  .where .venue { white-space: normal; overflow: hidden; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; line-clamp: 2; }

  /* the bouquet: a 60px ring (blush track, pink fill) round the posy, the percent and the tally under it */
  .prep { flex: none; display: grid; justify-items: center; gap: 2px; }
  .ring { position: relative; width: 60px; height: 60px; display: grid; place-items: center; }
  .ring svg { position: absolute; inset: 0; width: 100%; height: 100%; }
  .track { fill: none; stroke: color-mix(in srgb, var(--wed-pink) 22%, var(--c-card)); stroke-width: 7; }
  .fill { fill: none; stroke: var(--wed-pink); stroke-width: 7; stroke-linecap: round; transition: stroke-dasharray 600ms var(--ease-soft); }
  .posy { position: relative; line-height: 0; }
  .pct { font: 700 var(--fs-talk)/1 var(--font-num); font-variant-numeric: tabular-nums; }
  .pct small { font-size: .65em; margin-left: 1px; }
  .tally { font: 700 var(--fs-s)/1 var(--font-num); font-variant-numeric: tabular-nums; white-space: nowrap; color: var(--c-ink-soft); }
</style>
