<script lang="ts">
  // A ずかん page (docs/design.md "Zukan"): every entry of one kind in the game's order, the official icon (lazy) and the
  // name for the ones either of us has found, a silhouette and ？？？ for the rest; the fossils' dinosaurs each as a set
  // under its name with its pieces found (「Tレックス 2/3」). The page's head (its count, then the picked entry) is pinned
  // while the grid scrolls under it; a tap on a found one shows it there, the grid staying where it was scrolled:
  // the icon, the name, when and who found it first, and (fish, bugs, sea creatures) NH's catch line.
  import OfficialArt from '../characters/OfficialArt.svelte';
  import Avatar from '../characters/Avatar.svelte';
  import type { PersonId } from '#lib/types.ts';
  import { i18n, t } from '#lib/i18n/index.ts';
  import '#lib/i18n/catch.ts'; // the entries' names (their own catalog, out of the island's first load)
  import { findKey, type FirstFind } from '#lib/model/finds.ts';
  import { bare, entries, groups, type Entry, type ZukanKind } from './zukan.ts';

  interface Props {
    kind: ZukanKind;
    finds: Map<string, FirstFind>;
    names: Record<PersonId, string>;
    villagers: Record<PersonId, string | null>;
  }
  let { kind, finds, names, villagers }: Props = $props();

  const list = $derived(entries(kind));
  const runs = $derived(groups(kind));
  const found = $derived(list.filter((e) => finds.has(findKey(kind, e.id))).length);
  let pick = $state<Entry | null>(null);
  let line = $state('');
  /** The catch line runs past its two lines (measured as it shows), and whether it's opened to the full text. */
  let long = $state(false);
  let more = $state(false);
  const measure = (el: HTMLElement) => {
    if (el.scrollHeight > el.clientHeight + 1) long = true;
  };

  const date = (d: string) => `${Number(d.slice(5, 7))}/${Number(d.slice(8, 10))}`;
  async function open(e: Entry) {
    pick = e;
    line = '';
    long = more = false;
    if (kind !== 'fish' && kind !== 'bug' && kind !== 'sea') return;
    const { CATCH_LINES } = await import('../island/catchLines.ts');
    if (pick?.id !== e.id) return;
    const l = CATCH_LINES[e.id as keyof typeof CATCH_LINES]?.[i18n.locale === 'en' ? 1 : 0] ?? '';
    line = l.replace('<Player>', '');
  }
</script>

