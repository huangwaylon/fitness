// The guides (docs/travel.md "Content"): each its own module, loaded only with the りょこう sheet.
import type { Trip, TripId } from '../types.ts';
import { swallowed } from '#lib/quiet.ts';

/** A guide's data (its own chunk); one not loaded is counted (`swallow:trip.load`) and rejects. */
export function loadTrip(id: TripId): Promise<Trip> {
  return chunk(id).catch((e: unknown) => (swallowed('trip.load'), Promise.reject(e)));
}
function chunk(id: TripId): Promise<Trip> {
  switch (id) {
    case 'okinawa':
      return import('./okinawa.ts').then((m) => m.okinawa);
    case 'seattle':
      return import('./seattle.ts').then((m) => m.seattle);
    case 'nz':
      return import('./nz.ts').then((m) => m.nz);
    case 'zao':
      return import('./zao.ts').then((m) => m.zao);
  }
}
