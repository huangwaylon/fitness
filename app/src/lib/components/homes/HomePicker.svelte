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

  let { open = $bindable(), who }: { open: boolean; who: Who } = $props();

  const cat = catalogue();
  const base = new URL('room/homes/', new URL(document.baseURI)).href;
  const MAT: Record<string, string> = {
    Stucco: 'しっくい', Brick: 'レンガ', Metal: 'トタン', Woodsiding: 'いたばり', Log: 'まるた', Stone: 'いし', Japanese: 'わふう', Oriental: 'オリエンタル',
    Wood: 'き', Soil: 'つち', Standard: 'ふつう', Woodframe: 'もくぞう', Tile: 'かわら', Slate: 'スレート', Thatched: 'かやぶき', Woodpanel: 'いたばり',
    Woodtile: 'こけらぶき', Stoneweight: 'いしおき', Westerntile: 'ようがわら'
  };
  const DOOR: Record<string, string> = {
    Simple: 'シンプル', Standard: 'スタンダード', Simplicity: 'すっきり', Window: 'まど', VerticalWindow: 'たてまど', CercleWindow: 'まるまど', Lattice: 'こうし',
    Iron: 'てつ', IronGrill: 'アイアングリル', Ironparts: 'かなぐ', Relief: 'レリーフ', Carving: 'ほりもの', Chinese: 'ちゅうか', Japanese: 'わふう'
  };
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
    return bad.length ? bad[0].ja : null;
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
  onMount(() => {
    // `?preview=0`: no 3D (the e2e: a software GL in CI)
    if (new URLSearchParams(location.search).get('preview') === '0') return;
    let gone = false, stop = () => {};
    void Promise.all([import('three'), import('../world3d/home.ts')]).then(([T, { buildHome }]) => {
      if (gone || !canvas) return;
      let renderer: InstanceType<typeof T.WebGLRenderer>;
      try {
        renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true });
      } catch {
        return;
      }
      renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
      renderer.outputColorSpace = T.SRGBColorSpace;
      const scene = new T.Scene();
      scene.add(new T.HemisphereLight(0xffffff, 0xd8e4c8, 2.6));
      const sun = new T.DirectionalLight(0xfff3df, 1.6);
      sun.position.set(-120, 220, 200);
      scene.add(sun);
      const cam = new T.PerspectiveCamera(30, 1, 10, 3000);
      const spin = new T.Group();
      scene.add(spin);
      let raf = 0, t0 = performance.now(), seq = 0;
      // (its size from a ResizeObserver: read in the frame, it forced a layout each one)
      const ro = new ResizeObserver(() => {
        const r = canvas!.getBoundingClientRect();
        renderer.setSize(r.width, r.height, false);
        cam.aspect = r.width / Math.max(1, r.height);
        cam.updateProjectionMatrix();
      });
      ro.observe(canvas);
      const frame = (t: number) => {
        raf = requestAnimationFrame(frame);
        spin.rotation.y = Math.sin((t - t0) / 2600) * 0.6;
        renderer.render(scene, cam);
      };
      raf = requestAnimationFrame(frame);
      show = (s: HomeStyle) => {
        const n = ++seq;
        void buildHome(s, base).then((g) => {
          if (gone || n !== seq || !g) return;
          spin.clear();
          // centred on its footprint's middle, the camera a little above, the whole house in view
          const box = new T.Box3().setFromObject(g), c = box.getCenter(new T.Vector3()), size = box.getSize(new T.Vector3());
          g.position.sub(new T.Vector3(c.x, box.min.y, c.z));
          spin.add(g);
          const d = Math.max(size.x, size.y, size.z) * 2.4;
          cam.position.set(0, size.y * 0.9 + d * 0.35, d);
          cam.lookAt(0, size.y * 0.42, 0);
        });
      };
      show(style);
      stop = () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
        renderer.dispose();
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

<Sheet bind:open label="いえを かえる" title="いえを かえる">
  <div class="pick" data-home-picker={who}>
    <canvas bind:this={canvas} class="preview" aria-hidden="true"></canvas>
    <div class="seg" role="group" aria-label="むき">
      <span class="lbl">むき</span>
      <button type="button" data-sfx="tick" data-home-turn onclick={() => (style = { ...style, f: ((((style.f ?? islandLayout.current.objects.get(HOME_IDS[who])?.f ?? 0) + 1) % 4) as 0 | 1 | 2 | 3) })}>↻ まわす</button>
    </div>
    <div class="seg" role="group" aria-label="かたち">
      {#each [['house', 'いえ'], ['tent-n', 'テント'], ['tent-p', 'ちいさなテント'], ['campsite', 'キャンプのテント']] as [m, name] (m)}
        <button type="button" data-sfx="tick" data-model={m} aria-pressed={style.m === m} onclick={() => setModel(m)}>{name}</button>
      {/each}
    </div>
    {#if style.m === 'tent-n'}
      <h3>いろ</h3>
      <div class="swatches">
        {#each ['A', 'B'] as c (c)}
          <button type="button" data-sfx="tick" class="sw" aria-label={c} aria-pressed={style.w === c} style:background-image={`url(${base}tent-n.${c}.swatch.webp)`} onclick={() => (style = { m: 'tent-n', w: c })}></button>
        {/each}
      </div>
    {:else if style.m === 'house'}
      <h3>いえの かたち</h3>
      <div class="chips">
        {#each Object.entries(SHAPES) as [sh, s] (sh)}
          <button type="button" data-sfx="tick" data-shape={sh} aria-pressed={shape === sh} onclick={() => setShape(sh)}>{s.ja}</button>
        {/each}
      </div>
      <h3>かべ</h3>
      {#each cat.walls[shape] ?? [] as w (w.material)}
        <div class="row">
          <span class="mat">{#if shape === 'PA04'}<img src={`${base}icon.wall-pa04-${kebab(w.material)}.webp`} alt="" />{/if}{MAT[w.material] ?? w.material}</span>
          <div class="swatches">
            {#each w.colours as c (c)}
              <button type="button" data-sfx="tick" class="sw" data-wall={`${w.material}.${c}`} aria-label={`${MAT[w.material] ?? w.material} ${c}`} aria-pressed={wall?.material === w.material && wall?.colour === c}
                style:background-image={`url(${base}wall-${shape.toLowerCase()}-${kebab(w.material)}.${c}.swatch.webp)`} onclick={() => setWall(w.material, c)}></button>
            {/each}
          </div>
        </div>
      {/each}
      <h3>やね</h3>
      {#each cat.roofs[shape] ?? [] as r (r.material)}
        <div class="row">
          <span class="mat">{#if shape === 'PA04'}<img src={`${base}icon.roof-pa04-${kebab(r.material)}.webp`} alt="" />{/if}{MAT[r.material] ?? r.material}</span>
          <div class="swatches">
            {#each r.colours as c (c)}
              <button type="button" data-sfx="tick" class="sw" data-roof={`${r.material}.${c}`} aria-label={`${MAT[r.material] ?? r.material} ${c}`} aria-pressed={roof?.material === r.material && roof?.colour === c}
                style:background-image={`url(${base}roof-${shape.toLowerCase()}-${kebab(r.material)}.${c}.swatch.webp)`} onclick={() => setRoof(r.material, c)}></button>
            {/each}
          </div>
        </div>
      {/each}
      <h3>ドア</h3>
      <div class="doors">
        {#each cat.doors as d (d.style)}
          <button type="button" data-sfx="tick" class="door" data-door={d.style} aria-pressed={door?.style === d.style} onclick={() => setDoor(d.style, door?.shape ?? 'R', door?.colour ?? 'A')}>
            <img src={`${base}icon.door-${kebab(d.style)}-${(door?.style === d.style ? door.shape : d.shapes[0]).toLowerCase()}.webp`} alt="" />
            <span>{DOOR[d.style] ?? d.style}</span>
          </button>
        {/each}
      </div>
      {#if door}
        {@const e = cat.doors.find((x) => x.style === door.style)}
        <div class="row">
          <div class="seg small">
            {#each e?.shapes ?? [] as sh (sh)}
              <button type="button" data-sfx="tick" aria-pressed={door.shape === sh} onclick={() => setDoor(door.style, sh, door.colour)}>{sh === 'R' ? 'まるい' : 'しかく'}</button>
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
      {#if fit && !same}<p class="why" role="status">{fit}（ここには おけません）</p>{/if}
      <button type="button" class="ok" data-home-choose data-sfx="self" aria-disabled={same || !!fit} onclick={choose}>これにする</button>
    </div>
  {/snippet}
</Sheet>

<style>
  .pick { display: flex; flex-direction: column; gap: 8px; padding: 0 4px 12px; }
  .preview { width: 100%; height: 190px; border-radius: 18px; background: linear-gradient(#bfe6ff, #e8f6d8); display: block; }
  h3 { margin: 6px 0 0; font-size: var(--fs-s, 13px); color: var(--text-soft); }
  .seg, .chips { display: flex; flex-wrap: wrap; gap: 6px; }
  .seg button, .chips button, .door {
    font: inherit; font-weight: 700; font-size: 13px; border: 2px solid var(--c-edge); background: var(--c-card); color: var(--c-ink); border-radius: 999px; padding: 6px 12px;
  }
  .seg button[aria-pressed='true'], .chips button[aria-pressed='true'], .door[aria-pressed='true'] { background: var(--c-yuzu); }
  .seg.small button { padding: 4px 10px; font-size: 12px; }
  .lbl { align-self: center; font-size: 13px; color: var(--text-soft); }
  .row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .mat { display: inline-flex; align-items: center; gap: 4px; min-width: 88px; font-size: 13px; font-weight: 700; }
  .mat img { width: 28px; height: 28px; }
  .swatches { display: flex; flex-wrap: wrap; gap: 6px; }
  .sw { width: 30px; height: 30px; border-radius: 50%; border: 2px solid var(--c-edge); background-size: cover; background-position: center; padding: 0; }
  .sw[aria-pressed='true'] { outline: 3px solid var(--c-yuzu); outline-offset: 1px; }
  .doors { display: grid; grid-template-columns: repeat(auto-fill, minmax(72px, 1fr)); gap: 6px; }
  .door { border-radius: 14px; display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 4px; font-size: 11px; }
  .door img { width: 44px; height: 44px; }
  .foot { display: flex; flex-direction: column; gap: 6px; align-items: stretch; }
  .why { margin: 0; font-size: 12px; color: #a23a26; text-align: center; }
  .ok { font: inherit; font-weight: 700; font-size: 18px; border: 2px solid var(--c-leaf-edge); background: var(--c-leaf); color: #fff; border-radius: 999px; padding: 10px; }
  .ok[aria-disabled='true'] { opacity: 0.5; }
</style>
