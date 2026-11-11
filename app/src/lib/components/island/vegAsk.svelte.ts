// おねがい on this phone (docs/farming.md "おねがい"; the rules: vegRequest.ts): my ask now (who stands there asking,
// for a farmer only: a plot of mine on the layout, a plant of mine or a vegetable in my pocket), whether its asker has
// said it and whether I handed it over today (this phone's day record, as Wendell's and Franklin's), and the hand-over:
// the one vegetable sold to them at its price (store/actions.ts sell: the shop's own event, the record's checks), the
// day's garden piece a find (recordFind). Read by the visitor (Visitor.svelte) and the 畑 sheet (askNow).
import { dayRecord } from './dayRecord.ts';
import { SCENE } from '#lib/sync/storage.ts';
import { week } from '#lib/store/week.svelte.ts';
import { sell } from '#lib/store/actions.ts';
import { shopView } from '#lib/model/shop.ts';
import { farmOfState } from '#lib/model/farm.ts';
import { CROPS, cropKey, plantsOf } from '#lib/contract/farm.ts';
import { layoutPlots } from '#lib/layout/field.ts';
import { layout as layoutStore } from '#lib/store/layout.svelte.ts';
import { site } from './site.svelte.ts';
import { islandSeed } from './devHooks.ts';
import { asks, requestOn, type VegRequest } from './vegRequest.ts';
import { guestNow, visitorNow, type VisitorId } from './visitors.ts';
import { dayKey } from '#lib/time/clock.ts';

const rec = dayRecord(SCENE.vegAsk, { asked: false, done: false });
let rev = $state(0);

/** Today's ask on this phone: said (the asker told me) and done (handed over). */
export const vegDay = (date: string): { asked: boolean; done: boolean } => (void rev, rec.read(date));
export function markVeg(date: string, p: { asked?: boolean; done?: boolean }): void {
  rec.patch(date, p);
  rev++;
}

/** Whether I farm: a plot of mine, a plant of mine, or a vegetable in my pocket. */
function farmer(): boolean {
  const m = week.model;
  if (!m) return false;
  void site.rev;
  const l = site.layout ?? layoutStore.current;
  if (l && layoutPlots(l).some((x) => x.who === m.me)) return true;
  if (plantsOf(farmOfState(m.state), m.me)) return true;
  const pocket = shopView(m.state, m.me).pocket;
  return CROPS.some((c) => (pocket.get(cropKey(c)) ?? 0) > 0);
}

/** My ask from `by` (who stands there) on `date`, or null: they don't ask, I don't farm, or it's handed over. */
export function myAsk(by: VisitorId | null, date: string): VegRequest | null {
  const m = week.model;
  if (!by || !m || !asks(by, date)) return null;
  return vegDay(date).done || !farmer() ? null : requestOn(date, m.me, islandSeed(), by);
}

/** Whether my pocket holds `r`'s vegetable. */
export const holding = (r: VegRequest): boolean => {
  const m = week.model;
  return !!m && (shopView(m.state, m.me).pocket.get(cropKey(r.crop)) ?? 0) > 0;
};

/** Hand `r`'s vegetable over: one sold at its price (null: not in my pocket), marked done today. Its かいがら. */
export function handOver(r: VegRequest, date: string): number | null {
  const s = sell(new Map([[cropKey(r.crop), 1]]));
  if (!s.ok) return null;
  markVeg(date, { asked: true, done: true });
  return s.shells ?? 0;
}

/** My ask at a scene-clock moment for the 畑 sheet (who stands there now, the dev hooks too), done or not; null: none. */
export function askNow(clock: Date): (VegRequest & { done: boolean }) | null {
  const m = week.model, date = dayKey(clock), v = visitorNow(clock), by = v === 'franklin' ? v : guestNow(clock);
  if (!by || !m || !asks(by, date) || !farmer()) return null;
  const r = requestOn(date, m.me, islandSeed(), by);
  return r && { ...r, done: vegDay(date).done };
}
