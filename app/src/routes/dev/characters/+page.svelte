<script lang="ts">
  // Dev art gallery (Builder A, style guide v3 §10): every official art key next to its fan-art
  // fallback, the villager roster, しずえ poses, money marks, fruit rings, emotes, and the island
  // in every season × day/night (iframes of ./scene). Guarded by +page.ts (dev only).
  import { resolve } from '$app/paths';
  import OfficialArt from '#lib/components/OfficialArt.svelte';
  import Villager from '#lib/components/Villager.svelte';
  import Juniper from '#lib/components/Juniper.svelte';
  import Emote from '#lib/components/Emote.svelte';
  import LeafCoin from '#lib/components/LeafCoin.svelte';
  import FruitRing from '#lib/components/FruitRing.svelte';
  import IsabelleArt from '#lib/villagers/IsabelleArt.svelte';
  import VillagerFallback from '#lib/villagers/VillagerFallback.svelte';
  import { EXPRESSIONS } from '#lib/villagers/species.ts';
  import { ROSTER, ROSTER_IDS, isRosterId } from '#lib/villagers/roster.ts';
  import { art, artKeys, phoneArt, type HostPose, type PhoneApp } from '#lib/client/assets.ts';
  import type { FruitKey } from '#lib/types.ts';

  const KEYS = artKeys();
  const GROUPS = [...new Set(KEYS.map((k) => k.split('/')[0]))];
  const POSES: HostPose[] = ['wave', 'stand', 'bow', 'winter', 'icon'];
  const FRUITS: FruitKey[] = ['peach', 'coconut', 'apple', 'pear'];
  const APPS: PhoneApp[] = ['help', 'villager', 'lang', 'bell', 'sync', 'share'];
  const GLYPH: Record<PhoneApp, string> = {
    help: 'app-help', villager: 'app-villager', lang: 'app-lang', bell: 'app-bell', sync: 'app-sync', share: 'app-help'
  };
  const SCENES = (['spring', 'summer', 'autumn', 'winter'] as const).flatMap((s) => [
    { s, n: false },
    { s, n: true }
  ]);
  const sceneUrl = (s: string, n: boolean) => `${resolve('/dev/characters/scene')}?s=${s}&n=${n ? 1 : 0}`;

  /** What a key falls back to (for the side-by-side column). */
  function fbKind(key: string): 'villager' | 'villager-head' | 'host' | 'host-head' | 'fruit' | 'coin' | 'none' {
    const [g, id] = key.split('/');
    if (g === 'villagers') return id.endsWith('-icon') ? 'villager-head' : 'villager';
    if (key === 'host/isabelle-icon') return 'host-head';
    if (g === 'host' && id.startsWith('isabelle')) return 'host';
    if (g === 'fruit' && FRUITS.includes(id as FruitKey)) return 'fruit';
    if (key === 'money/bells') return 'coin';
    return 'none';
  }
  const rosterOf = (key: string) => {
    const id = key.split('/')[1].replace(/-icon$/, '');
    return isRosterId(id) ? ROSTER[id] : ROSTER.goldie;
  };
  let replay = $state(0);
</script>

