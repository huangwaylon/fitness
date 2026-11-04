import { describe, expect, it } from 'vitest';
import { pacer, type PaceClock } from './pace.ts';

/** A page's clock, simulated: timers fire on time (+ `late` ms), and a rAF asked for at `t` runs on the display's next
 *  vsync (60 Hz), or at once (`atOnce`: WebKit with nothing else drawing, its first rAF after an idle spell). */
function sim(atOnce: boolean, late = 1) {
  let t = 0;
  const q: { at: number; fn: (t: number) => void; id: number; raf?: true }[] = [];
  let id = 0, lastRaf = -1e9;
  const clock: PaceClock = {
    raf(fn) {
      const vsync = Math.ceil((t + 0.01) / (1000 / 60)) * (1000 / 60);
      // (at once only after an idle spell: a rAF asked for from a rAF waits for the vsync)
      const at = atOnce && t - lastRaf > 20 ? t + 0.5 : vsync;
      q.push({ at, fn, id: ++id, raf: true });
      return id;
    },
    caf: (i) => void q.splice(q.findIndex((e) => e.id === i) >>> 0, 1),
    setTimeout(fn, ms) {
      q.push({ at: t + Math.max(0, ms) + late, fn: () => fn(), id: ++id });
      return id;
    },
    clearTimeout: (i) => void q.splice(q.findIndex((e) => e.id === i) >>> 0, 1),
    now: () => t
  };
  return {
    clock,
    run(ms: number) {
      while (q.length) {
        q.sort((a, b) => a.at - b.at);
        if (q[0].at > ms) break;
        const e = q.shift()!;
        t = e.at;
        if (e.raf) lastRaf = t;
        e.fn(t);
      }
      t = Math.max(t, ms);
    }
  };
}

describe('pacer', () => {
  it('the ambience at 30 a second, never faster, the rAF at once or at a vsync', () => {
    const bad: string[] = [];
    for (const atOnce of [false, true]) for (const late of [0, 1, 4]) {
      const s = sim(atOnce, late), drawn: number[] = [];
      const p = pacer((v) => {
        if (!p.due(v, 30)) return;
        drawn.push(v);
        p.later(30);
      }, s.clock);
      p.kick();
      s.run(6000);
      const fps = (drawn.length - 1) / ((drawn[drawn.length - 1] - drawn[0]) / 1000);
      const gaps = drawn.slice(1).map((d, i) => d - drawn[i]);
      if (Math.abs(fps - 30) > 0.3 || Math.min(...gaps) < 26) bad.push(`atOnce ${atOnce} late ${late}: ${fps.toFixed(2)} fps, min gap ${Math.min(...gaps).toFixed(1)}`);
    }
    expect(bad).toEqual([]);
  });

  it('a kick draws on the next display frame; at the full rate every other vsync at 30', () => {
    const s = sim(false), drawn: number[] = [];
    let n = 0;
    const p = pacer((v) => {
      if (!p.due(v, 30)) return;
      drawn.push(v);
      if (++n < 30) p.kick();
    }, s.clock);
    p.kick();
    s.run(2000);
    const gaps = drawn.slice(1).map((d, i) => Math.round(d - drawn[i]));
    expect([drawn.length, [...new Set(gaps)]]).toEqual([30, [33]]);
  });

  it('a kick brings the ambience forward; stop() asks for nothing more', () => {
    const s = sim(false), drawn: number[] = [];
    const p = pacer((v) => {
      if (!p.due(v, 0)) return;
      drawn.push(v);
      p.later(30);
    }, s.clock);
    p.kick();
    s.run(20);
    p.kick();
    s.run(40);
    const early = drawn.length;
    p.stop();
    s.run(1000);
    expect([early, drawn.length, p.queued()]).toEqual([2, 2, false]);
  });
});
