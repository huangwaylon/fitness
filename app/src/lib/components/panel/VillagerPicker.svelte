<script lang="ts">
  // しまフォン → 村人: my villager (roster radios) and its name. The name field is seeded once, when the app opens:
  // the store recomputes `view` on every tick, sync and tap, and must never overwrite what is being typed.
  // Layout: a pinned head (my villager's render, its name, the name and search fields) over the icon grid, which
  // scrolls on its own (the panel's body holds still on this level: IslandPanel `.fill`), so the search stays in reach
  // anywhere in the 440 and the on-screen keyboard has nothing to scroll. The grid is built a slice per frame; each
  // head is a bare <img> on a chip (an <Avatar> is a rig of 5 nodes and a dozen deriveds, x440) whose src is set as it
  // nears the grid's view (one IntersectionObserver). The chosen villager stays in the tab order even when filtered out.
  // Two groups in one radiogroup: とくべつ (たぬきち, しずえ…) first, then the villagers by species; a heading only shows
  // over a group the search left non-empty.
  import { untrack } from 'svelte';
  import type { Attachment } from 'svelte/attachments';
  import type { WeekView } from '#lib/types.ts';
  import Avatar from '../characters/Avatar.svelte';
  import Villager from '../characters/Villager.svelte';
  import { roving } from '../ui/roving.ts';
  import { setVillagerName, setVillager } from '#lib/store/actions.ts';
  import { artUrl, villagerArt } from '#lib/art.ts';
  import { resolveLook } from '#lib/villagers/look.ts';
  import { ROSTER, type RosterId } from '#lib/villagers/roster.ts';
  import { searchVillagers } from '#lib/villagers/search.ts';
  import { PERSONALITIES, SPECIAL, SPECIES } from '#lib/villagers/species.ts';
  import { t, i18n } from '#lib/i18n/index.ts';

  let { view }: { view: WeekView } = $props();

  const me = $derived(view.people[view.me]);
  /** My current roster villager (prefs `villager`, else the per-person default). */
  const current = $derived(resolveLook({ villager: me.villager, person: view.me }).id);
  const lang = $derived(i18n.locale === 'ja' ? 0 : 1);
  const vName = (id: RosterId) => (lang === 0 ? ROSTER[id].nameJa : ROSTER[id].nameEn);
  const vKind = (id: RosterId) => {
    const { species, personality } = ROSTER[id];
    return species && personality ? `${SPECIES[species][lang]} · ${PERSONALITIES[personality][lang]}` : SPECIAL[lang];
  };
  let name = $state(untrack(() => me.villagerName));
  let query = $state('');
  const shown = $derived(searchVillagers(query));
  // The grid is built a slice per frame (440 heads at once is a long task on a phone, when the page opens and when
  // the search is cleared): the first screenful at once, then STEP more each frame. A new result list starts over.
  const FIRST = 40;
  const STEP = 80;
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
  /** The radio in the tab order: the chosen one if it is shown (and built), else the first shown. */
  const tabStop = $derived(built.includes(current) ? current : built[0]);

  /** Heads whose icon failed to load: those fall back to <Avatar> (its silhouette). */
  const failed = $state<Record<string, true>>({});
  // A head's src is set when it comes within half a view of the grid's (native loading="lazy" fetches ~3 screens
  // ahead in Chrome: a third of the roster on open; Safari's margin is its own).
  let io: IntersectionObserver | undefined;
  const pending = new Set<HTMLImageElement>();
  const grid: Attachment<HTMLElement> = (node) => {
    io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const img = e.target as HTMLImageElement;
        img.src = img.dataset.src!;
        io?.unobserve(img);
      }
    }, { root: node, rootMargin: '50% 0px' });
    for (const img of pending) io.observe(img);
    pending.clear();
    return () => {
      io?.disconnect();
      io = undefined;
    };
  };
  const lazy: Attachment<HTMLImageElement> = (img) => {
    if (io) io.observe(img);
    else pending.add(img);
    return () => {
      io?.unobserve(img);
      pending.delete(img);
    };
  };

  function saveName() {
    if (name.trim() && name.trim() !== me.villagerName) setVillagerName(name);
  }
  // Closing the phone (✕, Esc) while the field is focused may not blur it first: save on the way out too.
  $effect(() => () => untrack(saveName));
</script>

