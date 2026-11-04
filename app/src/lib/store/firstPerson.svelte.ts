// The rooms' first-person view (docs/design.md "First person"): on or off, kept on this phone only (DEVICE.fpv), the
// same in the tent, the homes and the museum. `?fpv=1|0` sets it for the tab without keeping it.
import { DEVICE, localKV, writeRaw } from '#lib/sync/storage.ts';

const parse = (v: string | null | undefined): boolean | null => (v === '1' ? true : v === '0' ? false : null);

function initial(): boolean {
  const q = typeof location === 'undefined' ? null : parse(new URLSearchParams(location.search).get('fpv'));
  if (q !== null) return q;
  try {
    return parse(localKV()?.getItem(DEVICE.fpv)) ?? false;
  } catch {
    return false;
  }
}

export const firstPerson = $state<{ on: boolean }>({ on: initial() });

export function setFirstPerson(on: boolean): void {
  firstPerson.on = on;
  writeRaw(localKV(), DEVICE.fpv, on ? '1' : '0');
}
