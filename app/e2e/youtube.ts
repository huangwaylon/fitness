// YouTube's embed, stood in for (docs/english.md "The player"): CI can't reach YouTube, so every request to
// youtube-nocookie.com (and i.ytimg.com's thumbnails) is answered here with a page that speaks the embed's postMessage protocol. It answers
// `listening` with onReady and then an infoDelivery every 100 ms ({currentTime, playerState}), plays at `rate`× real
// time from where it was sought, ends at `dur`, and keeps every command it got (with the time then) in window.__yt.
// `error`: an onError with that code instead (150: not embeddable). `silent`: never answers. `noPlay`: a play never starts. `rates`: the speeds offered.
// `tracks`: its caption tracks (language codes), reported (apiInfoDelivery: tracklist, track, translationLanguages) once
// the captions module is loaded and at each track set; none: captions never reported (the shape is undocumented).
import type { Frame, Page } from './fixtures.ts';

export interface FakeYt {
  rate?: number;
  dur?: number;
  error?: number;
  silent?: boolean;
  /** playVideo is ignored (iOS before a tap on the video itself). */
  noPlay?: boolean;
  /** The speeds it offers (availablePlaybackRates). */
  rates?: number[];
  /** Its caption tracks, reported once the module loads (none: never reported). */
  tracks?: string[];
}

const page = (o: Required<FakeYt>) => `<!doctype html><meta charset="utf-8"><body style="margin:0;background:#222;color:#eee;font:14px sans-serif">
<p id="t">fake youtube</p><script>
const RATE = ${o.rate}, DUR = ${o.dur}, ERROR = ${o.error}, SILENT = ${o.silent}, NO_PLAY = ${o.noPlay}, RATES = ${JSON.stringify(o.rates)}, TRACKS = ${JSON.stringify(o.tracks)};
let track = {};
const cc = () => TRACKS.length && send('apiInfoDelivery', { captions: { tracklist: TRACKS.map((l) => ({ languageCode: l })), track, translationLanguages: [{ languageCode: 'ja' }, { languageCode: 'fr' }] } });
let speed = 1;
let t = 0, st = -1, at = performance.now(), ready = false;
const yt = window.__yt = { cmds: [], videoId: location.pathname.split('/').pop(), search: location.search };
const now = () => (st === 1 ? Math.min(DUR, t + (performance.now() - at) / 1000 * RATE * speed) : t);
const send = (event, info) => parent.postMessage(JSON.stringify({ event, info, id: 1, channel: 'widget' }), '*');
const set = (s) => { t = now(); at = performance.now(); st = s; send('onStateChange', s); };
addEventListener('message', (e) => {
  let m; try { m = JSON.parse(e.data); } catch { return; }
  if (SILENT) return;
  if (m.event === 'listening' && !ready) {
    ready = true;
    send('onReady', {});
    if (ERROR) return send('onError', ERROR);
    setInterval(() => {
      if (st === 1 && now() >= DUR) { t = DUR; set(0); }
      send('infoDelivery', { currentTime: now(), playerState: st, duration: DUR, availablePlaybackRates: RATES, playbackRate: speed });
      document.getElementById('t').textContent = st + ' ' + now().toFixed(1);
    }, 100);
  } else if (m.event === 'command') {
    yt.cmds.push([m.func, m.args, Math.round(now() * 10) / 10]);
    if (m.func === 'seekTo') { t = m.args[0]; at = performance.now(); }
    else if (m.func === 'playVideo') { if (!NO_PLAY) set(1); }
    else if (m.func === 'pauseVideo') set(2);
    else if (m.func === 'setPlaybackRate') { t = now(); at = performance.now(); speed = m.args[0]; }
    else if (m.func === 'loadModule') cc();
    else if (m.func === 'setOption' && m.args[1] === 'track') { track = m.args[2]; cc(); }
  }
});
</script>`;

/** Answer the embed on this page with the stand-in player. */
export async function fakeYoutube(p: Page, opts: FakeYt = {}): Promise<void> {
  const o = { rate: 1, dur: 68, error: 0, silent: false, noPlay: false, rates: [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2], tracks: [], ...opts };
  await p.route('https://www.youtube-nocookie.com/**', (r) => r.fulfill({ status: 200, contentType: 'text/html', body: page(o) }));
  // the thumbnails (i.ytimg.com/vi/<id>/<size>.jpg): a still of the video's own colour, its id on it
  await p.route('https://i.ytimg.com/**', (r) => {
    const id = new URL(r.request().url()).pathname.split('/')[2] ?? '';
    const hue = [...id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);
    return r.fulfill({ status: 200, contentType: 'image/svg+xml', body: `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180"><rect width="320" height="180" fill="hsl(${hue} 45% 55%)"/><text x="160" y="100" font-size="28" text-anchor="middle" fill="#fff" font-family="sans-serif">${id}</text></svg>` });
  });
}

/** The embed's frame (once it's loaded). */
function ytFrame(p: Page): Frame | undefined {
  return p.frames().find((f) => f.url().startsWith('https://www.youtube-nocookie.com/'));
}

/** The commands the embed got so far: [func, args, its time then]. */
export async function ytCommands(p: Page): Promise<[string, unknown[], number][]> {
  const f = ytFrame(p);
  return f ? f.evaluate(() => (window as unknown as { __yt: { cmds: [string, unknown[], number][] } }).__yt.cmds) : [];
}
