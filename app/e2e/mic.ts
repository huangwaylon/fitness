// A stood-in mic for the speech test and 英語すごろく's speaking step (lib/speech/stt.ts): getUserMedia gives a real
// MediaStream, so MediaRecorder, the decode and the WAV run as on a phone: WebKit's own mock mic (the permission
// granted), else (Chromium) a quiet 220 Hz tone from its own AudioContext, never sent to the speakers: Chromium never
// asks for a real device (Chrome on a Mac with a mic waits on it forever, every take stuck at 話す; CI's has none). Like
// WebKit it refuses under an 'ambient' or 'playback' audio session (InvalidStateError: the bug of 2026-11-18, the
// island's 'ambient' refusing the mic in the home-screen app).
// `refuse`: every ask fails with that error's name (NotAllowedError: 許可しない).
// WebKit's MediaRecorder is watched too (its chunks kept, for heldFor): on a busy Mac it writes
// nothing for the first seconds of a take (stopped at the clock's 1.8 s: the blob empty, or 0.3 s; the flake hunt's
// red 「録音が短すぎた」, run 45359948146), so a take is held till its recording holds the sound, not by the clock.
import { expect, type Locator, type Page, type BrowserContext } from './fixtures.ts';

export async function standInMic(at: Page | BrowserContext, o: { refuse?: string } = {}): Promise<void> {
  const ctx = 'context' in at ? at.context() : at;
  await ctx.grantPermissions(['microphone']).catch(() => {});
  const webkit = ctx.browser()?.browserType().name() === 'webkit';
  await at.addInitScript(([refuse, webkit]) => {
    const real = webkit && typeof MediaDevices !== 'undefined' ? MediaDevices.prototype.getUserMedia : null;
    const w = window as unknown as { __mic: { asks: number; sess: string[]; streams: MediaStream[]; rec: MediaRecorder | null; parts: Blob[] } };
    w.__mic = { asks: 0, sess: [], streams: [], rec: null, parts: [] };
    if (webkit && typeof MediaRecorder !== 'undefined') {
      const start = MediaRecorder.prototype.start;
      MediaRecorder.prototype.start = function (this: MediaRecorder, ...a: [number?]) {
        const parts: Blob[] = [];
        w.__mic.rec = this, (w.__mic.parts = parts);
        this.addEventListener('dataavailable', (e) => parts.push(e.data));
        return start.apply(this, a);
      };
    }
    const gum = async function (this: MediaDevices | undefined): Promise<MediaStream> {
      const sess = (navigator as Navigator & { audioSession?: { type: string } }).audioSession?.type ?? 'none';
      w.__mic.asks++, w.__mic.sess.push(sess);
      if (refuse) throw new DOMException('stood-in refusal', refuse);
      if (sess === 'ambient' || sess === 'playback') throw new DOMException('AudioSession category is not compatible with audio capture.', 'InvalidStateError');
      const own = this && real ? await real.call(this, { audio: true }).catch(() => null) : null;
      if (own) return (w.__mic.streams.push(own), own);
      const c = new AudioContext();
      const osc = c.createOscillator(), g = c.createGain(), out = c.createMediaStreamDestination();
      osc.frequency.value = 220, (g.gain.value = 0.2);
      osc.connect(g).connect(out);
      osc.start();
      void c.resume();
      const s = out.stream;
      for (const t of s.getTracks()) {
        const stop = t.stop.bind(t);
        t.stop = () => (stop(), void c.close());
      }
      w.__mic.streams.push(s);
      return s;
    };
    // (on the prototype too: WebKit's navigator.mediaDevices, read early, isn't the page's later; none: given one)
    if (typeof MediaDevices !== 'undefined') MediaDevices.prototype.getUserMedia = gum;
    if (!navigator.mediaDevices) Object.defineProperty(navigator, 'mediaDevices', { value: { getUserMedia: gum }, configurable: true });
  }, [o.refuse ?? '', webkit] as const);
}

/** What the stood-in mic was asked: how often, and the page's audio session at each ask. */
export const micAsks = (page: Page) => page.evaluate(() => (window as unknown as { __mic: { asks: number; sess: string[] } }).__mic);

/** The stood-in mic's tracks still live (a page that let go of the mic: 0). */
export const liveTracks = (page: Page) =>
  page.evaluate(() => (window as unknown as { __mic: { streams: MediaStream[] } }).__mic.streams.flatMap((s) => s.getTracks()).filter((t) => t.readyState === 'live').length);

/** Wait till the take being recorded holds `s` seconds of sound. WebKit: its MediaRecorder asked for what it has so far
 *  (requestData: the page keeps that chunk with the rest, as with a timeslice) and the chunks decoded, as stt.ts
 *  decodes the take; not the stop button's clock 「（1.0 秒）」, as on a busy machine WebKit's recorder drops the first
 *  seconds (mbp3 at 16 workers: nothing written till the clock's 4.5 s, then the sound as it comes), and a take under
 *  0.3 s is sent as nothing (lib/speech/match.ts takeMiss); its own budget, past the expect timeout, for that start.
 *  Chromium (its mp4 muxer gives requestData nothing till the stop): the clock, its stood-in tone recorded as it plays. */
export async function heldFor(stop: Locator, s = 1): Promise<void> {
  const page = stop.page();
  const secs = async () => Number(/(\d+\.\d)/.exec((await stop.textContent()) ?? '')?.[1] ?? 0);
  if (page.context().browser()?.browserType().name() !== 'webkit') return void (await expect.poll(secs).toBeGreaterThanOrEqual(s));
  await expect.poll(secs).toBeGreaterThan(0);
  await expect.poll(() => page.evaluate(async () => {
    const { rec, parts } = (window as unknown as { __mic: { rec: MediaRecorder | null; parts: Blob[] } }).__mic;
    if (!rec || rec.state !== 'recording') return 0;
    await new Promise((done) => (rec.addEventListener('dataavailable', done, { once: true }), rec.requestData()));
    const blob = new Blob(parts, { type: rec.mimeType });
    if (!blob.size) return 0;
    return new OfflineAudioContext(1, 16_000, 16_000).decodeAudioData(await blob.arrayBuffer()).then((b) => b.duration, () => 0);
  }), { intervals: [100], timeout: 15_000 }).toBeGreaterThanOrEqual(s);
}
