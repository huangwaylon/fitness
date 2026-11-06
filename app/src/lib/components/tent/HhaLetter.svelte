<!-- The Happy Home Academy's letter (tent/hha.ts): ハニワくん's rating of the tent, its points and its ハニワ (bronze,
     silver or gold), what counted, and one remark. Opened by the tent the first time someone goes in after a day's
     decorating, or by its ハニワ button. ✕ (top-right, as every dialog's) or the scrim closes it. -->
<script lang="ts">
  import { t } from '#lib/i18n/index.ts';
  import NavButton from '../ui/NavButton.svelte';
  import { BADGES, type HhaBadge, type HhaRating } from './hha.ts';

  let { rating, onclose }: { rating: HhaRating; onclose: () => void } = $props();

  const TINT: Record<Exclude<HhaBadge, null>, [string, string]> = {
    gold: ['#F2C53D', '#B8860B'], silver: ['#D9DEE3', '#8A939B'], bronze: ['#D08A52', '#8C5326']
  };
  const tint = $derived(rating.badge ? TINT[rating.badge] : ['#E6D3B3', '#B79B72']);
  const badgeName = (b: HhaBadge) => t(`tent.hha.badge.${b ?? 'none'}`);
  const up = $derived([...BADGES].reverse().find(([, at]) => rating.total < at)?.[0] ?? null);
  const note = $derived(
    rating.note.k === 'series' ? t('tent.hha.note.series', { v: t(`tent.series.${rating.note.v}`) })
    : rating.note.k === 'theme' ? t('tent.hha.note.theme', { v: t(`tent.theme.${rating.note.v}`) })
    : rating.note.k === 'colour' ? t('tent.hha.note.colour', { v: t(`tent.colour.${rating.note.v}`) })
    : t(`tent.hha.note.${rating.note.k}`)
  );
  const fmt = (n: number) => n.toLocaleString('ja-JP');
</script>

<div class="scrim" data-tent-letter={rating.total} data-badge={rating.badge ?? 'none'} role="presentation"
  onpointerdown={(e) => e.target === e.currentTarget && onclose()}>
  <div class="letter" role="dialog" aria-modal="true" aria-labelledby="hha-head">
    <span class="x"><NavButton kind="close" data-hha-close onclick={onclose} /></span>
    <p class="sender" id="hha-head">{t('tent.hha.sender')}</p>
    <p class="lead">{t('tent.hha.lead')}</p>
    <div class="badge" class:none={!rating.badge}>
      <!-- ハニワくん: NH's gyroid, as a little statue -->
      <svg viewBox="0 0 64 80" aria-hidden="true">
        <ellipse cx="32" cy="74" rx="20" ry="4" fill="rgba(0,0,0,.15)" />
        <path d="M14 70c0-12 2-20 4-28-6-2-10-7-10-11 4 0 8 3 11 6 1-10 6-27 13-27s12 17 13 27c3-3 7-6 11-6 0 4-4 9-10 11 2 8 4 16 4 28Z"
          fill={tint[0]} stroke={tint[1]} stroke-width="2" stroke-linejoin="round" stroke-dasharray={rating.badge ? undefined : '4 3'} />
        <ellipse cx="25" cy="24" rx="3.2" ry="4.2" fill={tint[1]} /><ellipse cx="39" cy="24" rx="3.2" ry="4.2" fill={tint[1]} />
        <ellipse cx="32" cy="37" rx="4" ry="5" fill={tint[1]} />
        {#if rating.badge}<path d="M20 14c2-4 5-6 8-7" stroke="#fff" stroke-width="2.4" stroke-linecap="round" fill="none" opacity=".7" />{/if}
      </svg>
      <span class="name">{badgeName(rating.badge)}</span>
    </div>
    <p class="total" data-hha-total><b>{fmt(rating.total)}</b> {t('tent.hha.unit')}</p>
    <ul class="parts">
      {#each rating.parts.filter((p) => p.pts > 0) as p (p.k)}
        <li data-hha-part={p.k}><span>{t(`tent.hha.part.${p.k}`)}</span><span class="pts">+{fmt(p.pts)}</span></li>
      {/each}
    </ul>
    <p class="note" data-hha-note={rating.note.k}>{note}</p>
    <p class="next">{rating.next !== null && up ? t('tent.hha.next', { n: fmt(rating.next), badge: badgeName(up) }) : t('tent.hha.top')}</p>
  </div>
</div>

<style>
  .scrim {
    position: absolute; inset: 0; z-index: 5; display: grid; place-items: center; padding: 16px; background: rgba(30, 20, 12, .45);
    animation: fade .2s ease-out both;
  }
  .letter {
    width: min(340px, 100%); max-height: calc(100% - 32px); overflow: auto; border-radius: 22px; padding: 18px 20px 16px;
    background: var(--c-paper); color: var(--c-ink); box-shadow: 0 4px 0 var(--c-lip), 0 12px 30px rgba(0, 0, 0, .35);
    position: relative; text-align: center; animation: rise .32s var(--ease-bounce, ease-out) both;
    /* NH's letter paper: faint ruled lines */
    background-image: repeating-linear-gradient(transparent 0 27px, rgba(147, 112, 71, .12) 27px 28px);
  }
  .sender { margin: 0; font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--c-ink-soft); letter-spacing: .04em; }
  .lead { margin: 6px 0 4px; font: 700 var(--fs-body)/1.5 var(--font-ui); }
  .badge { display: grid; justify-items: center; gap: 2px; margin: 4px 0 2px; }
  .badge svg { width: 84px; height: 105px; animation: hop .5s .25s var(--ease-bounce, ease-out) both; }
  .badge.none svg { opacity: .75; animation: none; }
  .name { font: 700 var(--fs-talk)/1.3 var(--font-ui); }
  .total { margin: 2px 0 8px; font: 700 var(--fs-body)/1 var(--font-ui); }
  .total b { font: 700 2rem/1 var(--font-num); font-variant-numeric: tabular-nums; margin-right: 2px; }
  .parts { list-style: none; margin: 0 auto 8px; padding: 0; max-width: 240px; display: grid; gap: 2px; font: 500 var(--fs-s)/1.6 var(--font-ui); }
  .parts li { display: flex; justify-content: space-between; gap: 12px; }
  .pts { font-family: var(--font-num); font-variant-numeric: tabular-nums; color: var(--c-ink-soft); }
  .note { margin: 4px 0 2px; font: 700 var(--fs-body)/1.5 var(--font-ui); }
  .next { margin: 0 0 4px; font: 500 var(--fs-s)/1.4 var(--font-ui); color: var(--c-ink-soft); }
  .x { position: absolute; top: 4px; right: 4px; display: flex; }
  @keyframes fade { from { opacity: 0; } }
  @keyframes rise { from { transform: translateY(24px) scale(.96); opacity: 0; } }
  @keyframes hop { 40% { transform: translateY(-8px); } }
  @media (prefers-reduced-motion: reduce) { .scrim, .letter, .badge svg { animation: none; } }
</style>
