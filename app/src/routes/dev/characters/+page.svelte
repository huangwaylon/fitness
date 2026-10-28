<script lang="ts">
  // Dev art gallery (style guide v3 §10): every official art key, the villager roster, しずえ poses,
  // the fallback silhouette, money marks, fruit ripeness stages, emotes, and the island in every
  // season × day/night. Guarded by +page.ts (dev only).
  import { onMount } from 'svelte';
  import OfficialArt from '#lib/components/OfficialArt.svelte';
  import Villager from '#lib/components/Villager.svelte';
  import Host from '#lib/components/Host.svelte';
  import Silhouette from '#lib/components/Silhouette.svelte';
  import Emote from '#lib/components/Emote.svelte';
  import LeafCoin from '#lib/components/LeafCoin.svelte';
  import FruitRing from '#lib/components/FruitRing.svelte';
  import IslandScene from '#lib/components/IslandScene.svelte';
  import { ROSTER, ROSTER_IDS } from '#lib/villagers/roster.ts';
  import { art, artKeys, phoneArt, type PhoneApp } from '#lib/client/assets.ts';
  import { FRUITS } from '#lib/config/rules.ts';
  import { week } from '#lib/client/week.svelte.ts';

  const KEYS = artKeys();
  const GROUPS = [...new Set(KEYS.map((k) => k.split('/')[0]))];
  const POSES = ['wave', 'stand', 'bow'] as const;
  const APPS: PhoneApp[] = ['help', 'villager', 'lang', 'bell', 'sync', 'share'];
  const GLYPH: Record<PhoneApp, string> = {
    help: 'app-help', villager: 'app-villager', lang: 'app-lang', bell: 'app-bell', sync: 'app-sync', share: 'app-lock'
  };
  const SCENES = (['spring', 'summer', 'autumn', 'winter'] as const).flatMap((s) => [
    { s, n: false },
    { s, n: true }
  ]);

  // The scene palette lives on :root[data-season][data-theme] (tokens.css), so to show all eight
  // side by side we briefly apply each combination, snapshot every custom property those rules
  // set, and replay the snapshot as inline variables on that scene's wrapper.
  let sceneVars = $state<string[]>([]);
  onMount(() => {
    const names = new Set<string>();
    for (const sheet of Array.from(document.styleSheets)) {
      let rules: CSSRuleList;
      try { rules = sheet.cssRules; } catch { continue; }
      for (const r of Array.from(rules)) {
        if (r instanceof CSSStyleRule && /:root\[data-(season|theme|tod)/.test(r.selectorText)) {
          for (const n of Array.from(r.style)) if (n.startsWith('--')) names.add(n);
        }
      }
    }
    const root = document.documentElement;
    const saved = { ...root.dataset };
    sceneVars = SCENES.map(({ s, n }) => {
      root.dataset.season = s;
      root.dataset.theme = n ? 'night' : 'day';
      root.dataset.tod = n ? 'night' : 'day';
      const cs = getComputedStyle(root);
      return [...names].map((k) => `${k}:${cs.getPropertyValue(k)}`).join(';');
    });
    Object.assign(root.dataset, saved);
  });

  let replay = $state(0);
</script>

<main class="gal">
  <h1>Art gallery</h1>
  <p class="cap">{KEYS.length} official files · tap a villager to replay its hop</p>

  <section>
    <h2>Villager roster</h2>
    <div class="grid roster">
      {#each ROSTER_IDS as id (id)}
        <figure>
          <button type="button" class="plain" onclick={() => replay++}>
            {#key replay}<Villager villager={id} size={96} expression="cheer" emote />{/key}
          </button>
          <span class="row"><Villager villager={id} size={44} head /></span>
          <figcaption>{ROSTER[id].nameJa} · <code>{id}</code></figcaption>
        </figure>
      {/each}
      <figure>
        <Villager villager="nobody" person="B" size={96} />
        <figcaption>unknown id → B default</figcaption>
      </figure>
      <figure>
        <span class="row"><Silhouette colour={ROSTER.goldie.colour} height="96px" /><Silhouette height="44px" head /></span>
        <figcaption>fallback silhouette (missing art)</figcaption>
      </figure>
    </div>
  </section>

  <section>
    <h2>しずえ poses (winter: always the winter outfit)</h2>
    <div class="row">
      {#each POSES as p (p)}
        <figure><Host pose={p} size={96} /><figcaption>{p}</figcaption></figure>
      {/each}
      <figure><Host head size={44} /><figcaption>icon</figcaption></figure>
    </div>
  </section>

  <section>
    <h2>Fruit ripeness · money · emotes</h2>
    <div class="row">
      {#each FRUITS as f, i (f)}<FruitRing fruit={f} view={{ milli: 0, maxMilli: 0, pct: [10, 40, 75, 100][i] }} showPct />{/each}
    </div>
    <div class="row tree">
      {#each [10, 40, 75, 100] as pct (pct)}<FruitRing fruit="apple" view={{ milli: 0, maxMilli: 0, pct }} onTree size="46px" />{/each}
    </div>
    <div class="row">
      <span class="amt"><LeafCoin size="1.1em" />¥146,200</span>
      <LeafCoin kind="leaf" size={32} />
      {#each ['note', 'bang', 'zz', 'sparkle', 'heart'] as const as k (k)}<Emote kind={k} size={36} hold />{/each}
    </div>
  </section>

  <section>
    <h2>しまフォン apps</h2>
    <div class="row">
      {#each APPS as a (a)}
        <figure>
          <span class="tile">
            <OfficialArt key={phoneArt(a)} size={56}>
              {#snippet fallback()}<svg viewBox="0 0 24 24"><use href="#{GLYPH[a]}" /></svg>{/snippet}
            </OfficialArt>
          </span>
          <figcaption>{a}</figcaption>
        </figure>
      {/each}
    </div>
  </section>

  {#each GROUPS as g (g)}
    <section>
      <h2>{g}/</h2>
      <div class="grid">
        {#each KEYS.filter((k) => k.startsWith(g + '/')) as key (key)}
          {@const e = art(key)}
          <figure class="key">
            <span class="cell"><OfficialArt {key} size={64} /></span>
            <figcaption><code>{key.split('/')[1]}</code> {e?.w}×{e?.h}{e?.box ? ' ✂' : ''}</figcaption>
          </figure>
        {/each}
      </div>
    </section>
  {/each}

  <section>
    <h2>Island · season × day / night</h2>
    <div class="scenes">
      {#if week.view}
        {#each SCENES as sc, i (sc.s + sc.n)}
          <figure>
            <div class="sc" style={sceneVars[i] ?? ''}><IslandScene view={week.view} season={sc.s} night={sc.n} /></div>
            <figcaption>{sc.s} · {sc.n ? 'night' : 'day'}</figcaption>
          </figure>
        {/each}
      {/if}
    </div>
  </section>
</main>

<style>
  .gal { padding: 16px 12px 140px; max-width: 100%; }
  h1 { font-size: var(--fs-h1); font-weight: 700; margin: 0; }
  h2 { font-size: var(--fs-h2); font-weight: 700; margin: 26px 0 8px; }
  .cap { color: var(--text-soft); font-size: var(--fs-caption); margin: 4px 0 0; }
  section { border-bottom: 2px dashed var(--stitch); padding-bottom: 12px; }
  .row { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 12px; padding: 14px 0 6px; }
  .row.tree { background: var(--tree-leaf); border-radius: var(--r-card); padding: 10px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; }
  .grid.roster { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); }
  figure { margin: 0; display: grid; justify-items: center; align-content: end; gap: 4px; }
  figure .row { padding: 0; gap: 6px; align-items: flex-end; }
  figcaption { font-size: var(--fs-micro); color: var(--text-soft); text-align: center; }
  code { font-size: .7rem; }
  .cell { width: 70px; height: 70px; display: grid; place-items: center; border-radius: 14px; background: var(--grass); }
  .tile { width: 56px; height: 56px; border-radius: 30%; display: grid; place-items: center; overflow: hidden; background: var(--app-lang); }
  .tile svg { width: 30px; height: 30px; color: var(--c-ink); }
  .amt { display: inline-flex; align-items: center; gap: 4px; font-family: var(--font-num); font-weight: 700; font-size: 1.25rem; }
  .plain { appearance: none; border: 0; background: none; padding: 0; cursor: pointer; }
  .scenes { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
  .sc { width: 176px; aspect-ratio: 390 / 540; border: 2px solid var(--edge); border-radius: 14px; overflow: hidden; background: var(--bg); }
  /* Render at phone width, then zoom down, so the min tap sizes don't distort the thumbnail. */
  .sc > :global(*) { width: 390px; zoom: .441; }
  .scenes figure { align-content: start; }
</style>
