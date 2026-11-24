// The guides (docs/travel.md "Content"): each its own module, loaded only with the りょこう sheet.
import type { Trip, TripId } from '../types.ts';
import { swallowed } from '#lib/quiet.ts';

/** How long a guide's chunk may take: the share page has no service worker to give up for it (the app's carried chunks
 *  get the same 10 s from service-worker/netFallback.ts NO_COPY_WAIT_MS), so a stalled request falls to its もう一度. */
export const TRIP_WAIT_MS = 10_000;

/** A guide's data (its own chunk); one not loaded within TRIP_WAIT_MS is counted (`swallow:trip.load`) and rejects. */
export function loadTrip(id: TripId): Promise<Trip> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const late = new Promise<never>((_, no) => (timer = setTimeout(() => no(new Error(`trip.load: ${id} over ${TRIP_WAIT_MS} ms`)), TRIP_WAIT_MS)));
  return Promise.race([chunk(id), late])
    .finally(() => clearTimeout(timer))
    .catch((e: unknown) => (swallowed('trip.load'), Promise.reject(e)));
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
