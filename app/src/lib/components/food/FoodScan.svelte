<script lang="ts">
  // ごはん's barcode scanner (a level over a meal's search, 「バーコード」; docs/design.md "Gohan" Barcode): the back
  // camera live in a 4:3 black box, a guide band (four white corners, the rest dimmed), one status line, and the number
  // field with 検索 always under it (every camera failure's way on). The camera opens with the level (the tap that
  // pushed it: no screen before iOS's own prompt); a frame's band is read every TICK_MS (lib/scan: camera.ts, the
  // decoder decode.ts in its own chunk; this level is a chunk of its own too: Food's Lazy), never per frame. A read: the
  // frame frozen, the corners leaf for FLASH_MS, the camera off at once, then what the code is (scan.ts lookupCode: our
  // products, waited for, else Open Food Facts online; the code and the wait on one line): found, `onfound` (Food swaps
  // this level for the amount); not found or unreached, a line and もう一度 · 名前で探す. The products (lazy) are asked
  // for with the decoder, so a read soon after the open waits less. A code whose check digit fails never reads
  // (scanning goes on); a typed one says so under its field. 13 digits search at once.
  // The camera stops on every way out: the level left (‹, ✕, Esc, the sheet closed), the page hidden (and starts
  // again on the show, still reading), a code read, IDLE_MS without one (タップして再開 in the box); the decoder's
  // memory is let go with the level. Timings as performance marks (scan:open → scan:frame → scan:live → scan:read,
  // scan:decode), for the e2e and Web Inspector, and once a session as the log's perf.scan (lib/scan/timing.ts).
  import { onMount } from 'svelte';
  import { t } from '#lib/i18n/index.ts';
  import type { Item } from '#lib/food/index.ts';
  import { barcodeKeys, type Format } from '#lib/scan/barcode.ts';
  import { camFailOf, grabBand, openCamera, stopStream } from '#lib/scan/camera.ts';
  import { offLookup } from '#lib/scan/off.ts';
  import { decoder } from '#lib/scan/load.ts';
  import { ScanTiming } from '#lib/scan/timing.ts';
  import { log } from '#lib/sync/log.ts';
  import { foodDb, held } from './dbHold.svelte.ts';
  import { lookupCode } from './scan.ts';

  interface Props {
    /** A code's food (ours or Open Food Facts'): its amount. */
    onfound: (item: Item) => void;
    /** 名前で探す: back to the search, its field focused. */
    onbyname: () => void;
  }
  let { onfound, onbyname }: Props = $props();

  /** A frame read this often (ms): ~5 a second, enough to read within a second of aiming, a fraction of the battery
   *  and the main thread a per-frame read would take. */
  const TICK_MS = 180;
  /** The read's flash (the corners leaf), and how long before the hint changes to 少し離して. */
  const FLASH_MS = 150;
  const SLOW_MS = 8000;
  /** The camera stopped after this long live without a read (the battery: a phone left on the counter). */
  const IDLE_MS = 60_000;

  /** `start` the camera opening, `reading` live, `idle` stopped for IDLE_MS without a read (a tap starts it again),
   *  `look` a code read or typed (what it is being found: `wait`, the catalog's products `loading`, Open Food Facts
   *  asked `online`), `none` / `offline` / `late` nothing found. */
  let phase = $state<'start' | 'reading' | 'idle' | 'look' | 'none' | 'offline' | 'late'>('start');
  let look = $state<'wait' | 'loading' | 'online'>('wait');
  /** Why there's no camera (none: it's fine, or still opening). */
  let cam = $state<'denied' | 'nocam' | null>(null);
  let slow = $state(false);
  let flash = $state(false);
  let frozen = $state(false);
  let code = $state('');
  let typed = $state('');
  let bad = $state(false);

  let video: HTMLVideoElement | undefined = $state();
  let still: HTMLCanvasElement | undefined = $state();
  const work = typeof document === 'undefined' ? null : document.createElement('canvas');
  let stream: MediaStream | null = null;
  /** Each camera session's number: a stale one's frames and late stream are dropped. */
  let gen = 0;
  let tick: ReturnType<typeof setTimeout> | undefined;
  let slowT: ReturnType<typeof setTimeout> | undefined;
  let idleT: ReturnType<typeof setTimeout> | undefined;
  let flashT: ReturnType<typeof setTimeout> | undefined;
  const times = new ScanTiming();
  let alive = true;
  let decodes = 0;
  let released = false;

  const okLen = $derived(typed.length === 8 || typed.length === 12 || typed.length === 13);
  /** The status line: the camera's hint, or the code and what's being done with it (the result's own line). */
  const status = $derived(
    phase === 'look' ? (look === 'wait' ? code : `${code} · ${t(look === 'loading' ? 'food.loading' : 'food.scan.online')}`)
    : phase === 'none' ? t('food.scan.none')
    : phase === 'offline' ? t('food.scan.offline')
    : phase === 'late' ? t('food.scan.late')
    : cam || phase === 'idle' ? t('food.scan.typeInstead')
    : t(slow ? 'food.scan.far' : 'food.scan.aim')
  );

  async function start() {
    const my = ++gen;
    phase = 'start';
    cam = null;
    frozen = false;
    performance.mark('scan:open');
    times.open();
    const dec = decoder();
    dec.then((m) => m.warm()).catch(() => {});
    // (our products, lazy: in by the read, mostly; the search has usually asked already, and this is no second fetch)
    void foodDb().then((db) => db.wantMore(['off'])).catch(() => {});
    try {
      const s = await openCamera();
      if (my !== gen || !alive || !video) return stopStream(s);
      stream = s;
      video.srcObject = s;
      await video.play().catch(() => {});
      if (my !== gen) return;
      performance.mark('scan:frame');
      times.frame();
      phase = 'reading';
      clearTimeout(slowT);
      slowT = setTimeout(() => (slow = true), SLOW_MS);
      clearTimeout(idleT);
      idleT = setTimeout(() => {
        stop();
        phase = 'idle';
        times.end = 'idle';
      }, IDLE_MS);
      await dec;
      performance.mark('scan:live');
      loop(my);
    } catch (e) {
      if (my !== gen) return;
      // (the decoder not fetched, offline before its first use: no reading either)
      stop();
      cam = camFailOf(e) === 'denied' ? 'denied' : 'nocam';
      phase = 'reading';
    }
  }
  /** The camera off: every track stopped, the frame loop ended. */
  function stop() {
    gen++;
    clearTimeout(tick);
    clearTimeout(slowT);
    clearTimeout(idleT);
    stopStream(stream);
    stream = null;
    if (video) video.srcObject = null;
  }
  async function loop(my: number) {
    if (my !== gen || phase !== 'reading') return;
    if (video && work && document.visibilityState !== 'hidden') {
      const g0 = performance.now();
      const img = grabBand(video, work);
      const grab = performance.now() - g0;
      const m = img ? await decoder() : null;
      const t0 = performance.now();
      const r = m && img ? await m.decode(img).catch(() => null) : null;
      if (m && img) times.frameRead(grab, performance.now() - t0);
      // (the first few frames' decode times: the perf marks e2e reads)
      if (m && img && decodes++ < 3) performance.measure('scan:decode', { start: t0 });
      if (my !== gen) return;
      // (a misread, its check digit wrong: never a read)
      if (r && barcodeKeys(r.text, r.format).length) return void read(r.text, r.format, true);
    }
    tick = setTimeout(() => loop(my), TICK_MS);
  }
  /** The video's frame kept on screen (the camera about to stop). */
  function freeze() {
    if (!video?.videoWidth || !still) return;
    [still.width, still.height] = [video.videoWidth, video.videoHeight];
    still.getContext('2d')?.drawImage(video, 0, 0);
    frozen = true;
  }
  /** A code read (`seen`: by the camera, the flash) or typed: the camera off, then what it is. */
  async function read(raw: string, format: Format | undefined, seen: boolean) {
    const t0 = performance.now();
    if (seen) performance.mark('scan:read');
    if (seen) times.read();
    else times.end = 'typed';
    if (stream) freeze();
    stop();
    code = barcodeKeys(raw, format)[0] ?? raw;
    phase = 'look';
    look = 'wait';
    bad = false;
    // (the flash for its FLASH_MS, whatever the lookup is doing)
    flash = seen;
    clearTimeout(flashT);
    if (seen) flashT = setTimeout(() => (flash = false), FLASH_MS);
    const db = held.db ?? (await foodDb().catch(() => null));
    const hit = await lookupCode(raw, db, t('food.scan.offTrust'), format, (c) => {
      look = 'online';
      return offLookup(c, t('food.scan.offTrust'));
    }, () => (look = 'loading'));
    if (!alive || phase !== 'look') return;
    // (a quick answer waits out the flash: it's seen before the amount takes the scanner's place)
    await new Promise((r) => setTimeout(r, Math.max(0, FLASH_MS - (performance.now() - t0))));
    if (!alive) return;
    if (hit?.k === 'ours' || hit?.k === 'off') return onfound(hit.item);
    phase = hit?.k === 'offline' || hit?.k === 'late' ? hit.k : 'none';
  }
  function retry() {
    bad = false;
    slow = false;
    void start();
  }
  function onType(e: Event & { currentTarget: HTMLInputElement }) {
    const v = e.currentTarget.value.normalize('NFKC').replace(/\D/g, '').slice(0, 13);
    e.currentTarget.value = typed = v;
    bad = false;
    if (v.length === 13) submit();
  }
  function submit() {
    if (!okLen || phase === 'look') return;
    if (!barcodeKeys(typed).length) return void (bad = true);
    void read(typed, undefined, false);
  }

  onMount(() => {
    void start();
    const vis = () => {
      if (document.visibilityState === 'hidden') {
        if (stream || phase === 'start') stop();
        if (phase === 'start') phase = 'reading';
      } else if (phase === 'reading' && !cam && !stream) void start();
    };
    document.addEventListener('visibilitychange', vis);
    return () => {
      alive = false;
      stop();
      clearTimeout(flashT);
      log('perf.scan', times.fields());
      document.removeEventListener('visibilitychange', vis);
      if (!released) {
        released = true;
        void decoder().then((m) => m.release(), () => {});
      }
    };
  });
