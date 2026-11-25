<script lang="ts">
  // The editor's palette (docs/island-layout.md "The editor"): every placeable kind by group, a row of the groups to jump
  // to (the list is long: 394 outdoor pieces once the catalogue is in), and the piece being placed's 種類. The desktop's
  // left column, the phone's 置く sheet.
  import { KIND_LIST, type KindDef } from '#lib/layout/catalog.ts';
  import { runs } from './edits.ts';
  import { variantName } from './gardenIcons.ts';

  interface Props {
    placing: KindDef | null;
    placeS: string | undefined;
    /** The outdoor catalogue is in (its kinds join KIND_LIST). */
    outdoorIn: boolean;
    /** One of a kind (`fixed`) and on the island already. */
    present(d: KindDef): boolean;
    iconUrl(key: string): string | null;
    onpick(d: KindDef): void;
  }
  let { placing, placeS = $bindable(), outdoorIn, present, iconUrl, onpick }: Props = $props();

  const GROUPS: [string, string][] = [['tree', '木'], ['bush', '低木'], ['flower', '花'], ['crop', '野菜'], ['fence', 'フェンス'], ['rock', '岩'], ['light', '明かり'], ['furniture', '家具'], ['camp', 'キャンプ'], ['food', '食べ物'], ['gym', 'ジム'], ['garden', '庭'], ['park', '公園'], ['town', '街'], ['beach', '海辺'], ['statue', 'オブジェ'], ['event', '行事'], ['gyroid', 'はにわ'], ['season', '季節'], ['structure', '橋・坂'], ['building', '建物'], ['visitor', 'お客さん']];
  const groups = $derived((void outdoorIn, GROUPS.map(([g, name]) => ({ g, name, kinds: KIND_LIST.filter((d) => d.group === g && !d.hidden) })).filter((x) => x.kinds.length)));
  let list = $state<HTMLElement>();
  const jump = (g: string) => list?.querySelector(`[data-group="${g}"]`)?.scrollIntoView({ block: 'start' });
</script>

<nav class="jump" aria-label="グループ">
  {#each groups as x (x.g)}<button type="button" class="jumpc" data-jump={x.g} onclick={() => jump(x.g)}>{x.name}</button>{/each}
</nav>
{#if placing && (placing.variants || runs(placing.k))}
  <div class="now">
    {#if placing.variants}
      <label class="row">種類
        <select bind:value={placeS}>{#each placing.variants as v (v)}<option value={v}>{variantName(placing.k, v)}</option>{/each}</select>
      </label>
    {/if}
    {#if runs(placing.k)}<p class="hint">ドラッグで続けて置けます。隣り合う同じフェンスはつながります</p>{/if}
  </div>
{/if}
<div class="palette" bind:this={list}>
  {#each groups as x (x.g)}
    <section class="group" data-group={x.g}>
      <h3>{x.name}</h3>
      <div class="items">
        {#each x.kinds as d (d.k)}
          <button type="button" class="item" data-kind={d.k} aria-pressed={placing?.k === d.k} disabled={present(d)} title={`${d.ja}${present(d) ? '（島にある）' : ''}`} onclick={() => onpick(d)}>
            {#if d.icon && iconUrl(d.icon)}<img src={iconUrl(d.icon)} alt="" loading="lazy" />{:else}<span class="glyph">{d.k === 'stairs' ? '⛰' : d.k === 'board' ? '📋' : '・'}</span>{/if}
            <span class="lbl">{d.ja}</span>
          </button>
        {/each}
      </div>
    </section>
  {/each}
</div>

<style>
  .jump { display: flex; gap: 6px; overflow-x: auto; scrollbar-width: none; margin: 0 -12px; padding: 2px 12px 4px; flex: none; }
  .jump::-webkit-scrollbar { display: none; }
  .jump .jumpc { flex: none; min-height: 36px; padding: 0 12px; border-radius: 999px; font-size: 13px; border-width: 1.5px; }
  .now { display: flex; flex-direction: column; gap: 4px; }
  .row { display: flex; gap: 6px; align-items: center; font-size: 13px; font-weight: 700; }
  select { font-family: inherit; font-size: 16px; min-height: 44px; flex: 1; min-width: 0; }
  .hint { font-size: 13px; color: var(--c-ink-soft); line-height: 1.5; margin: 0; }
  .palette { display: flex; flex-direction: column; gap: 8px; }
  h3 { font-size: 13px; color: var(--c-ink-soft); font-weight: 700; margin: 0 0 2px; scroll-margin-top: 4px; }
  .items { display: grid; grid-template-columns: repeat(auto-fill, minmax(58px, 1fr)); gap: 4px; }
  .items .item { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 4px 2px; border-radius: 8px; border-width: 1.5px; min-height: 60px; min-width: 0; }
  .item img { width: 38px; height: 38px; object-fit: contain; }
  .glyph { font-size: 26px; line-height: 38px; height: 38px; }
  .lbl { font-size: 10px; font-weight: 500; line-height: 1.15; text-align: center; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  /* (a phone's sheet: five a row, their names whole) */
  @media (max-width: 760px) {
    .items { grid-template-columns: repeat(auto-fill, minmax(68px, 1fr)); }
    .lbl { font-size: 11px; }
  }
</style>
