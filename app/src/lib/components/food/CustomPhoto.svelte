<script lang="ts">
  // A マイ食品's picture in its editor (docs/design.md "Gohan"; docs/food-data.md "Pictures"): a 96 px box at the top,
  // 「写真を追加」 (iOS's own sheet: Photo Library, Take Photo, Choose File: no `capture`, which would hide the library).
  // Picked: the crop, a square over the photo, slid along its long side by a drag (or ← →), 「この範囲にする」 making the
  // 384 px picture (lib/food/photo.ts), 「やめる」 leaving it as it was. Set: a tap on the box offers 「写真を変える」 and
  // 「写真を削除」. Nothing is kept until the food's 保存 (CustomFlow). Read-only (someone else's): the picture alone.
  import { t } from '#lib/i18n/index.ts';
  import { count } from '#lib/sync/log.ts';
  import { decodePhoto, makePhoto } from '#lib/food/photo.ts';
  import { picCell } from './customPics.svelte.ts';
  import FoodThumb from './FoodThumb.svelte';
  import Phrases from '../ui/Phrases.svelte';

  interface Props {
    /** The picture now (`blob`: one just made, not saved yet). */
    photo: { img: string; blob?: Blob } | null;
    name: string;
    readonly?: boolean;
    onchange?: (p: { blob: Blob; id: string } | null) => void;
  }
  let { photo, name, readonly = false, onchange }: Props = $props();

  const BOX = 96;
  let input: HTMLInputElement | undefined = $state();
  let menu = $state(false);
  let bad = $state(false);
  let busy = $state(false);
  /** The crop under way: the decoded photo, its size, where its square sits (0…1 along the long side). */
  let crop = $state.raw<{ im: HTMLImageElement; url: string; w: number; h: number } | null>(null);
  let at = $state(0.5);
  /** The last photo's times in ms (the decode; the square drawn and encoded) and its bytes: e2e and Web Inspector. */
  let ms = $state<{ dec: number; make: number; b: number } | null>(null);
  let dec = 0;

  /** A just-made photo's preview (its object URL, let go with it). */
  const blobUrl = $derived(photo?.blob ? URL.createObjectURL(photo.blob) : null);
  $effect(() => {
    const u = blobUrl;
    return () => void (u && URL.revokeObjectURL(u));
  });
  const cell = $derived(photo && !photo.blob ? picCell(photo.img) : null);

  function pick() {
    menu = false;
    bad = false;
    input?.click();
  }
  let t0 = 0;
  async function picked(e: Event & { currentTarget: HTMLInputElement }) {
    const f = e.currentTarget.files?.[0];
    e.currentTarget.value = '';
    if (!f) return;
    menu = false;
    t0 = performance.now();
    busy = true;
    const d = await decodePhoto(f);
    busy = false;
    if (!d) return fail('decode');
    dec = Math.round(performance.now() - t0);
    at = 0.5;
    crop = d;
  }
  function fail(why: 'decode' | 'encode') {
    bad = true;
    count(`act:food.photo.fail.${why}`);
  }
  function close() {
    if (crop) URL.revokeObjectURL(crop.url);
    crop = null;
  }
  async function use() {
    if (!crop || busy) return;
    busy = true;
    const c = crop, t1 = performance.now();
    const p = await makePhoto(c.im, c.w, c.h, at);
    busy = false;
    close();
    if (!p) return fail('encode');
    ms = { dec, make: Math.round(performance.now() - t1), b: p.blob.size };
    onchange?.(p);
  }

  // the crop's frame and the photo inside it: the short side fills the frame, the long side slides
  const F = 240;
  const wide = $derived(!!crop && crop.w >= crop.h);
  const long = $derived(crop ? (F * Math.max(crop.w, crop.h)) / Math.min(crop.w, crop.h) : F);
  const shift = $derived(-(long - F) * at);
  let drag: { x: number; at: number } | null = null;
  function down(e: PointerEvent) {
    drag = { x: wide ? e.clientX : e.clientY, at };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }
  function move(e: PointerEvent) {
    if (!drag || long <= F) return;
    at = Math.min(1, Math.max(0, drag.at - ((wide ? e.clientX : e.clientY) - drag.x) / (long - F)));
  }
  function key(e: KeyboardEvent) {
    const d = { ArrowLeft: -0.1, ArrowUp: -0.1, ArrowRight: 0.1, ArrowDown: 0.1 }[e.key];
    if (d === undefined) return;
    e.preventDefault();
    at = Math.min(1, Math.max(0, at + d));
  }
