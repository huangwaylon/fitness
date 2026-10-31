<script lang="ts">
  // ずかん (docs/design.md "Zukan"), on きろく: one row per kind (さかな, むし, かせき, かいがら) with how many of us
  // have found, each a doorway to its page (Zukan.svelte). Shared between the two of us (the first find of either).
  import OfficialArt from '../characters/OfficialArt.svelte';
  import { t } from '#lib/i18n/index.ts';
  import { KIND_ART, ZUKAN_KINDS, entries, type ZukanKind } from './zukan.ts';
  import { findKey, type FirstFind } from '#lib/model/finds.ts';

  interface Props {
    finds: Map<string, FirstFind>;
    onopen: (kind: ZukanKind) => void;
  }
  let { finds, onopen }: Props = $props();
  const rows = $derived(ZUKAN_KINDS.map((kind) => {
    const all = entries(kind);
    return { kind, total: all.length, n: all.filter((e) => finds.has(findKey(kind, e.id))).length };
  }));
</script>

<section class="card zk" aria-label={t('zukan.title')}>
  {#each rows as r (r.kind)}
    <button type="button" class="zrow" data-sfx="page" data-zukan={r.kind} onclick={() => onopen(r.kind)}>
      <span class="ic"><OfficialArt key={KIND_ART[r.kind]} size={30} /></span>
      <span class="k">{t(`zukan.kind.${r.kind}`)}</span>
      <b class="v money" class:all={r.n === r.total}>{t('zukan.count', { n: r.n, total: r.total })}</b>
      <span class="go" aria-hidden="true">›</span>
    </button>
  {/each}
</section>

<style>
  .zk { display: grid; gap: 2px; padding: 6px 8px; }
  .zrow {
    appearance: none; border: 0; background: none; color: inherit; cursor: pointer; display: flex; align-items: center; gap: 10px;
    min-height: var(--hit); padding: 4px 8px; border-radius: 12px; font: inherit; text-align: left;
  }
  .zrow:active { background: color-mix(in srgb, var(--text) 8%, transparent); }
  .ic { flex: none; width: 34px; display: grid; place-items: center; line-height: 0; }
  .k { flex: 1; font-weight: 700; font-size: var(--fs-body); }
  .v { font-size: var(--fs-body); }
  .v.all { color: var(--leaf-text, #2E8A3E); }
  .go { color: var(--text-soft); font-size: 1.2em; }
</style>
