<script lang="ts">
  // Dev art gallery (style guide v4 §W, C18, C20): every official art key, the villager roster, しずえ poses,
  // the fallback silhouette, money marks, fruit ripeness stages, emotes, and the island in every
  // season × day/night. Guarded by +page.ts (dev only).
  import OfficialArt from '#lib/components/OfficialArt.svelte';
  import Villager from '#lib/components/Villager.svelte';
  import Host from '#lib/components/Host.svelte';
  import Silhouette from '#lib/components/Silhouette.svelte';
  import Emote from '#lib/components/Emote.svelte';
  import LeafCoin from '#lib/components/LeafCoin.svelte';
  import FruitRing from '#lib/components/FruitRing.svelte';
  import IslandScene from '#lib/components/IslandScene.svelte';
  import Fx from '#lib/components/Fx.svelte';
  import { REACTIONS as ICONS, POSES as POSE_IDS, MARKS, COLOUR_GLYPHS } from '#lib/components/art.ts';
  import { REACTIONS, REACTION_IDS } from '#lib/components/motion/reactions.ts';
  import { emit } from '#lib/components/motion/bus.svelte.ts';
  import { hostTap } from '#lib/components/motion/director.svelte.ts';
  import type { FxKind } from '#lib/components/Fx.svelte';
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
  const SCENES = [
    ...(['spring', 'summer', 'autumn', 'winter'] as const).flatMap((s) => [
      { s, tod: 'day' as const },
      { s, tod: 'night' as const }
    ]),
    { s: 'spring' as const, tod: 'day' as const, f: 'green' as const },
    { s: 'autumn' as const, tod: 'day' as const, f: 'green' as const },
    { s: 'spring' as const, tod: 'dawn' as const },
    { s: 'autumn' as const, tod: 'dusk' as const }
  ];
  const FX: FxKind[] = ['sparkles', 'hearts', 'notes', 'sweat', 'zzz', 'confetti', 'puff', 'glint'];
  let fxPlay = $state<{ k: FxKind; n: number } | null>(null);
  let fxN = 0;

  let replay = $state(0);
</script>

