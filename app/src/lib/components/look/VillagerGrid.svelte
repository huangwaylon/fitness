<script lang="ts">
  // すがた's むらびと tab (docs/players.md "Villagers"): the search field (held at the top of the panel as it
  // scrolls), then the roster's heads in two groups of one radiogroup: とくべつ (たぬきち, しずえ…) first, then the
  // villagers by species; a heading only shows over a group the search left non-empty. A tap wears that villager on the
  // stage (the level's draft: nothing is sent until the level is left). The grid is built a slice per frame; each head
  // is a bare <img> on a chip (an <Avatar> is a rig of 5 nodes and a dozen deriveds, x440) whose src is set as it nears
  // the view of `root`, the panel that scrolls (one IntersectionObserver). The worn villager stays in the tab order even
  // when filtered out.
  import type { Attachment } from 'svelte/attachments';
  import type { Who } from '#lib/types.ts';
  import Avatar from '../characters/Avatar.svelte';
  import { roving } from '../ui/roving.ts';
  import { artUrl, villagerArt } from '#lib/art.ts';
  import { ROSTER, type RosterId } from '#lib/villagers/roster.ts';
  import { searchVillagers } from '#lib/villagers/search.ts';
  import { SPECIAL } from '#lib/villagers/species.ts';
  import { t, i18n } from '#lib/i18n/index.ts';
  import { tagOf } from '#lib/ui-state/viewer.ts';

  interface Props {
    who: Who;
    /** The villager worn on the stage (null: a player look). */
    current: RosterId | null;
    onpick: (id: RosterId) => void;
    /** The scroller the heads load against. */
    root: HTMLElement | null;
  }
  let { who, current, onpick, root }: Props = $props();

  const lang = $derived(i18n.locale === 'ja' ? 0 : 1);
  const vName = (id: RosterId) => (lang === 0 ? ROSTER[id].nameJa : ROSTER[id].nameEn);
  let query = $state('');
  const shown = $derived(searchVillagers(query));
  // The first screenful at once, then STEP more each frame (440 heads at once is a long task on a phone, when the tab
  // first opens and when the search is cleared). A new result list starts over.
  const FIRST = 40;
  const STEP = 40;
  let limit = $derived.by(() => {
    void shown;
    return FIRST;
  });
  $effect(() => {
    if (limit >= shown.length) return;
    const raf = requestAnimationFrame(() => (limit += STEP));
    return () => cancelAnimationFrame(raf);
  });
  const built = $derived(shown.slice(0, limit));
  const groups = $derived([
    { label: SPECIAL[lang], ids: built.filter((id) => ROSTER[id].special) },
    { label: t('panel.villager.villagers'), ids: built.filter((id) => !ROSTER[id].special) }
  ].filter((g) => g.ids.length));
  /** The radio in the tab order: the worn one if it's shown (and built), else the first shown. */
  const tabStop = $derived(current && built.includes(current) ? current : built[0]);

  /** Heads whose icon failed to load: those fall back to <Avatar> (its silhouette). */
  const failed = $state<Record<string, true>>({});
  // A head's src is set when it comes within half a view of the scroller's (native loading="lazy" fetches ~3 screens
  // ahead in Chrome: a third of the roster on open; Safari's margin is its own).
  let io: IntersectionObserver | null = null;
  const pending = new Set<HTMLImageElement>();
  $effect(() => {
    if (!root) return;
    const obs = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const img = e.target as HTMLImageElement;
        img.src = img.dataset.src!;
        obs.unobserve(img);
      }
    }, { root, rootMargin: '50% 0px' });
    for (const img of pending) obs.observe(img);
    pending.clear();
    io = obs;
    return () => {
      obs.disconnect();
      io = null;
    };
  });
  const lazy: Attachment<HTMLImageElement> = (img) => {
    if (io) io.observe(img);
    else pending.add(img);
    return () => {
      io?.unobserve(img);
      pending.delete(img);
    };
  };
</script>

