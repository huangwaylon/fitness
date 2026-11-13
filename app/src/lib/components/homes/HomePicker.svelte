<script lang="ts">
  // いえを かえる (docs/island-layout.md "Homes"): a home's look, its owner's to change any time: NH's player house or a
  // villager's (its shape, its wall, its roof, its door, each in its colours), the move-in tents, or the campsite's tent.
  // NH's own icons and each colour's swatch; the house itself turning in the preview as it's chosen. A look that would
  // not fit where the home stands (its door stays put: model.ts originOf) is refused here, so the island stays valid;
  // the change goes out as the home's `h` op (store/layout.svelte.ts), every phone's island and the editor live.
  import { onMount } from 'svelte';
  import Sheet from '../ui/Sheet.svelte';
  import { layout as islandLayout } from '#lib/store/layout.svelte.ts';
  import { HOME_IDS, SHAPES, catalogue, doorPartOf, partOf, type HomeStyle, type Who } from '#lib/layout/homes.ts';
  import { withChanges } from '#lib/layout/model.ts';
  import { validate } from '#lib/layout/validate.ts';
  import { cue } from '#lib/sound/cues.ts';
  import { i18n, t } from '#lib/i18n/index.ts';
  import '#lib/i18n/sheets.ts';

  let { open = $bindable(), who }: { open: boolean; who: Who } = $props();

  const cat = catalogue();
  const base = new URL('room/homes/', new URL(document.baseURI)).href;
  const MAT: Record<string, string> = {
    Stucco: '漆喰', Brick: 'レンガ', Metal: 'トタン', Woodsiding: '板張り', Log: '丸太', Stone: '石', Japanese: '和風', Oriental: 'オリエンタル',
    Wood: '木', Soil: '土', Standard: '普通', Woodframe: '木造', Tile: '瓦', Slate: 'スレート', Thatched: '茅葺き', Woodpanel: '板張り',
    Woodtile: 'こけら葺き', Stoneweight: '石置き', Westerntile: '洋瓦'
  };
  const DOOR: Record<string, string> = {
    Simple: 'シンプル', Standard: 'スタンダード', Simplicity: 'すっきり', Window: '窓', VerticalWindow: '縦窓', CercleWindow: '丸窓', Lattice: '格子',
    Iron: '鉄', IronGrill: 'アイアングリル', Ironparts: '金具', Relief: 'レリーフ', Carving: '彫り物', Chinese: '中華', Japanese: '和風'
  };
  /** A material's or a door's name: NH's Japanese, else its English key spaced out (Woodsiding → Wood siding). */
  const named = (ja: Record<string, string>, k: string) => (i18n.locale === 'ja' ? (ja[k] ?? k) : k.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^(\w)(\w*?)(siding|frame|panel|tile|weight)$/i, (_, a, b, c) => `${a}${b} ${c}`));
  const MODELS = ['house', 'tent-n', 'tent-p', 'campsite'] as const;
  const kebab = (s: string) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

  // the look being chosen (from the home's own)
  let style = $state<HomeStyle>({ m: 'campsite' });
  $effect(() => {
    if (open) style = { ...islandLayout.home(who) };
  });
  const wall = $derived(partOf('wall', style.w));
  const roof = $derived(partOf('roof', style.r));
  const door = $derived(doorPartOf(style.d));
  const shape = $derived(wall?.shape ?? 'PA04');

  function setModel(m: string) {
    if (m === 'house') {
      const s = style.m === 'house' ? style : { m: 'house', w: 'PA04Stucco.A', r: 'PA04Standard.A', d: 'Simple.R.A' };
      style = { ...s, m: 'house' };
    } else if (m === 'tent-n') style = { m: 'tent-n', w: style.m === 'tent-n' ? style.w : 'A' };
    else style = { m };
  }
  function setShape(sh: string) {
    const w = cat.walls[sh]?.[0], r = cat.roofs[sh]?.[0];
    if (!w || !r) return;
    style = { ...style, w: `${sh}${w.material}.${w.colours[0]}`, r: `${sh}${r.material}.${r.colours[0]}` };
  }
  const setWall = (material: string, colour: string) => (style = { ...style, w: `${shape}${material}.${colour}` });
  const setRoof = (material: string, colour: string) => (style = { ...style, r: `${shape}${material}.${colour}` });
  function setDoor(s: string, sh: 'R' | 'S', colour: string) {
    const e = cat.doors.find((d) => d.style === s);
    if (!e) return;
    const shp = e.shapes.includes(sh) ? sh : e.shapes[0];
    style = { ...style, d: `${s}.${shp}.${e.colours.includes(colour) ? colour : e.colours[0]}` };
  }

  // does it fit where the home stands?
  const same = $derived.by(() => {
    const h = islandLayout.home(who);
    return h.m === style.m && h.w === style.w && h.r === style.r && h.d === style.d && (h.f ?? null) === (style.f ?? null);
  });
  const fit = $derived.by(() => {
    const l = withChanges(islandLayout.current, { homes: { [who]: style } });
    const id = HOME_IDS[who];
    const bad = validate(l).filter((i) => i.level === 'error' && i.ids.includes(id) && ['overlap', 'off-land', 'on-water', 'split', 'door'].includes(i.code));
    return bad.length ? (i18n.locale === 'ja' ? bad[0].ja : bad[0].en) : null;
  });
  function choose() {
    if (same || fit) return;
    const op = { sc: 'h' as const, id: `h${who}` as 'hA' | 'hB' | 'hG', at: islandLayout.stamp(), m: style.m, ...(style.w ? { w: style.w } : {}), ...(style.r ? { r: style.r } : {}), ...(style.d ? { d: style.d } : {}), ...(style.f !== undefined ? { f: style.f } : {}) };
    islandLayout.apply([op]);
    cue('confirm');
    open = false;
  }

  // ---- the preview: the house turning ----
  let canvas = $state<HTMLCanvasElement>();
  let show: ((s: HomeStyle) => void) | null = null;
  /** The sway's frame rate: it only sways (±0.6 rad over ~16 s), where it drew every display frame. */
  const SWAY_FPS = 15;
  onMount(() => {
    // `?preview=0`: no 3D (the e2e: a software GL in CI)
    if (new URLSearchParams(location.search).get('preview') === '0') return;
    let gone = false, stop = () => {};
    void Promise.all([import('../world3d/threePreview.ts'), import('../world3d/home.ts'), import('../world3d/release.ts'), import('../world3d/stage.ts')]).then(([T, { buildHome, releaseHome, trimHomes }, { resourcesOf }, { createStage }]) => {
      if (gone || !canvas) return;
      const scene = new T.Scene();
      scene.add(new T.HemisphereLight(0xffffff, 0xd8e4c8, 2.6));
      const sun = new T.DirectionalLight(0xfff3df, 1.6);
      sun.position.set(-120, 220, 200);
      scene.add(sun);
      const cam = new T.PerspectiveCamera(30, 1, 10, 3000);
      const spin = new T.Group();
      scene.add(spin);
      const t0 = performance.now();
      let seq = 0;
      // (frames on demand, SWAY_FPS a second while there's a house to sway, none while the page is hidden: world3d/stage.ts)
      let stage: ReturnType<typeof createStage>;
      try {
        stage = createStage(canvas, { antialias: true, alpha: true }, (t) => {
          spin.rotation.y = Math.sin((t - t0) / 2600) * 0.6;
          if (!stage.noDraw) stage.renderer.render(scene, cam);
          return spin.children.length ? 1000 / SWAY_FPS : Infinity;
        }, (w, h) => {
          cam.aspect = w / h;
          cam.updateProjectionMatrix();
        });
      } catch {
        return;
      }
      // the houses shown and since swapped out (their models the island's cache: released with the rest at the end)
      const shown: ReturnType<typeof resourcesOf> = new Set();
      show = (s: HomeStyle) => {
        const n = ++seq;
        void buildHome(s, base).then((g) => {
          if (gone || n !== seq || !g) return releaseHome(g);
          resourcesOf(spin, shown);
          spin.children.forEach(releaseHome);
          spin.clear();
          // centred on its footprint's middle, the camera a little above, the whole house in view
          const box = new T.Box3().setFromObject(g), c = box.getCenter(new T.Vector3()), size = box.getSize(new T.Vector3());
          g.position.sub(new T.Vector3(c.x, box.min.y, c.z));
          spin.add(g);
          // (the look on show, for the e2e: set once a house is built, never per frame)
          if (canvas) canvas.dataset.shown = [s.m, s.w, s.r, s.d, s.f].filter((x) => x !== undefined).join(' ');
          const d = Math.max(size.x, size.y, size.z) * 2.4;
          cam.position.set(0, size.y * 0.9 + d * 0.35, d);
          cam.lookAt(0, size.y * 0.42, 0);
          stage.kick();
        });
      };
      show(style);
      // the cached models' geometries and textures let go of with the renderer: three's listeners on each kept this
      // renderer, its context and the sheet's whole DOM alive, one more each time the picker opened
      // (and the parts and colours shown let go of, but the island's homes': home.ts trimHomes)
      stop = () => {
        stage.dispose([scene], shown);
        spin.children.forEach(releaseHome);
        trimHomes(Object.values(islandLayout.current.homes));
      };
    });
    return () => {
      gone = true;
      stop();
    };
  });
  $effect(() => {
    const s = style;
    show?.({ ...s });
  });