<main class="gal">
  <h1>Art gallery</h1>
  <p class="cap">{KEYS.length} official files · tap a villager to replay its hop</p>

  <section>
    <h2>Live island · reactions (§M.5) · events</h2>
    <p class="cap">Season / time: <code>?season=</code> <code>&amp;theme=night</code> · events: <code>?date=2026-04-03T10:00</code> (cherry), <code>2026-08-02T20:00</code> (fireworks), <code>2026-11-20T15:00</code> (maple), <code>2026-12-24T12:00</code> (Toy Day), <code>2026-12-31T23:00</code> (NYE), <code>T23:30</code> (naps)</p>
    <div class="live">
      {#if week.view}<div class="livescene"><IslandScene view={week.view} /></div>{/if}
      <div class="host"><Host size={96} /></div>
    </div>
    <div class="row btns">
      {#each REACTION_IDS as r (r)}
        <button type="button" class="chip" onclick={() => emit('dev:react', r)}>{r} {REACTIONS[r].name}</button>
      {/each}
      <button type="button" class="chip" onclick={() => emit('dev:balloon')}>balloon</button>
      <button type="button" class="chip" onclick={() => emit('dev:fireworks')}>fireworks</button>
      <button type="button" class="chip" onclick={hostTap}>tap しずえ</button>
    </div>
  </section>

  <section>
    <h2>Villager marks (floating, no disc; ours + official colour glyphs)</h2>
    <div class="row">
      {#each MARKS as id (id)}<figure><Emote id="mark-{id}" hold bare size={44} /><figcaption>mark-{id}</figcaption></figure>{/each}
      {#each COLOUR_GLYPHS as id (id)}<figure><Emote {id} hold bare size={44} /><figcaption>{id}</figcaption></figure>{/each}
    </div>
    <h2>Reaction icons (しずえ's bubble) · fx</h2>
    <div class="row">
      {#each ICONS as id (id)}<figure><Emote {id} hold size={44} /><figcaption>{id}</figcaption></figure>{/each}
      {#each POSE_IDS as id (id)}<figure><Emote id="pose-{id}" hold size={44} /><figcaption>pose-{id}</figcaption></figure>{/each}
    </div>
    <div class="row btns">
      {#each FX as k (k)}<button type="button" class="chip" onclick={() => (fxPlay = { k, n: ++fxN })}>{k}</button>{/each}
      <span class="fxstage">{#if fxPlay}{#key fxPlay.n}<Fx kind={fxPlay.k} spread="60px" />{/key}{/if}</span>
    </div>
  </section>

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
        <figure><Host pose={p} size={96} animate={false} /><figcaption>{p}</figcaption></figure>
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
    <h2>Island · season × time of day</h2>
    <div class="scenes">
      {#if week.view}
        {#each SCENES as sc (sc.s + sc.tod + ('f' in sc ? sc.f : ''))}
          <figure>
            <div class="sc"><IslandScene view={week.view} season={sc.s} foliage={'f' in sc ? sc.f : undefined} tod={sc.tod} live={false} /></div>
            <figcaption>{sc.s} · {sc.tod}{'f' in sc ? ` · ${sc.f} oaks` : ''}</figcaption>
          </figure>
        {/each}
      {/if}
    </div>
  </section>
</main>

<style>
  .gal { padding: 16px 12px 140px; max-width: 100%; }
  h1 { font-size: var(--fs-title); font-weight: 700; margin: 0; }
  h2 { font-size: var(--fs-talk); font-weight: 700; margin: 26px 0 8px; }
  .cap { color: var(--text-soft); font-size: var(--fs-s); margin: 4px 0 0; }
  section { border-bottom: 2px dashed var(--lip); padding-bottom: 12px; }
  .row { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 12px; padding: 14px 0 6px; }
  .row.tree { background: var(--c-leaf); border-radius: var(--r-card); padding: 10px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; }
  .grid.roster { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); }
  figure { margin: 0; display: grid; justify-items: center; align-content: end; gap: 4px; }
  figure .row { padding: 0; gap: 6px; align-items: flex-end; }
  figcaption { font-size: var(--fs-s); color: var(--text-soft); text-align: center; }
  code { font-size: .7rem; }
  .cell { width: 70px; height: 70px; display: grid; place-items: center; border-radius: 14px; background: var(--grass); }
  .tile { width: 56px; height: 56px; border-radius: 30%; display: grid; place-items: center; overflow: hidden; background: var(--c-mint); }
  .tile svg { width: 30px; height: 30px; color: var(--c-ink); }
  .amt { display: inline-flex; align-items: center; gap: 4px; font-family: var(--font-num); font-weight: 700; font-size: 1.25rem; }
  .plain { appearance: none; border: 0; background: none; padding: 0; cursor: pointer; }
  .scenes { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
  .live { display: flex; gap: 8px; align-items: flex-end; }
  .livescene { width: 393px; max-width: 100%; --scene-h: 520px; border-radius: 14px; overflow: hidden; }
  .btns { gap: 6px; }
  .chip { min-height: 44px; padding: 0 12px; border-radius: 999px; border: 2px solid var(--lip); background: var(--surface); color: var(--text); font: 700 12px var(--font-ui); }
  .fxstage { position: relative; display: inline-block; width: 120px; height: 120px; }
  .fxstage :global(.fx) { left: 60px; top: 70px; }
  .sc { width: 176px; aspect-ratio: 390 / 540; border: 2px solid var(--lip); border-radius: 14px; overflow: hidden; background: var(--bg); }
  /* Render at phone width, then zoom down, so the min tap sizes don't distort the thumbnail. */
  .sc > :global(*) { width: 390px; --scene-h: 540px; zoom: .441; }
  .scenes figure { align-content: start; }
</style>