<div class="vg">
  <label class="search">
    <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="2.6" /><path d="M15.5 15.5 20 20" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" /></svg>
    <span class="sr-only">{t('panel.villager.search')}</span>
    <input type="search" data-sfx="none" bind:value={query} placeholder={t('panel.villager.search')} enterkeyhint="search" autocomplete="off" spellcheck="false"
      onkeydown={(e) => e.key === 'Enter' && (e.currentTarget as HTMLInputElement).blur()} />
  </label>
  {#if shown.length}
    <div role="radiogroup" aria-label={t('panel.villager')} style:--tag={tagOf(who)} data-villagers {@attach roving}>
      {#each groups as g (g.label)}
        <h3 class="grp">{g.label}</h3>
        <div class="roster">
          {#each g.ids as id (id)}
            {@const src = failed[id] ? null : artUrl(villagerArt(id, true))}
            <button type="button" class="rv" role="radio" aria-checked={current === id} tabindex={tabStop === id ? 0 : -1} aria-label={vName(id)}
              title={vName(id)} data-villager={id} data-sfx={current === id ? 'none' : 'tick'} onclick={() => current !== id && onpick(id)}>
              {#if src}
                <span class="disc"><img data-src={src} alt="" width="128" height="128" decoding="async" draggable="false" {@attach lazy}
                  onerror={() => (failed[id] = true)} /></span>
              {:else}
                <Avatar person={who} villager={id} size={64} />
              {/if}
              {#if current === id}<svg class="ck" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-check" /></svg>{/if}
            </button>
          {/each}
        </div>
      {/each}
    </div>
  {:else}
    <p class="none" role="status">{t('panel.villager.none')}</p>
  {/if}
</div>

<style>
  .vg { display: grid; grid-template-columns: minmax(0, 1fr); gap: 4px; }
  /* held at the top of the panel as the heads scroll under it (an opaque band, so they don't show through) */
  .search {
    position: sticky; top: 0; z-index: 1; display: flex; align-items: center; gap: 8px; min-height: 48px; padding: 0 14px; margin: 0 0 4px;
    border-radius: 999px; background: var(--c-card); color: var(--c-ink); box-shadow: inset 0 0 0 2px var(--c-edge), inset 0 4px 0 var(--c-lip), 0 -6px 0 4px var(--surface);
  }
  .search svg { width: 20px; height: 20px; flex: none; opacity: .55; }
  .search input { flex: 1; min-width: 0; min-height: 44px; border: 0; background: none; color: inherit; font: 700 var(--fs-input) var(--font-ui); outline: none; }
  /* the clear ✕ in ink, not the browser's blue */
  .search input::-webkit-search-cancel-button {
    -webkit-appearance: none; appearance: none; width: 18px; height: 18px; cursor: pointer; background: var(--c-ink-soft);
    -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M6 6l12 12M18 6 6 18' stroke='%23000' stroke-width='3.2' stroke-linecap='round'/%3E%3C/svg%3E") center / contain no-repeat;
    mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M6 6l12 12M18 6 6 18' stroke='%23000' stroke-width='3.2' stroke-linecap='round'/%3E%3C/svg%3E") center / contain no-repeat;
  }
  .search input::placeholder { color: color-mix(in srgb, var(--c-ink) 45%, transparent); }
  .search:focus-within { box-shadow: inset 0 0 0 2px var(--c-edge), inset 0 4px 0 var(--c-lip), 0 0 0 3px var(--focus), 0 -6px 0 4px var(--surface); }
  .none { margin: 24px 0; text-align: center; font-weight: 700; color: var(--text-soft); }
  .grp { margin: 6px 4px 8px; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  .grp:not(:first-child) { margin-top: 14px; }
  /* the heads are sized so the column gaps match the 12px row gap (five 64px heads overlap at 375):
     five 56px heads up to 419px wide, five 64px from 420, four 56px under 360 */
  .roster { --s: 56px; display: grid; grid-template-columns: repeat(5, var(--s)); justify-content: space-between; row-gap: 12px; padding: 4px 4px 8px; }
  .rv :global(.av) { --s: inherit !important; }
  @media (min-width: 420px) {
    .roster { --s: 64px; }
  }
  @media (max-width: 359px) {
    .roster { grid-template-columns: repeat(4, var(--s)); }
  }
  .rv {
    appearance: none; cursor: pointer; border: 0; padding: 0; background: none; border-radius: 50%; position: relative;
    width: var(--s); height: var(--s);
    box-shadow: 0 0 0 3px transparent; transition: transform var(--dur-base) var(--ease-bounce), box-shadow var(--dur-quick);
  }
  /* the head on the person's chip (as <Avatar>: yuzu A, mint B), the icon at 86%. Not called .chip: that is theme.css's
     shared choice chip */
  .disc {
    display: grid; place-items: center; width: 100%; height: 100%; overflow: hidden; border-radius: 50%;
    background: color-mix(in srgb, var(--tag) 55%, var(--c-cream));
  }
  .disc img { display: block; width: 86%; height: 86%; user-select: none; -webkit-user-drag: none; pointer-events: none; }
  .rv:active { transform: scale(1.06, .92); transition-duration: var(--dur-tap); }
  .rv[aria-checked='true'] { box-shadow: 0 0 0 4px var(--c-leaf-edge); }
  .ck {
    position: absolute; right: -4px; bottom: -4px; width: 20px; height: 20px; padding: 3px; border-radius: 50%;
    background: var(--c-leaf); color: var(--c-ink);
  }
</style>
