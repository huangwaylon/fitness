<script lang="ts">
  // A ずかん page (docs/design.md "Zukan"): every entry of one kind in the game's order, the official icon (lazy) and the
  // name for the ones either of us has found, a silhouette and ？？？ for the rest. A tap on a found one shows it on top:
  // the icon, the name, when and who found it first, and (fish and bugs) NH's catch line.
  import { tick } from 'svelte';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import Avatar from '../characters/Avatar.svelte';
  import type { PersonId } from '#lib/types.ts';
  import { i18n, t } from '#lib/i18n/index.ts';
  import { findKey, type FirstFind } from '#lib/model/finds.ts';
  import { bare, entries, type Entry, type ZukanKind } from './zukan.ts';

  interface Props {
    kind: ZukanKind;
    finds: Map<string, FirstFind>;
    names: Record<PersonId, string>;
    villagers: Record<PersonId, string | null>;
  }
  let { kind, finds, names, villagers }: Props = $props();

  const list = $derived(entries(kind));
  const found = $derived(list.filter((e) => finds.has(findKey(kind, e.id))).length);
  let pick = $state<Entry | null>(null);
  let line = $state('');
  let detail = $state<HTMLElement>();

  const date = (d: string) => `${Number(d.slice(5, 7))}/${Number(d.slice(8, 10))}`;
  async function open(e: Entry) {
    pick = e;
    line = '';
    await tick();
    detail?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    if (kind !== 'fish' && kind !== 'bug') return;
    const { CATCH_LINES } = await import('../island/catchLines.ts');
    if (pick?.id !== e.id) return;
    const l = CATCH_LINES[e.id as keyof typeof CATCH_LINES]?.[i18n.locale === 'en' ? 1 : 0] ?? '';
    line = l.replace('<Player>', '');
  }
</script>

<section class="card zhead">
  <h3>{t(`zukan.kind.${kind}`)}</h3>
  <b class="money" class:all={found === list.length}>{found === list.length ? t('zukan.complete') : t('zukan.count', { n: found, total: list.length })}</b>
</section>

{#if pick}
  {@const f = finds.get(findKey(kind, pick.id))}
  {#if f}
    <section class="card zdetail" bind:this={detail} data-zukan-detail={pick.id}>
      <span class="big"><OfficialArt key={pick.art} size={64} /></span>
      <div class="txt">
        <b class="nm">{bare(t(pick.name))}</b>
        <span class="who"><Avatar person={f.person} villager={villagers[f.person]} size={20} />{t('zukan.foundBy', { date: date(f.date), name: names[f.person] })}</span>
        {#if line}<p class="line">{line}</p>{/if}
      </div>
    </section>
  {/if}
{:else if !found}
  <p class="hint">{t('zukan.hint')}</p>
{/if}

<ul class="grid">
  {#each list as e (e.id)}
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

<style>
  .zhead { display: flex; align-items: baseline; justify-content: space-between; padding: 12px 16px; }
  .zhead h3 { margin: 0; font-size: var(--fs-talk); }
  .zhead b { font-size: var(--fs-body); }
  .all { color: var(--leaf-text, #2E8A3E); }
  .hint { margin: 0 4px; color: var(--text-soft); font-weight: 700; font-size: var(--fs-s); line-height: 1.5; }
  .zdetail { display: flex; gap: 12px; align-items: center; padding: 12px 14px; }
  .big { flex: none; line-height: 0; }
  .txt { display: grid; gap: 4px; min-width: 0; }
  .zdetail .nm { font-size: var(--fs-talk); }
  .who { display: flex; align-items: center; gap: 6px; color: var(--text-soft); font-size: var(--fs-s); font-weight: 700; }
  .line { margin: 2px 0 0; font-size: var(--fs-s); font-weight: 700; line-height: 1.5; white-space: pre-line; }
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
