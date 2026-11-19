// A stood-in mic for the speech test and 英語すごろく's speaking step (lib/speech/stt.ts): getUserMedia gives a real
// MediaStream, so MediaRecorder, the decode and the WAV run as on a phone: WebKit's own mock mic (the permission
// granted), else (Chromium, no device) a quiet 220 Hz tone from its own AudioContext, never sent to the speakers. Like
// WebKit it refuses under an 'ambient' or 'playback' audio session (InvalidStateError: the bug of 2026-11-18, the
// island's 'ambient' refusing the mic in the home-screen app).
// `refuse`: every ask fails with that error's name (NotAllowedError: 許可しない).
import { expect, type Locator, type Page, type BrowserContext } from './fixtures.ts';

export async function standInMic(at: Page | BrowserContext, o: { refuse?: string } = {}): Promise<void> {
  await ('context' in at ? at.context() : at).grantPermissions(['microphone']).catch(() => {});
  await at.addInitScript((refuse) => {
    const real = typeof MediaDevices !== 'undefined' ? MediaDevices.prototype.getUserMedia : null;
    const w = window as unknown as { __mic: { asks: number; sess: string[]; streams: MediaStream[] } };
    w.__mic = { asks: 0, sess: [], streams: [] };
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
  }, o.refuse ?? '');
}

/** What the stood-in mic was asked: how often, and the page's audio session at each ask. */
export const micAsks = (page: Page) => page.evaluate(() => (window as unknown as { __mic: { asks: number; sess: string[] } }).__mic);

/** The stood-in mic's tracks still live (a page that let go of the mic: 0). */
export const liveTracks = (page: Page) =>
  page.evaluate(() => (window as unknown as { __mic: { streams: MediaStream[] } }).__mic.streams.flatMap((s) => s.getTracks()).filter((t) => t.readyState === 'live').length);

/** Wait till the take's own clock (the stop button's 「（1.0 秒）」: a recorder starts a little late) passes `s` seconds: a take shorter than 0.3 s is
 *  sent as nothing (lib/speech/match.ts takeMiss). */
export async function heldFor(stop: Locator, s = 1): Promise<void> {
  await expect.poll(async () => Number(/(\d+\.\d)/.exec((await stop.textContent()) ?? '')?.[1] ?? 0)).toBeGreaterThanOrEqual(s);
}
