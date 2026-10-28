<script lang="ts">
  // Dev gallery: every species × colourway × expression, Juniper, emotes, icons, and the island
  // in each season × day/night. Guarded by +page.ts (dev only).
  import Villager from '#lib/components/Villager.svelte';
  import { SPECIES, SPECIES_IDS, EXPRESSIONS } from '#lib/villagers/species.ts';
</script>

<main class="gal">
  <h1>Characters</h1>
  <section>
    <h2>Species × colourway</h2>
    {#each SPECIES_IDS as id (id)}
      <div class="row">
        <b>{SPECIES[id].nameJa}</b>
        {#each SPECIES[id].colourways as c (c.id)}
          <Villager species={id} colourway={c.id} size={110} />
        {/each}
        <Villager species={id} size={64} />
        <Villager species={id} size={22} />
      </div>
    {/each}
  </section>
  <section>
    <h2>Expressions</h2>
    {#each SPECIES_IDS as id (id)}
      <div class="row">
        {#each EXPRESSIONS as e (e)}
          <Villager species={id} expression={e} size={84} emote emoteHold />
        {/each}
      </div>
    {/each}
  </section>
</main>

<style>
  .gal { padding: 16px 12px 140px; max-width: 100%; }
  h1 { font-size: var(--fs-h1); font-weight: 900; }
  h2 { font-size: var(--fs-h2); font-weight: 900; margin: 18px 0 8px; }
  .row { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 10px; padding: 18px 0 6px; border-bottom: 2px dashed var(--stitch); }
  .row b { width: 100%; font-size: var(--fs-caption); }
</style>
