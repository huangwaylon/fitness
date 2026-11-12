// Client for the ELEMENT gym's hacomono reservation API (the JSON the booking page itself uses).
import { at, clockOf, dayOf, type Day } from './time.ts';
import type { Window } from './store.ts';

export const BASE_URL = 'https://element-gym.hacomono.jp';
const STUDIO_ID = 56; // ELEMENT 戸越銀座店
const STUDIO_ROOM_ID = 44;
/** Sent as Referer. */
export const SCHEDULE_PAGE_URL = `${BASE_URL}/reserve/schedule/${STUDIO_ID}/${STUDIO_ROOM_ID}/`;
export const SCHEDULE_PATH = '/api/reservation/reservations/choice/reserve-schedule';
/** A 🔎 check must answer within the minute a reply token lasts. */
const TIMEOUT_MS = 15_000;
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36';

export interface Program {
  key: 'training' | 'pilates';
  id: number;
  label: string;
  minutes: number;
}

export const PROGRAMS: readonly Program[] = [
  { key: 'training', id: 1, label: '💪 パーソナルトレーニング', minutes: 30 }, // パーソナルトレーニング(30分)【会員様専用】
  { key: 'pilates', id: 46, label: '🧘 マシンピラティス', minutes: 30 }, // マシンピラティス (30分)【会員様専用：パーソナル】
];

export interface Slot {
  program: Program;
  start: number;
}

/** When the slot finishes. */
export const slotEnd = (s: Slot): number => s.start + s.program.minutes * 60_000;

/** True if the slot starts and finishes inside the window (null = any time of day). */
export function matches(slot: Slot, window: Window): boolean {
  if (window === null) return true;
  const [start, end] = window;
  return clockOf(slot.start) >= start && slotEnd(slot) <= at(dayOf(slot.start), end);
}

export class HacomonoError extends Error {
  override name = 'HacomonoError';
}

export class RateLimited extends HacomonoError {
  override name = 'RateLimited';
  /** Seconds, from a numeric Retry-After header. */
  retryAfter: number | null;

  constructor(retryAfter: number | null) {
    super(`rate limited (retry after ${retryAfter}s)`);
    this.retryAfter = retryAfter;
  }
}

/** At least one program couldn't be fetched. `found` holds the matching slots the others returned. */
export class CheckFailed extends Error {
  override name = 'CheckFailed';
  errors: Error[];
  found: Slot[];
  allFailed: boolean;

  constructor(errors: Error[], found: Slot[], allFailed: boolean) {
    super(errors.map((e) => `${e.name}: ${e.message}`).join('; '));
    this.errors = errors;
    this.found = found;
    this.allFailed = allFailed;
  }
}

interface ScheduleResponse {
  errors?: unknown;
  data: { reserve_schedule: { dates: { times: { start_at: string; is_reservable?: boolean }[] }[] } };
}

/** Reservable "no trainer preference" (トレーナーを指名しない) slots from `from` to `to`. An empty schedule (no dates at
 *  all) is an error: the API returns every requested date, even ones with nothing published yet. */
export async function fetchOpenSlots(program: Program, from: Day, to: Day): Promise<Slot[]> {
  const query = {
    page: 1,
    is_all: false,
    is_flat: false,
    is_fast: false,
    instructor_ids: [null],
    date_from: from,
    date_to: to,
  };
  const params = new URLSearchParams({
    studio_room_id: String(STUDIO_ROOM_ID),
    program_id: String(program.id),
    query: JSON.stringify(query),
  });
  const resp = await fetch(`${BASE_URL}${SCHEDULE_PATH}?${params}`, {
    headers: { 'User-Agent': USER_AGENT, Referer: SCHEDULE_PAGE_URL, Accept: 'application/json' },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (resp.status === 429) {
    const retryAfter = resp.headers.get('Retry-After');
    throw new RateLimited(retryAfter && /^\d+$/.test(retryAfter) ? Number(retryAfter) : null);
  }
  if (resp.status !== 200) throw new HacomonoError(`HTTP ${resp.status}`);
  const data = (await resp.json()) as ScheduleResponse;
  // Python truthiness: an empty list or object means no errors.
  if (data.errors && (typeof data.errors !== 'object' || Object.keys(data.errors).length)) {
    throw new HacomonoError(`API errors: ${JSON.stringify(data.errors)}`);
  }
  const dates = data.data.reserve_schedule.dates;
  if (!dates.length) throw new HacomonoError('empty schedule');
  return dates.flatMap((day) =>
    day.times.filter((entry) => entry.is_reservable).map((entry) => ({ program, start: Date.parse(entry.start_at) })),
  );
}