<!-- The page fills the level: the head holds still while the grid scrolls in its own scroller under it (as the むらびと
     picker; the panel body holds still on this level, IslandPanel's .fill). -->
<div class="zpage">
  <div class="zpin">
    <section class="card zhead" data-zukan-head>
      <div class="top">
        <h3>{t(`zukan.kind.${kind}`)}</h3>
        <b class="money" class:all={found === list.length}>{found === list.length ? t('zukan.complete') : t('zukan.count', { n: found, total: list.length })}</b>
      </div>
      {#if pick}
        {@const f = finds.get(findKey(kind, pick.id))}
        {#if f}
          <div class="zdetail" data-zukan-detail={pick.id}>
            <span class="big"><OfficialArt key={pick.art} size={48} /></span>
            <div class="txt">
              <b class="nm">{bare(t(pick.name))}</b>
              <span class="who"><Avatar person={f.person} villager={villagers[f.person]} size={20} />{t('zukan.foundBy', { date: date(f.date), name: names[f.person] })}</span>
              {#if line && long}
                <!-- a long catch line shows two lines and NH's ▼; a tap opens the rest (and closes it again) -->
                <button type="button" class="line more" class:open={more} aria-expanded={more} data-sfx="tick" onclick={() => (more = !more)}>{line}</button>
              {:else if line}
                <p class="line" {@attach measure}>{line}</p>
              {/if}
            </div>
          </div>
        {/if}
      {:else if !found}
        <p class="hint">{t('zukan.hint')}</p>
      {/if}
    </section>
  </div>

  <div class="zscroll" data-zukan-grid>
    {#each runs as run, i (i)}
      {#if run.name}
        {@const n = run.entries.filter((e) => finds.has(findKey(kind, e.id))).length}
        <h4 class="set" data-set={run.name.slice(run.name.lastIndexOf('.') + 1)}>
          <span>{t(run.name)}</span><b class="money" class:all={n === run.entries.length}>{t('zukan.count', { n, total: run.entries.length })}</b>
        </h4>
      {/if}
      <ul class="grid">
        {#each run.entries as e (e.id)}
          {@const f = finds.has(findKey(kind, e.id))}
          <li>
            {#if f}
              <button type="button" class="tile" class:on={pick?.id === e.id} data-sfx="tick" data-entry={e.id} aria-label={bare(t(e.name))} onclick={() => open(e)}>
                <OfficialArt key={e.art} size={40} />
                <span class="nm">{bare(t(e.name))}</span>
              </button>
            {:else}
              <span class="tile unknown" data-entry={e.id} aria-label={t('zukan.unknown')}>
                <span class="sil"><OfficialArt key={e.art} size={40} /></span>
                <span class="nm">{t('zukan.unknown')}</span>
              </span>
            {/if}
          </li>
        {/each}
      </ul>
    {/each}
  </div>
</div>

<style>
  /* Fills the level: the head holds still, the grid scrolls under it to the screen's bottom edge (its bottom padding is
     the panel body's, home indicator included). */
  .zpage { flex: 1; min-height: 0; display: flex; flex-direction: column; }
  .zpin { flex: none; position: relative; z-index: 1; }
  /* tiles scrolling up fade out under the head instead of being cut at a hard edge */
  .zpin::after {
    content: ''; position: absolute; left: -8px; right: -8px; top: 100%; height: 12px; pointer-events: none;
    background: linear-gradient(var(--surface), transparent);
  }
  .zhead { display: grid; gap: 8px; padding: 10px 14px; }
  .top { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
  .zhead h3 { margin: 0; font-size: var(--fs-talk); }
  .top b { font-size: var(--fs-body); white-space: nowrap; }
  .all { color: var(--leaf-text, #2E8A3E); }
  .hint { margin: 0; color: var(--text-soft); font-weight: 700; font-size: var(--fs-s); line-height: 1.5; }
  .zdetail { display: flex; gap: 10px; align-items: center; padding-top: 8px; border-top: 2px dashed color-mix(in srgb, var(--text) 14%, transparent); }
  .big { flex: none; line-height: 0; }
  .txt { flex: 1; display: grid; gap: 2px; min-width: 0; }
  .zdetail .nm { font-size: var(--fs-body); line-height: 1.3; }
  .who { display: flex; align-items: center; gap: 6px; color: var(--text-soft); font-size: var(--fs-s); font-weight: 700; }
  /* the catch line: two lines at most until opened */
  .line {
    margin: 2px 0 0; font-size: var(--fs-s); font-weight: 700; line-height: 1.5; white-space: pre-line;
    display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; line-clamp: 2; overflow: hidden;
  }
  .line.open { display: block; -webkit-line-clamp: none; line-clamp: none; }
  .more {
    appearance: none; border: 0; background: none; color: inherit; font-family: inherit; text-align: left; cursor: pointer;
    position: relative; width: 100%; padding: 0 18px 0 0; border-radius: 8px;
  }
  /* NH's ▼ (more to read) at the end of the second line, turned up once opened */
  .more::after {
    content: ''; position: absolute; right: 4px; bottom: 6px; border: 5px solid transparent; border-top: 7px solid var(--text-soft); border-bottom: 0;
  }
  .more.open::after { transform: rotate(180deg); }
  .more:active { background: color-mix(in srgb, var(--text) 8%, transparent); }
  /* The grid's own scroller. It bleeds 8px past the side padding (into the panel body's) so lips are not clipped. */
  .zscroll {
    flex: 1; min-height: 0; overflow: hidden auto; overscroll-behavior: contain;
    margin: 0 -8px; padding: 10px 8px var(--body-pad); display: flex; flex-direction: column; gap: 12px;
  }
  .set { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; margin: 6px 4px -2px; font-size: var(--fs-body); }
  .set b { font-size: var(--fs-s); }
  .grid { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(68px, 1fr)); gap: 8px; }
  .tile {
    appearance: none; border: 0; font: inherit; color: inherit; width: 100%; min-height: 84px; padding: 6px 2px 4px; border-radius: 14px;
    display: grid; justify-items: center; align-content: start; gap: 2px; background: var(--card); box-shadow: var(--sh-lip); line-height: 0;
  }
  button.tile { cursor: pointer; box-shadow: var(--sh-ctl); }
  button.tile:active { transform: translateY(2px); box-shadow: var(--sh-ctl-press); }
  .tile.on { background: var(--ctl-sel); color: var(--c-ink); }
  .tile .nm { font-size: .6875rem; font-weight: 700; line-height: 1.25; text-align: center; overflow-wrap: anywhere; word-break: keep-all; }
  .unknown { opacity: .9; }
  .unknown .nm { color: var(--text-soft); }
  /* a silhouette: the official icon, all one shade */
  .sil { line-height: 0; filter: brightness(0); opacity: .22; }
</style>