<main class="gal">
  <h1>Art gallery</h1>
  <p class="cap">{KEYS.length} official files · fan-art fallback on the right of each · tap a villager to replay</p>

  <section>
    <h2>Villager roster</h2>
    <div class="grid roster">
      {#each ROSTER_IDS as id (id)}
        <figure>
          <button type="button" class="plain" onclick={() => replay++}>
            <Villager villager={id} size={96} expression="cheer" emote {replay} />
          </button>
          <span class="row">
            <Villager villager={id} size={44} head />
            <Villager villager={id} size={44} head official={false} />
            <Villager villager={id} size={64} official={false} />
          </span>
          <figcaption>{ROSTER[id].nameJa} · <code>{id}</code></figcaption>
        </figure>
      {/each}
      <figure>
        <Villager villager="nobody" person="B" size={96} />
        <figcaption>unknown id → B default</figcaption>
      </figure>
    </div>
  </section>

  <section>
    <h2>しずえ poses</h2>
    <div class="row">
      {#each POSES as p (p)}
        <figure><Juniper pose={p} head={p === 'icon'} size={p === 'icon' ? 44 : 96} /><figcaption>{p}</figcaption></figure>
      {/each}
    </div>
    <div class="row">
      {#each EXPRESSIONS as e (e)}
        <figure><Juniper expression={e} size={72} emote emoteHold /><figcaption>{e}</figcaption></figure>
      {/each}
    </div>
    <div class="row">
      {#each EXPRESSIONS as e (e)}
        <figure><Juniper expression={e} size={72} official={false} /><figcaption>fan-art {e}</figcaption></figure>
      {/each}
    </div>
  </section>

  <section>
    <h2>Fruit rings · money · emotes</h2>
    <div class="row">
      {#each FRUITS as f, i (f)}<FruitRing fruit={f} view={{ milli: 0, maxMilli: 0, pct: [10, 40, 75, 100][i] }} showPct />{/each}
    </div>
    <div class="row tree">
      {#each FRUITS as f, i (f)}<FruitRing fruit={f} view={{ milli: 0, maxMilli: 0, pct: [10, 40, 75, 100][i] }} onTree size="46px" />{/each}
    </div>
    <div class="row">
      <button type="button" class="plain" onclick={() => replay++}><LeafCoin size={48} spin={replay} /></button>
      <span class="amt"><LeafCoin size="1.1em" />¥146,200</span>
      <span class="amt"><LeafCoin size="1.1em" purse />¥3,200</span>
      <LeafCoin kind="leaf" size={32} /><LeafCoin kind="coin" size={32} />
      {#each ['note', 'bang', 'zz', 'sparkle', 'heart'] as k (k)}<Emote kind={k as 'note'} size={36} hold />{/each}
    </div>
  </section>

  <section>
    <h2>しまフォン apps (phoneArt)</h2>
    <div class="row">
      {#each APPS as a (a)}
        {@const pa = phoneArt(a)}
        <figure>
          <span class="tile" class:bare={pa?.tile}>
            <OfficialArt key={pa?.key} size={pa?.tile ? 56 : 34}>
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
          {@const fb = fbKind(key)}
          <figure class="key">
            <span class="pair">
              <span class="cell"><OfficialArt {key} size={64} /></span>
              <span class="cell fb">
                {#if fb === 'villager' || fb === 'villager-head'}
                  <VillagerFallback look={rosterOf(key)} head={fb === 'villager-head'} height="64px" />
                {:else if fb === 'host' || fb === 'host-head'}
                  <svg viewBox={fb === 'host-head' ? '6 -9 88 88' : '0 -10 100 128'} height="64" width={fb === 'host-head' ? 64 : 50}>
                    <IsabelleArt head={fb === 'host-head'} animate={false} />
                  </svg>
                {:else if fb === 'fruit'}
                  <svg viewBox="0 0 24 24" width="44" height="44"><use href="#f-{key.split('/')[1]}" /></svg>
                {:else if fb === 'coin'}
                  <LeafCoin kind="coin" size={40} />
                {:else}
                  <span class="none">—</span>
                {/if}
              </span>
            </span>
            <figcaption><code>{key.split('/')[1]}</code> {e?.w}×{e?.h}{e?.box ? ' ✂' : ''}</figcaption>
          </figure>
        {/each}
      </div>
    </section>
  {/each}

  <section>
    <h2>Island · season × day / night</h2>
    <div class="scenes">
      {#each SCENES as sc (sc.s + sc.n)}
        <figure>
          <iframe title="{sc.s} {sc.n ? 'night' : 'day'}" src={sceneUrl(sc.s, sc.n)} loading="lazy"></iframe>
          <figcaption>{sc.s} · {sc.n ? 'night' : 'day'}</figcaption>
        </figure>
      {/each}
    </div>
  </section>
</main>

<style>
  .gal { padding: 16px 12px 140px; max-width: 100%; }
  h1 { font-size: var(--fs-h1); font-weight: 900; margin: 0; }
  h2 { font-size: var(--fs-h2); font-weight: 900; margin: 26px 0 8px; }
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
  .pair { display: flex; gap: 6px; }
  .cell { width: 70px; height: 70px; display: grid; place-items: center; border-radius: 14px; background: var(--grass); }
  .cell.fb { background: var(--surface); border: 2px dashed var(--stitch); }
  .none { color: var(--text-faint); }
  .tile { width: 56px; height: 56px; border-radius: 30%; display: grid; place-items: center; background: var(--app-lang); }
  .tile.bare { background: none; }
  .tile svg { width: 30px; height: 30px; color: var(--c-ink); }
  .amt { display: inline-flex; align-items: center; gap: 4px; font-family: var(--font-num); font-weight: 700; font-size: 1.25rem; }
  .plain { appearance: none; border: 0; background: none; padding: 0; cursor: pointer; }
  .scenes { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
  iframe { width: 100%; aspect-ratio: 390 / 540; border: 2px solid var(--edge); border-radius: 14px; background: var(--bg); }
</style>
