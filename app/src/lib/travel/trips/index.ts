// The three guides (docs/travel.md "Content"): each its own module, loaded only with the りょこう sheet.
import type { Trip, TripId } from '../types.ts';

/** A guide's data (its own chunk). */
export function loadTrip(id: TripId): Promise<Trip> {
  switch (id) {
    case 'okinawa':
      return import('./okinawa.ts').then((m) => m.okinawa);
    case 'seattle':
      return import('./seattle.ts').then((m) => m.seattle);
    case 'nz':
      return import('./nz.ts').then((m) => m.nz);
  }
}