</script>

<div class="scan" data-food-scan-level data-phase={phase} data-cam={cam ?? undefined}>
  <div class="box">
    <video bind:this={video} playsinline muted autoplay aria-hidden="true"></video>
    <canvas bind:this={still} class="still" class:on={frozen} aria-hidden="true"></canvas>
    {#if phase === 'idle'}
      <button type="button" class="msg resume" data-sfx="tick" data-scan-idle onclick={retry}><b>{t('food.scan.resume')}</b></button>
    {:else if cam}
      <p class="msg" data-scan-cam={cam}><b>{t(cam === 'denied' ? 'food.scan.denied' : 'food.scan.noCam')}</b>{#if cam === 'denied'}<small>{t('food.scan.deniedHow')}</small>{/if}</p>
    {:else}
      <div class="band" class:hit={flash} aria-hidden="true"><i></i><i></i><i></i><i></i></div>
    {/if}
  </div>

  <p class="st" class:code={phase === 'look'} aria-live="polite" data-scan-status>{status}</p>
  {#if phase === 'none' || phase === 'offline' || phase === 'late'}
    <p class="num-line" data-scan-code>{code}</p>
    <div class="acts">
      <button type="button" class="btn paper small" data-sfx="tick" data-scan-retry onclick={retry}>{t('food.retry')}</button>
      <button type="button" class="btn small" data-sfx="page" data-scan-byname onclick={onbyname}>{t('food.scan.byName')}</button>
    </div>
  {/if}

  <form class="num" onsubmit={(e) => { e.preventDefault(); submit(); }}>
    <div class="row">
      <input class="field money" value={typed} inputmode="numeric" pattern="[0-9]*" enterkeyhint="search" autocomplete="off" maxlength="13" data-sfx="none"
        placeholder={t('food.scan.num')} aria-label={t('food.scan.numLabel')} aria-invalid={bad} aria-describedby={bad ? 'scan-bad' : undefined} data-scan-num oninput={onType} />
      <button type="submit" class="btn small" data-sfx="confirm" data-scan-find aria-disabled={!okLen || phase === 'look'}>{t('food.scan.find')}</button>
    </div>
    <!-- (a typed number's own error: the status line keeps the camera's and the lookup's) -->
    {#if bad}<p class="bad" id="scan-bad" role="alert" data-scan-bad>{t('food.scan.bad')}</p>{/if}
  </form>
</div>

<style>
  .scan { display: grid; grid-template-columns: minmax(0, 1fr); gap: var(--gap); padding-bottom: 8px; }
  /* the camera: black in both themes, 4:3, the video cover-fitted; the band's shadow dims the rest */
  .box { position: relative; aspect-ratio: 4 / 3; border-radius: var(--r-row); background: #000; overflow: hidden; }
  video, .still { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
  .still { display: none; }
  .still.on { display: block; }
  .band {
    position: absolute; left: 8%; right: 8%; top: 31%; bottom: 31%; border-radius: var(--r-chip);
    box-shadow: 0 0 0 999px rgba(0, 0, 0, .45); --cn: #fff;
  }
  .band.hit { --cn: var(--c-leaf); background: color-mix(in srgb, var(--c-leaf) 25%, transparent); }
  .band i { position: absolute; width: 22px; height: 22px; border: 0 solid var(--cn); }
  .band i:nth-child(1) { top: 0; left: 0; border-width: 3px 0 0 3px; border-top-left-radius: var(--r-chip); }
  .band i:nth-child(2) { top: 0; right: 0; border-width: 3px 3px 0 0; border-top-right-radius: var(--r-chip); }
  .band i:nth-child(3) { bottom: 0; left: 0; border-width: 0 0 3px 3px; border-bottom-left-radius: var(--r-chip); }
  .band i:nth-child(4) { bottom: 0; right: 0; border-width: 0 3px 3px 0; border-bottom-right-radius: var(--r-chip); }
  .msg {
    position: absolute; inset: 0; margin: 0; padding: 0 16px; display: grid; place-content: center; gap: 6px; text-align: center;
    color: #fff; font: 700 var(--fs-body)/1.4 var(--font-ui);
  }
  .msg b { font-weight: inherit; }
  /* the idle stop: the whole box the tap that starts the camera again */
  .resume { appearance: none; width: 100%; border: 0; background: rgba(0, 0, 0, .55); cursor: pointer; -webkit-tap-highlight-color: transparent; }
  .resume:focus-visible { outline: 3px solid var(--focus); outline-offset: -3px; }
  .msg small { font-size: var(--fs-s); font-weight: 500; }
  /* ごはん's note: 13, 700, soft (the search's 読み込み中, the amount's trust line) */
  .st { margin: 0; min-height: 1.4em; text-align: center; font-size: var(--fs-s); font-weight: 700; line-height: 1.4; color: var(--text-soft); }
  /* the code (and what's being done with it): the num-line's type */
  .st.code, .num-line { font: 600 var(--fs-s)/1.4 var(--font-num); }
  .num-line { margin: -8px 0 0; text-align: center; color: var(--text-soft); }
  /* ごはん's pair (the editors' and the amount's foot): the paper hugs its word, the action takes the rest */
  .acts { display: flex; gap: 8px; }
  .acts .btn { margin: 0; }
  .acts .btn:not(.paper) { flex: 1; }
  .num { display: grid; gap: 6px; margin: 0; }
  .row { display: flex; gap: 8px; align-items: center; }
  .bad { margin: 0 12px; font-size: var(--fs-s); font-weight: 700; line-height: 1.4; color: var(--coral-text); }
  .field {
    flex: 1; min-width: 0; height: var(--hit); padding: 0 12px; border: 0; border-radius: var(--r-pill); background: var(--ctl);
    box-shadow: var(--sh-ctl); color: var(--text); font: 600 var(--fs-input)/1 var(--font-num); outline: none; appearance: none;
  }
  .field::placeholder { color: color-mix(in srgb, var(--text-soft) 70%, transparent); font: 500 var(--fs-input)/1 var(--font-ui); }
  .field:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  .row .btn { margin: 0; flex: none; }
  /* (disabled, level with the field: not the kit's sunk 4px) */
  .row .btn[aria-disabled='true'] { transform: none; }
</style>
