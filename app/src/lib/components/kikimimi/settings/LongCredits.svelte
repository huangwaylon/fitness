<script lang="ts">
  // せってい's 「音声の出典」 (docs/kikimimi.md "まるごと 聞く"): every real recording まるごと 聞く plays, its credit line as its
  // licence asks, the episode and the licence linked. Shut till opened: opening loads the long files' parts (pool.ts).
  import { INDEX, listenOf, load, type Unit } from '#lib/kikimimi/pool.ts';
  import type { ListenItem } from '#lib/kikimimi/listen.ts';
  import { t } from '#lib/i18n/index.ts';

  type Long = Extract<ListenItem, { kind: 'long' }>;
  const units = Object.keys(INDEX.listen).filter((u) => INDEX.listen[u][0] === 'long');
  let open = $state(false);
  let pieces = $state<Long[] | null>(null);
  async function toggle() {
    open = !open;
    if (!open || pieces) return;
    await load(...(units as Unit[]));
    pieces = units.flatMap((u) => listenOf(u)?.items.flatMap((it) => (it.kind === 'long' && it.credit ? [it] : [])) ?? []);
  }
</script>

<section class="sec" aria-labelledby="kk-credits">
  <h3 id="kk-credits" class="sec-label">{t('kiki.set.credits')}</h3>
  <button type="button" class="row tile-btn" aria-expanded={open} data-kiki-set-credits data-sfx="tick" onclick={toggle}>
    <span class="rl">{t('kiki.mode.long')}<small>{t('kiki.set.creditsAbout')}</small></span>
    <span class="chev" aria-hidden="true">{open ? '⌄' : '›'}</span>
  </button>
  {#if open && pieces}
    <ul class="list card" data-kiki-credits>
      {#each pieces as p (p.id)}
        {@const c = p.credit!}
        <li data-kiki-credit={p.id}>
          <b>{p.name}</b>
          <span>{c.attribution}</span>
          <span><a href={c.url} target="_blank" rel="noopener noreferrer" data-sfx="open">{c.title}</a> · <a href={c.licenceUrl} target="_blank" rel="noopener noreferrer" data-sfx="open">{c.licence}</a></span>
        </li>
      {/each}
    </ul>
  {/if}
</section>

<style>
  .sec { display: grid; gap: 8px; }
  .row { display: flex; align-items: center; gap: 12px; min-height: 60px; padding: 8px 16px; margin: 0; border-radius: var(--r-card); text-align: left; width: 100%; }
  .rl { flex: 1; min-width: 0; font: 700 var(--fs-body)/1.3 var(--font-ui); }
  .rl small { display: block; margin-top: 2px; font-size: var(--fs-s); color: var(--text-soft); }
  .chev { flex: none; font: 700 var(--fs-title)/1 var(--font-ui); color: var(--text-soft); }
  .list { list-style: none; margin: 0; padding: 12px 14px; display: grid; gap: 12px; }
  .list li { display: grid; gap: 2px; font: 500 var(--fs-s)/1.5 var(--font-ui); color: var(--text-soft); overflow-wrap: anywhere; }
  .list b { font: 700 var(--fs-body)/1.4 var(--font-ui); color: var(--text); }
  .list a { color: inherit; }
</style>