<div class="picker">
  <div class="head">
    <div class="preview">
      {#key current}
        <span class="pv"><Villager person={view.me} villager={current} size={76} head={false} expression="cheer" eager /></span>
      {/key}
      <div class="side">
        <p class="who"><span class="vn">{vName(current)}</span> <span class="vk">{vKind(current)}</span></p>
        <label class="namefield">
          <span>{t('panel.nickname')}</span>
          <input class="name" type="text" maxlength="12" data-sfx="none" bind:value={name} onblur={saveName}
            onkeydown={(e) => e.key === 'Enter' && (e.currentTarget as HTMLInputElement).blur()} enterkeyhint="done" />
        </label>
      </div>
    </div>
    <label class="search">
      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="2.6" /><path d="M15.5 15.5 20 20" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" /></svg>
      <span class="sr-only">{t('panel.villager.search')}</span>
      <input type="search" data-sfx="none" bind:value={query} placeholder={t('panel.villager.search')} enterkeyhint="search" autocomplete="off" spellcheck="false"
        onkeydown={(e) => e.key === 'Enter' && (e.currentTarget as HTMLInputElement).blur()} />
    </label>
  </div>
  <div class="scroll" {@attach grid}>
    {#if shown.length}
      <div role="radiogroup" aria-label={t('panel.villager')} style:--tag={view.me === 'A' ? 'var(--c-yuzu)' : 'var(--c-mint)'} {@attach roving}>
        {#each groups as g (g.label)}
          <h3 class="grp">{g.label}</h3>
          <div class="roster">
            {#each g.ids as id (id)}
              {@const src = failed[id] ? null : artUrl(villagerArt(id, true))}
              <button type="button" class="rv" role="radio" aria-checked={current === id} tabindex={tabStop === id ? 0 : -1} aria-label={vName(id)}
                title={vName(id)} data-sfx={current === id ? 'none' : 'tick'} onclick={() => current !== id && setVillager(id)}>
                {#if src}
                  <span class="chip"><img data-src={src} alt="" width="128" height="128" decoding="async" draggable="false" {@attach lazy}
                    onerror={() => (failed[id] = true)} /></span>
                {:else}
                  <Avatar person={view.me} villager={id} size={64} />
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
</div>

<style>
  /* Fills the pushed page: the head holds still, the grid scrolls under it (to the screen's bottom edge: its bottom
     padding is the panel body's, home indicator and keyboard included). */
  .picker { flex: 1; min-height: 0; display: flex; flex-direction: column; }
  .head { flex: none; position: relative; z-index: 1; }
  /* heads scrolling up fade out under the search instead of being cut at a hard edge */
  .head::after {
    content: ''; position: absolute; left: -8px; right: -8px; top: 100%; height: 12px; pointer-events: none;
    background: linear-gradient(var(--surface), transparent);
  }
  .preview { display: flex; align-items: flex-end; gap: 12px; }
  .pv { width: 64px; display: grid; justify-items: center; flex: none; animation: if-pop var(--dur-pop) var(--ease-bounce) both; }
  .side { flex: 1; min-width: 0; display: grid; gap: 6px; }
  .who { margin: 0; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: var(--fs-s); font-weight: 700; }
  .vn { color: var(--text); }
  .vk { margin-left: 4px; color: var(--text-soft); }
  .namefield { display: grid; gap: 4px; }
  .namefield span { font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  .name {
    width: 100%; min-height: 48px; border-radius: var(--r-btn); border: 0;
    background: var(--c-card); color: var(--c-ink); padding: 0 14px; font-weight: 700; box-shadow: inset 0 0 0 2px var(--c-edge), inset 0 4px 0 var(--c-lip);
  }
  .search {
    display: flex; align-items: center; gap: 8px; margin: 10px 0 4px; min-height: 48px; padding: 0 14px;
    border-radius: 999px; background: var(--c-card); color: var(--c-ink); box-shadow: inset 0 0 0 2px var(--c-edge), inset 0 4px 0 var(--c-lip);
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
  .search:focus-within { box-shadow: inset 0 0 0 2px var(--c-edge), inset 0 4px 0 var(--c-lip), 0 0 0 3px var(--focus); }
  /* The grid's own scroller. It bleeds 8px past the side padding (into the panel body's) so rings are not clipped. */
  .scroll {
    flex: 1; min-height: 0; overflow: hidden auto; overscroll-behavior: contain;
    margin: 0 -8px; padding: 8px 8px var(--body-pad);
  }
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
  /* the head on the person's chip (as <Avatar>: yuzu A, mint B), the icon at 86% */
  .chip {
    display: grid; place-items: center; width: 100%; height: 100%; overflow: hidden; border-radius: 50%;
    background: color-mix(in srgb, var(--tag) 55%, var(--c-cream));
  }
  .chip img { display: block; width: 86%; height: 86%; user-select: none; -webkit-user-drag: none; pointer-events: none; }
  .rv:active { transform: scale(1.06, .92); transition-duration: var(--dur-tap); }
  .rv[aria-checked='true'] { box-shadow: 0 0 0 4px var(--c-leaf-edge); }
  .ck {
    position: absolute; right: -4px; bottom: -4px; width: 20px; height: 20px; padding: 3px; border-radius: 50%;
    background: var(--c-leaf); color: var(--c-ink);
  }
</style>
