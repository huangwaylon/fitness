<script lang="ts">
  // Dev gallery (Builder A): roster × expressions, Isabelle, sizes, generic species colourways,
  // emotes, leaf-coin, fruit + app icons, and the island in each season × day/night.
  // Guarded by +page.ts (dev only).
  import Villager from '#lib/components/Villager.svelte';
  import Juniper from '#lib/components/Juniper.svelte';
  import Emote from '#lib/components/Emote.svelte';
  import LeafCoin from '#lib/components/LeafCoin.svelte';
  import IslandScene from '#lib/components/IslandScene.svelte';
  import { SPECIES, SPECIES_IDS, EXPRESSIONS } from '#lib/villagers/species.ts';
  import { ROSTER, ROSTER_IDS } from '#lib/villagers/roster.ts';
  import { week } from '#lib/client/week.svelte.ts';
  import { theme, type Season } from '#lib/client/theme.svelte.ts';

  const SEASONS: Season[] = ['spring', 'summer', 'autumn', 'winter'];
  const APPS = ['island', 'jar', 'us', 'help', 'villager', 'lang', 'bell', 'sync'];
  const APP_FILL: Record<string, string> = {
    island: '--app-island', jar: '--app-jar', us: '--app-us', help: '--app-help',
    villager: '--app-villager', lang: '--app-lang', bell: '--app-bell', sync: '--app-sync'
  };
  const FRUITS = ['peach', 'coconut', 'apple', 'pear'];

  /** Set the scene attributes directly (the theme clock re-applies them within a minute). */
  function scene(season: Season, night: boolean) {
    const r = document.documentElement;
    r.dataset.season = season;
    r.dataset.theme = night ? 'night' : 'day';
    r.dataset.tod = night ? 'night' : 'day';
    theme.season = season;
    theme.night = night;
    theme.tod = night ? 'night' : 'day';
  }
  let tap = $state(0);
</script>

<main class="gal">
  <h1>Characters</h1>

  <section>
    <h2>Host: しずえ (Isabelle)</h2>
    <div class="row">
      {#each EXPRESSIONS as e (e)}
        <figure><Juniper expression={e} size={96} emote emoteHold /><figcaption>{e}</figcaption></figure>
      {/each}
    </div>
    <div class="row">
      <Juniper size={140} /><Juniper size={72} /><Juniper head size={48} /><Juniper head size={22} />
    </div>
  </section>

  <section>
    <h2>Roster × expressions</h2>
    {#each ROSTER_IDS as id (id)}
      <div class="row">
        <b>{ROSTER[id].nameJa} · {ROSTER[id].nameEn} <code>villager="{id}"</code></b>
        {#each EXPRESSIONS as e (e)}
          <Villager villager={id} expression={e} size={84} emote emoteHold />
        {/each}
      </div>
    {/each}
  </section>

  <section>
    <h2>Sizes (140 · 64 · head 40 · head 22)</h2>
    {#each ROSTER_IDS as id (id)}
      <div class="row tight">
        <Villager villager={id} size={140} />
        <Villager villager={id} size={64} />
        <Villager villager={id} size={40} />
        <Villager villager={id} size={22} />
      </div>
    {/each}
  </section>

  <section>
    <h2>Generic species colourways (fallback)</h2>
    {#each SPECIES_IDS as id (id)}
      <div class="row tight">
        <b>{SPECIES[id].nameJa}</b>
        {#each SPECIES[id].colourways as c (c.id)}<Villager species={id} colourway={c.id} size={72} />{/each}
      </div>
    {/each}
  </section>

  <section>
    <h2>Emotes · leaf-coin · fruit · apps</h2>
    <div class="row">
      {#each ['note', 'bang', 'zz', 'sparkle', 'heart'] as k (k)}<Emote kind={k as 'note'} size={40} hold />{/each}
      <button type="button" class="coinbtn" onclick={() => tap++}><LeafCoin size={44} spin={tap} /></button>
      <LeafCoin size={22} />
    </div>
    <div class="row">
      {#each FRUITS as f (f)}<svg width="44" height="44" viewBox="0 0 24 24"><use href="#f-{f}" /></svg>{/each}
    </div>
    <div class="row">
      {#each APPS as a (a)}
        <span class="tile" style:background="var({APP_FILL[a]})"><svg viewBox="0 0 24 24"><use href="#app-{a}" /></svg></span>
      {/each}
    </div>
  </section>

  <section>
    <h2>Island</h2>
    <div class="row">
      {#each SEASONS as s (s)}
        <button type="button" class="chip" onclick={() => scene(s, false)}>{s}</button>
        <button type="button" class="chip" onclick={() => scene(s, true)}>{s} ☾</button>
      {/each}
    </div>
    {#if week.view}<div class="sc"><IslandScene view={week.view} /></div>{/if}
  </section>
</main>

<style>
  .gal { padding: 16px 12px 140px; max-width: 100%; }
  h1 { font-size: var(--fs-h1); font-weight: 900; }
  h2 { font-size: var(--fs-h2); font-weight: 900; margin: 22px 0 6px; }
  .row { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 10px; padding: 18px 0 8px; border-bottom: 2px dashed var(--stitch); }
  .row.tight { padding-top: 10px; }
  .row b { width: 100%; font-size: var(--fs-caption); }
  code { font-size: .7rem; opacity: .7; }
  figure { margin: 0; display: grid; justify-items: center; gap: 2px; }
  figcaption { font-size: var(--fs-micro); color: var(--text-soft); }
  .tile { width: 48px; height: 48px; border-radius: 30%; display: grid; place-items: center; color: var(--c-ink); box-shadow: 0 3px 0 rgba(0,0,0,.12); }
  .tile svg { width: 28px; height: 28px; }
  .chip { min-height: 36px; padding: 0 10px; border-radius: 999px; border: 2px solid var(--edge); background: var(--surface); color: var(--text); font: inherit; font-size: var(--fs-caption); }
  .coinbtn { appearance: none; border: 0; background: none; padding: 0; }
  .sc { margin: 8px -12px 0; }
</style>
