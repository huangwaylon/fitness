// The probe left mid-measurement (closeProbe while a step awaits): no second context, no mic left open.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { closeProbe, duplex, openProbe, openRec, probeCtx } from './run.ts';

const node = () => ({ connect: (n: unknown) => n ?? node(), disconnect() {}, gain: { value: 1 }, frequency: { value: 0 }, start() {}, stop() {}, onaudioprocess: null as unknown, onended: null as unknown, buffer: null, type: '' });
let made = 0;
class FakeCtx {
  sampleRate = 48_000;
  currentTime = 0;
  destination = node();
  constructor() {
    made++;
  }
  resume = () => Promise.resolve();
  close = () => Promise.resolve();
  createMediaStreamSource = node;
  createScriptProcessor = node;
  createGain = node;
  createOscillator = node;
  createBufferSource = node;
}
let tracks: { stopped: boolean }[] = [];
let grant: () => void = () => {};
const stream = () => {
  const t = { stopped: false, label: '', stop() { t.stopped = true; } };
  tracks.push(t);
  return { getTracks: () => [t], getAudioTracks: () => [t] };
};

beforeEach(() => {
  made = 0;
  tracks = [];
  vi.useFakeTimers();
  vi.stubGlobal('AudioContext', FakeCtx);
  vi.stubGlobal('navigator', {
    mediaDevices: { getUserMedia: () => new Promise((r) => (grant = () => r(stream()))) }
  });
  openProbe();
});
afterEach(() => {
  closeProbe();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('the probe closed mid-step', () => {
  it('a capture whose permission arrives after the close lets its tracks go and throws', async () => {
    probeCtx();
    const rec = openRec({ aec: true });
    closeProbe();
    grant();
    await expect(rec).rejects.toThrow('closed');
    expect(tracks.map((t) => t.stopped)).toEqual([true]);
    expect(() => probeCtx()).toThrow('closed');
    expect(made).toBe(1);
  });

  it('duplex left during its noise floor: the take stopped, no second context or mic', async () => {
    probeCtx();
    const run = duplex({} as AudioBuffer, { click: true });
    const caught = run.catch((e: Error) => e.message);
    await vi.advanceTimersByTimeAsync(0);
    grant();
    await vi.advanceTimersByTimeAsync(100);
    closeProbe();
    expect(tracks.map((t) => t.stopped)).toEqual([true]);
    await vi.advanceTimersByTimeAsync(2_000);
    expect(await caught).toBe('closed');
    expect({ made, mics: tracks.length }).toEqual({ made: 1, mics: 1 });
  });

  it('opened again: a fresh context', () => {
    probeCtx();
    closeProbe();
    openProbe();
    probeCtx();
    expect(made).toBe(2);
  });
});
