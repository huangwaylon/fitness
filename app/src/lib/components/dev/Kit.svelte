<script lang="ts">
  // The unified kit on one page (docs/design.md "Unified kit"; routes/dev/kit, `vite dev` only): every piece the info
  // sheets are built from, in a full sheet, so a change to one is seen in place. Time of day: `?theme=dusk|night`.
  import Sheet from '#lib/components/ui/Sheet.svelte';
  import NavBar from '#lib/components/ui/NavBar.svelte';
  import NavButton from '#lib/components/ui/NavButton.svelte';
  import TabBar from '#lib/components/ui/TabBar.svelte';
  import Chip from '#lib/components/ui/Chip.svelte';
  import ChipRow from '#lib/components/ui/ChipRow.svelte';
  import Segmented from '#lib/components/ui/Segmented.svelte';
  import Tick from '#lib/components/ui/Tick.svelte';
  import StatStrip from '#lib/components/ui/StatStrip.svelte';
  import PhotoBand from '#lib/components/ui/PhotoBand.svelte';
  import ProgressBar from '#lib/components/ui/ProgressBar.svelte';
  import ActionSheet from '#lib/components/ui/ActionSheet.svelte';
  import Icon from '#lib/components/ui/Icon.svelte';

  let open = $state(true);
  let form = $state(false);
  let acts = $state(false);
  let tab = $state<'plan' | 'map' | 'pack'>('plan');
  let chip = $state('all');
  let unit = $state<'km' | 'mi'>('km');
  let ticks = $state([true, false, false]);
  const ICONS = ['calendar', 'map', 'backpack', 'list', 'checks', 'edit', 'heart', 'gear', 'plus', 'clock', 'pin', 'distance', 'mountain', 'users', 'sunrise', 'trash'] as const;
</script>

<Sheet bind:open label="Kit" variant="full">
  <div class="col">
    <PhotoBand src="/travel/okinawa/hero.webp" height={120} edge>
      {#snippet nav()}<NavBar size="s" over title="Kit" onback={() => {}} onclose={() => (open = false)} />{/snippet}
      <b class="ttl">PhotoBand · NavBar over</b>
    </PhotoBand>
    <NavBar size="s" title="りょこう" onclose={() => (open = false)} trailing={add} />
    {#snippet add()}<NavButton kind="back" size="s" label="add" onclick={() => {}} />{/snippet}
    <ChipRow label="filter">
      {#each ['all', 'late', 'soon', 'later'] as c (c)}<Chip label={c} count={3} dot={c === 'late' ? 'var(--c-coral)' : undefined} selected={chip === c} onclick={() => (chip = c)} />{/each}
      <Segmented items={[{ id: 'km', label: 'km' }, { id: 'mi', label: 'mi' }]} value={unit} label="units" attr="units" onpick={(u) => (unit = u)} />
    </ChipRow>
    <div class="scroll">
      <h3 class="sec-label head sticky coral">期限切れ<span class="n">3件</span></h3>
      <div class="card dense">
        {#each ticks as on, i (i)}
          <div class="row"><Tick checked={on} label="item {i}" onchange={(v) => (ticks[i] = v)} who={on ? [{ name: 'うめ', tone: 'b' }] : []} /><span>パスポート</span><span class="tag">書類</span></div>
        {/each}
        <button type="button" class="row" data-sfx="open" onclick={() => (acts = true)}><Icon name="more" />ActionSheet</button>
        <button type="button" class="row" data-sfx="open" onclick={() => (form = true)}><Icon name="edit" />Form sheet</button>
        <div class="row kv"><span>距離</span><span>8.4 km</span></div>
      </div>
      <h3 class="sec-label head leaf">今月<span class="n">2件</span></h3>
      <div class="card dense"><StatStrip items={[{ icon: 'distance', value: '8.4', unit: 'km', label: '距離' }, { icon: 'mountain', value: 620, unit: 'm', label: '標高差' }, { icon: 'clock', value: '4:30', label: '時間' }]} /></div>
      <div class="row-x"><ProgressBar value={12} max={35} label="12 / 35" /><span class="sticker">今日</span><span class="sticker coral">行ってきた</span><NavButton kind="close" size="s" onclick={() => {}} /></div>
      <div class="icons">{#each ICONS as n (n)}<Icon name={n} size={22} /><Icon name={n} size={22} soft />{/each}</div>
      <hr class="stitch" />
      <p class="grain note">Body text in --font-body 15/1.45; a note in --fs-s.</p>
    </div>
    <TabBar items={[{ id: 'plan', label: 'プラン', icon: 'list' }, { id: 'map', label: '地図', icon: 'map' }, { id: 'pack', label: '持ち物', icon: 'backpack' }]} value={tab} label="tabs" attr="kit-tab" onpick={(v) => (tab = v)} />
  </div>
</Sheet>

<ActionSheet bind:open={acts} title="現金" groups={[[{ id: 'edit', label: '編集', icon: 'edit' }, { id: 'up', label: '上へ', icon: 'up', off: true }], [{ id: 'rm', label: '削除', icon: 'trash', danger: true }]]} onpick={() => {}} />

<Sheet bind:open={form} label="タスク" title="タスク" focusField>
  <label class="fld">タイトル<input type="text" /></label>
  {#snippet footer()}<button type="button" class="btn" data-sfx="confirm" onclick={() => (form = false)}>保存</button>{/snippet}
</Sheet>

{#if !open}<button type="button" class="btn small" data-sfx="open" onclick={() => (open = true)}>open</button>{/if}

<style>
  .col { flex: 1; min-height: 0; display: flex; flex-direction: column; }
  .ttl { font: 700 var(--fs-talk)/1.2 var(--font-ui); }
  .scroll { flex: 1; min-height: 0; overflow: auto; padding: 0 12px 16px; display: grid; gap: 8px; align-content: start; }
  .row-x { display: flex; align-items: center; gap: 10px; padding: 8px 0; }
  .icons { display: flex; flex-wrap: wrap; gap: 8px; color: var(--text); }
  .note { margin: 0; padding: 12px; border-radius: var(--r-row); }
  .fld { display: grid; gap: 6px; }
  .fld input { min-height: var(--hit); padding: 0 12px; border: 0; border-radius: var(--r-chip); background: var(--card); box-shadow: inset 0 0 0 1.5px var(--edge); }
</style>