</script>

<div class="ph" data-custom-photo={photo ? (photo.blob ? 'new' : 'set') : 'none'} data-photo-ms={ms ? `${ms.dec},${ms.make},${ms.b}` : undefined}>
  {#if crop}
    <div class="crop" data-photo-crop>
      <div class="frame" style:--f="{F}px" role="slider" tabindex="0" data-sfx="none" aria-label={t('food.photo.drag')} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(at * 100)}
        onpointerdown={down} onpointermove={move} onpointerup={() => (drag = null)} onpointercancel={() => (drag = null)} onkeydown={key}>
        <img src={crop.url} alt="" draggable="false" style:width={wide ? `${long}px` : `${F}px`} style:height={wide ? `${F}px` : `${long}px`}
          style:transform={wide ? `translateX(${shift}px)` : `translateY(${shift}px)`} />
      </div>
      <p class="hint"><Phrases text={t('food.photo.drag')} /></p>
      <div class="acts">
        <button type="button" class="btn paper small" data-sfx="back" data-photo-cancel onclick={close}>{t('food.photo.cancel')}</button>
        <button type="button" class="btn small" data-sfx="confirm" data-photo-use aria-disabled={busy} onclick={use}>{t('food.photo.use')}</button>
      </div>
    </div>
  {:else if readonly}
    {#if cell}<FoodThumb size={BOX} img={cell} alt={t('food.photo.of', { name })} />{/if}
  {:else}
    <div class="row">
      {#if photo}
        <button type="button" class="box set" data-sfx="page" data-photo-box aria-expanded={menu} aria-label={t('food.photo.edit')} onclick={() => (menu = !menu)}>
          <FoodThumb size={BOX} img={cell} src={blobUrl} alt={t('food.photo.of', { name })} />
        </button>
        {#if menu}
          <div class="menu">
            <button type="button" class="btn paper small" data-sfx="page" data-photo-change onclick={pick}>{t('food.photo.change')}</button>
            <button type="button" class="btn paper small" data-sfx="tick" data-photo-remove onclick={() => ((menu = false), onchange?.(null))}>{t('food.photo.remove')}</button>
          </div>
        {/if}
      {:else}
        <button type="button" class="box add" data-sfx="page" data-photo-box aria-busy={busy} onclick={pick}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h3l1.5-2h7L17 8h3v11H4z M12 10.5a3 3 0 1 0 0 6a3 3 0 1 0 0-6z" /></svg>
          <span>{t('food.photo.add')}</span>
        </button>
      {/if}
    </div>
    {#if bad}<p class="hint bad" role="alert" data-photo-bad><Phrases text={t('food.photo.bad')} /></p>{/if}
    <input bind:this={input} type="file" accept="image/*" hidden data-sfx="none" data-photo-input onchange={picked} />
  {/if}
</div>

<style>
  .ph { display: grid; gap: 8px; justify-items: start; }
  .row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
  .box { appearance: none; padding: 0; border: 0; background: none; cursor: pointer; border-radius: 24px; display: grid; }
  .box.add {
    width: 96px; height: 96px; place-content: center; justify-items: center; gap: 4px; border-radius: 24px;
    border: 2px dashed color-mix(in srgb, var(--c-edge) 55%, transparent); color: var(--text-soft);
    background: color-mix(in srgb, var(--lip) 18%, transparent); font: 700 var(--fs-xs)/1.2 var(--font-ui);
  }
  .box.add svg { width: 28px; height: 28px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linejoin: round; }
  .menu { display: grid; gap: 8px; }
  .crop { display: grid; gap: 8px; justify-items: center; width: 100%; }
  .frame {
    position: relative; width: min(var(--f), 100%); aspect-ratio: 1; overflow: hidden; border-radius: 24px; touch-action: none; cursor: grab;
    box-shadow: inset 0 0 0 2px var(--c-edge), 0 var(--lip-s) 0 color-mix(in srgb, var(--c-edge) 60%, transparent);
  }
  .frame img { position: absolute; left: 0; top: 0; max-width: none; user-select: none; -webkit-user-drag: none; pointer-events: none; }
  .frame:focus-visible { outline: 3px solid var(--focus, var(--c-edge)); outline-offset: 2px; }
  .acts { display: flex; gap: 8px; }
  .hint { margin: 0 2px; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); line-height: var(--lh); }
  .hint.bad { color: var(--coral-text); }
</style>
