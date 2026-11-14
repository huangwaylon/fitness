// りょこう's distances in km or miles (docs/design.md §Trips): a choice of this phone's (旅行's 設定 tab, DEVICE
// travelUnits; km by default), never synced. Reactive without runes: a read of `units.current` in a template or an
// effect is tracked (createSubscriber), so every `{km:}` the guide shows follows the switch at once.
//   fmtKm(9.8)          '9.8 km' | '6.1 mi'
//   units.current       'km' | 'mi'
//   setUnits('mi')
import { createSubscriber } from 'svelte/reactivity';
import { DEVICE, localKV, writeRaw } from '#lib/sync/storage.ts';

export type Units = 'km' | 'mi';
export const UNITS: readonly Units[] = ['km', 'mi'];

/** A mile in km (international mile). */
const KM_PER_MI = 1.609344;

const parse = (v: string | null | undefined): Units | null => (v === 'km' || v === 'mi' ? v : null);

function initial(): Units {
  try {
    return parse(localKV()?.getItem(DEVICE.travelUnits)) ?? 'km';
  } catch {
    return 'km';
  }
}

let value: Units = initial();
let changed: (() => void) | null = null;
const subscribe = createSubscriber((update) => {
  changed = update;
  return () => (changed = null);
});

/** The distance unit shown on this phone. */
export const units = {
  get current(): Units {
    subscribe();
    return value;
  }
};

/** Pick km or miles on this phone (kept for the next launch). */
export function setUnits(u: Units): void {
  if (u === value) return;
  value = u;
  writeRaw(localKV(), DEVICE.travelUnits, u);
  changed?.();
}

const NUM = [new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }), new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })];

/** A distance (given in km) in this phone's unit: one decimal under 100 ('9.8 km', '6.1 mi'), whole past it
 *  ('1,234 km'). @public (the guide's `{km:}` tokens) */
export function fmtKm(km: number): string {
  const u = units.current;
  const n = u === 'mi' ? km / KM_PER_MI : km;
  return `${NUM[Math.abs(n) < 100 ? 0 : 1].format(n)} ${u}`;
}
