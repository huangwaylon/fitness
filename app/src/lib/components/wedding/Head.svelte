<script lang="ts">
  // けっこんしき's head (docs/wedding.md): our own photo as a band (static/wedding/hero.webp), darkened toward its foot
  // for the type: the two names (Zen Maru Gothic), the day, time and venue under them, the countdown at the right
  // (「あと336日」, 「今日」 on the day, 「12日前」 after it) and a member's ⚙ in the corner. Nothing else on it.
  import Icon from '../quiet/Icon.svelte';
  import { asset } from '$app/paths';
  import { formatDate } from '#lib/i18n/format.ts';
  import { formatNum, t } from '#lib/i18n/index.ts';
  import type { BoardConfig } from '#lib/wedding/config.ts';

  interface Props {
    config: BoardConfig;
    /** Days to the wedding (negative after it), null with no date. */
    days: number | null;
    /** A member's ⚙ (none for the guest). */
    onsettings?: (() => void) | null;
  }
  let { config, days, onsettings = null }: Props = $props();
  const label = $derived(days === null ? t('wed.noDate') : days > 0 ? t('wed.daysLabel', { n: formatNum(days) }) : days === 0 ? t('wed.dayOfLabel') : t('wed.pastLabel', { n: formatNum(-days) }));
  const names = $derived(config.p1 || config.p2 ? t('wed.names', { a: config.p1 || '…', b: config.p2 || '…' }) : '');
  const when = $derived([config.date ? `${formatDate(config.date)}${config.time ? ` ${config.time}` : ''}` : '', config.venue].filter(Boolean).join(' · '));
  const [pre, post] = $derived(t(days !== null && days < 0 ? 'wed.past' : 'wed.days', { n: '#' }).split('#'));
</script>

<section class="band" data-wed-top aria-label={t('wed.title')}>
  <img src={asset('wedding/hero.webp')} alt={t('wed.photo')} width="1200" height="563" decoding="async" />
  {#if onsettings}
    <button type="button" class="gear" aria-label={t('wed.settings')} data-wed-gear data-sfx="open" onclick={onsettings}><Icon name="gear" size={18} /></button>
  {/if}
  <div class="in">
    <div class="who">
      {#if names}<p class="names" data-wed-names>{names}</p>{/if}
      {#if when}<p class="when">{when}</p>{/if}
    </div>
    <p class="days" data-wed-days={days ?? ''} aria-label={label}>
      {#if days === null}
        <span class="w" aria-hidden="true">{t('wed.noDate')}</span>
      {:else if days === 0}
        <b class="n" aria-hidden="true">{t('wed.dayOf')}</b>
      {:else}
        <span class="w" aria-hidden="true">{pre}</span><b class="n" aria-hidden="true">{formatNum(Math.abs(days))}</b><span class="w" aria-hidden="true">{post}</span>
      {/if}
    </p>
  </div>
</section>

<style>
  .band { position: relative; flex: none; height: 132px; overflow: hidden; background: #6E5A58; color: #fff; }
  img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: 50% 30%; }
  :global(:root[data-tod='night']) img { filter: brightness(.82) saturate(.9); }
  .band::after { content: ''; position: absolute; inset: 0; background: linear-gradient(180deg, rgb(30 20 16 / 0) 30%, rgb(30 20 16 / .55) 100%); pointer-events: none; }
  .gear {
    appearance: none; border: 0; cursor: pointer; position: absolute; top: 10px; right: 12px; z-index: 2; width: 32px; height: 32px; padding: 0;
    border-radius: 50%; display: grid; place-items: center; background: var(--q-photo-btn); color: #fff;
    -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px); -webkit-tap-highlight-color: transparent;
  }
  .gear::after { content: ''; position: absolute; inset: -6px; }
  .gear:active { opacity: .7; }
  .gear:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
  .in { position: absolute; left: 16px; right: 16px; bottom: 12px; z-index: 1; display: flex; align-items: flex-end; gap: 12px; text-shadow: 0 1px 6px rgb(0 0 0 / .3); }
  .in p { margin: 0; }
  .who { flex: 1; min-width: 0; }
  .names { font: 700 var(--q-fs-title)/1.25 var(--q-font-title); letter-spacing: .02em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .when { font-size: var(--q-fs-s); opacity: .95; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .days { flex: none; line-height: 1; white-space: nowrap; }
  .w { font-size: var(--q-fs-s); }
  .n { margin: 0 2px; font: 700 var(--q-fs-big)/1 var(--q-font-title); }
</style>