</script>

<Sheet bind:open title={t('homes.title')} name="homes">
  <div class="pick" data-home-picker={who}>
    <div class="stage"><canvas bind:this={canvas} class="preview" data-home-preview aria-hidden="true"></canvas></div>
    <div class="chips" role="group" aria-label={t('homes.facing')}>
      <span class="lbl sec-label">{t('homes.facing')}</span>
      <button type="button" class="chip" data-sfx="tick" data-home-turn onclick={() => (style = { ...style, f: ((((style.f ?? islandLayout.current.objects.get(HOME_IDS[who])?.f ?? 0) + 1) % 4) as 0 | 1 | 2 | 3) })}>↻ {t('decor.turn')}</button>
    </div>
    <div class="chips" role="group" aria-label={t('homes.kind')}>
      {#each MODELS as m (m)}
        <button type="button" class="chip" data-sfx="tick" data-model={m} aria-pressed={style.m === m} onclick={() => setModel(m)}>{t(`homes.model.${m}`)}</button>
      {/each}
    </div>
    {#if style.m === 'tent-n'}
      <h3 class="sec-label">{t('homes.colour')}</h3>
      <div class="swatches">
        {#each ['A', 'B'] as c (c)}
          <button type="button" data-sfx="tick" class="sw" aria-label={c} aria-pressed={style.w === c} style:background-image={`url(${base}tent-n.${c}.swatch.webp)`} onclick={() => (style = { m: 'tent-n', w: c })}></button>
        {/each}
      </div>
    {:else if style.m === 'house'}
      <h3 class="sec-label">{t('homes.shape')}</h3>
      <div class="chips">
        {#each Object.entries(SHAPES) as [sh, s] (sh)}
          <button type="button" class="chip" data-sfx="tick" data-shape={sh} aria-pressed={shape === sh} onclick={() => setShape(sh)}>{i18n.locale === 'ja' ? s.ja : s.en}</button>
        {/each}
      </div>
      <h3 class="sec-label">{t('homes.wall')}</h3>
      {#each cat.walls[shape] ?? [] as w (w.material)}
        <div class="row">
          <span class="mat">{#if shape === 'PA04'}<img src={`${base}icon.wall-pa04-${kebab(w.material)}.webp`} alt="" />{/if}{named(MAT, w.material)}</span>
          <div class="swatches">
            {#each w.colours as c (c)}
              <button type="button" data-sfx="tick" class="sw" data-wall={`${w.material}.${c}`} aria-label={`${named(MAT, w.material)} ${c}`} aria-pressed={wall?.material === w.material && wall?.colour === c}
                style:background-image={`url(${base}wall-${shape.toLowerCase()}-${kebab(w.material)}.${c}.swatch.webp)`} onclick={() => setWall(w.material, c)}></button>
            {/each}
          </div>
        </div>
      {/each}
      <h3 class="sec-label">{t('homes.roof')}</h3>
      {#each cat.roofs[shape] ?? [] as r (r.material)}
        <div class="row">
          <span class="mat">{#if shape === 'PA04'}<img src={`${base}icon.roof-pa04-${kebab(r.material)}.webp`} alt="" />{/if}{named(MAT, r.material)}</span>
          <div class="swatches">
            {#each r.colours as c (c)}
              <button type="button" data-sfx="tick" class="sw" data-roof={`${r.material}.${c}`} aria-label={`${named(MAT, r.material)} ${c}`} aria-pressed={roof?.material === r.material && roof?.colour === c}
                style:background-image={`url(${base}roof-${shape.toLowerCase()}-${kebab(r.material)}.${c}.swatch.webp)`} onclick={() => setRoof(r.material, c)}></button>
            {/each}
          </div>
        </div>
      {/each}
      <h3 class="sec-label">{t('homes.door')}</h3>
      <div class="doors">
        {#each cat.doors as d (d.style)}
          <button type="button" data-sfx="tick" class="door" data-door={d.style} aria-pressed={door?.style === d.style} onclick={() => setDoor(d.style, door?.shape ?? 'R', door?.colour ?? 'A')}>
            <img src={`${base}icon.door-${kebab(d.style)}-${(door?.style === d.style ? door.shape : d.shapes[0]).toLowerCase()}.webp`} alt="" />
            <span>{named(DOOR, d.style)}</span>
          </button>
        {/each}
      </div>
      {#if door}
        {@const e = cat.doors.find((x) => x.style === door.style)}
        <div class="row">
          <div class="chips">
            {#each e?.shapes ?? [] as sh (sh)}
              <button type="button" class="chip" data-sfx="tick" aria-pressed={door.shape === sh} onclick={() => setDoor(door.style, sh, door.colour)}>{t(sh === 'R' ? 'homes.round' : 'homes.square')}</button>
            {/each}
          </div>
          <div class="swatches">
            {#each e?.colours ?? [] as c (c)}
              <button type="button" data-sfx="tick" class="sw" aria-label={c} aria-pressed={door.colour === c}
                style:background-image={`url(${base}door-${kebab(door.style)}-${door.shape.toLowerCase()}.${c}.swatch.webp)`} onclick={() => setDoor(door.style, door.shape, c)}></button>
            {/each}
          </div>
        </div>
      {/if}
    {/if}
  </div>
  {#snippet footer()}
    <div class="foot">
      {#if fit && !same}<p class="why" role="status">{t('homes.noFit', { why: fit })}</p>{/if}
      <button type="button" class="btn" data-home-choose data-sfx="self" aria-disabled={same || !!fit} onclick={choose}>{t('homes.choose')}</button>
    </div>
  {/snippet}
</Sheet>

<style>
  /* the sheet's skin: the chips (theme.css .chip), the swatches and doors as controls (the edge, yuzu when chosen) */
  .pick { display: flex; flex-direction: column; gap: 10px; padding-bottom: 12px; }
  /* the preview pinned under the title bar (Sheet .bar: 10 + 48 + 6 px and its 2 px margin;
     reaching 12 px up under the bar's fading foot, so no choice shows between the two) while the choices scroll under it, so each
     change shows at once (the user, 2026-11-10); its height in svh, steady as Safari's bars come and go, so a scroll
     never resizes the canvas. A short screen (landscape) has no room for it pinned: it scrolls with the rest. */
  .stage { position: sticky; top: 54px; z-index: 2; margin: -12px 0 -8px; padding: 12px 0 8px; background: linear-gradient(var(--surface) calc(100% - 8px), transparent); }
  @media (max-height: 560px) { .stage { position: static; } }
  .preview { width: 100%; height: clamp(150px, 27svh, 240px); border-radius: var(--r-card); background: linear-gradient(#bfe6ff, #e8f6d8); display: block; }
  .chips { align-items: center; }
  .lbl.sec-label { margin: 0 4px; }
  .row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .mat { display: inline-flex; align-items: center; gap: 4px; min-width: 88px; font: 700 var(--fs-s)/1.2 var(--font-ui); }
  .mat img { width: 28px; height: 28px; }
  .swatches { display: flex; flex-wrap: wrap; gap: 6px; }
  /* a 36px swatch in a 44px target */
  .sw {
    position: relative; width: 36px; height: 36px; border-radius: 50%; border: 0; padding: 0; cursor: pointer;
    background-size: cover; background-position: center; box-shadow: var(--sh-ctl);
  }
  .sw::after { content: ''; position: absolute; inset: -4px; }
  .sw[aria-pressed='true'] { outline: 3px solid var(--c-yuzu); outline-offset: 2px; }
  .doors { display: grid; grid-template-columns: repeat(auto-fill, minmax(76px, 1fr)); gap: 8px; }
  .door {
    appearance: none; border: 0; cursor: pointer; border-radius: var(--r-btn); display: flex; flex-direction: column; align-items: center; gap: 2px;
    padding: 6px 4px 8px; background: var(--ctl); color: var(--text); box-shadow: var(--sh-ctl); font: 700 var(--fs-s)/1.2 var(--font-ui);
  }
  .door[aria-pressed='true'] { background: var(--ctl-sel); color: var(--c-ink); }
  .door:active { transform: translateY(2px); box-shadow: var(--sh-ctl-press); }
  .door img { width: 44px; height: 44px; }
  .foot { display: flex; flex-direction: column; gap: 6px; align-items: stretch; }
  .why { margin: 0; font: 700 var(--fs-s)/1.4 var(--font-ui); color: var(--text); text-align: center; }
  .why::before { content: '! '; color: var(--c-coral); }
</style>
