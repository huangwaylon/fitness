// The `?wx=` timelines (dev or `?demo`, docs/design.md "Dev params"): canned real-weather timelines (live-protocol.ts
// Wx, as the relay sends) laid on the scene clock's hours (a `?date=` preview too), so the e2e and a look at the real
// weather's states need no relay and no particular day. By Tokyo's hour of each: `rain-pm` rain 12:00–18:00,
// `clears` rain until 14:00 then fine (a rainbow), `typhoon` a downpour all day, `snow`, `fog` foggy mornings
// (05:00–09:00), `cloudy` overcast, `stale` a timeline fetched 37 hours ago (it no longer serves: the seeded day). Pure.
import type { Wx, WxSky } from '#lib/sync/live-protocol.ts';

export const WX_FIXTURES = ['rain-pm', 'clears', 'typhoon', 'snow', 'fog', 'cloudy', 'stale'] as const;
export type WxFixture = (typeof WX_FIXTURES)[number];

const H = 3600_000;
const LETTERS: Record<WxFixture, (hour: number) => WxSky> = {
  'rain-pm': (h) => (h >= 12 && h < 18 ? 'r' : h === 18 ? 'o' : 'c'),
  clears: (h) => (h >= 5 && h < 14 ? 'r' : 'c'),
  typhoon: () => 'h',
  snow: () => 's',
  fog: (h) => (h >= 5 && h < 9 ? 'o' : 'c'),
  cloudy: () => 'o',
  stale: () => 'r'
};

/** Fixture `name` from 12 hours before `now`'s hour (ms) to 36 after it. */
export function wxFixture(name: WxFixture, now: number): Wx {
  const cur = Math.floor(now / H), h0 = cur - 12;
  let s = '';
  const fx: number[] = [];
  for (let i = 0; i < 48; i++) {
    const hour = new Date((h0 + i) * H + 9 * H).getUTCHours();
    s += LETTERS[name](hour);
    if (name === 'fog' && hour >= 5 && hour < 9) fx.push(i);
  }
  return { h0, s, ...(fx.length ? { fx } : {}), at: name === 'stale' ? now - 37 * H : now, src: 'fx', rev: 1 };
}
