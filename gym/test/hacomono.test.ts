// Tests for the gym API client and slot matching (port of test_units.py's gym API tests).
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  BASE_URL, CheckFailed, HacomonoError, PROGRAMS, RateLimited, SCHEDULE_PAGE_URL, SCHEDULE_PATH, fetchOpenSlots, matches,
  slotEnd, type Slot,
} from '../src/hacomono.ts';
import type { Window } from '../src/store.ts';
import { at, isoJst } from '../src/time.ts';

const TODAY = '2026-10-03';
const TRAINING = PROGRAMS[0]!;
const NOON: Window = ['12:00', '13:00'];
const oct = (day: number, clock: string): number => at(`2026-10-${String(day).padStart(2, '0')}`, clock);

/** A gym API response where only `starts` are reservable. Never empty (an empty one is an error). */
function schedule(starts: number[], booked: number[] = [oct(3, '10:00')]): object {
  const times = [
    ...booked.map((s) => ({ start_at: isoJst(s), is_reservable: false })),
    ...starts.map((s) => ({ start_at: isoJst(s), is_reservable: true })),
  ];
  return { data: { reserve_schedule: { dates: [{ date: 'any', times }] } } };
}

function answer(status: number, body: unknown = {}, headers: Record<string, string> = {}) {
  const fetch = vi.fn(async () => new Response(JSON.stringify(body), { status, headers }));
  vi.stubGlobal('fetch', fetch);
  return fetch;
}

const fetchTraining = () => fetchOpenSlots(TRAINING, TODAY, '2026-10-06');

afterEach(() => vi.unstubAllGlobals());

describe('fetchOpenSlots', () => {
  it('asks for the dates with no trainer preference', async () => {
    const fetch = answer(200, schedule([oct(3, '12:00')]));
    await fetchOpenSlots(PROGRAMS[1]!, TODAY, '2026-10-06');
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    const u = new URL(url);
    expect(u.origin + u.pathname).toBe(BASE_URL + SCHEDULE_PATH);
    expect(u.searchParams.get('studio_room_id')).toBe('44');
    expect(u.searchParams.get('program_id')).toBe('46');
    const query = JSON.parse(u.searchParams.get('query')!);
    expect(query.instructor_ids).toEqual([null]);
    expect([query.date_from, query.date_to]).toEqual(['2026-10-03', '2026-10-06']);
    expect(u.searchParams.get('query')).toBe(
      '{"page":1,"is_all":false,"is_flat":false,"is_fast":false,"instructor_ids":[null],'
        + '"date_from":"2026-10-03","date_to":"2026-10-06"}',
    );
    const headers = init.headers as Record<string, string>;
    expect(headers['User-Agent']).toContain('Mozilla');
    expect(headers.Referer).toBe(SCHEDULE_PAGE_URL);
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it('returns only reservable slots', async () => {
    answer(200, schedule([oct(3, '10:00'), oct(4, '21:30')], [oct(3, '12:30')]));
    expect(await fetchTraining()).toEqual([
      { program: TRAINING, start: oct(3, '10:00') },
      { program: TRAINING, start: oct(4, '21:30') },
    ]);
  });

  it.each([
    [500, {}, 'HTTP 500'],
    [200, { errors: ['bad query'] }, 'API errors'],
    [200, { data: { reserve_schedule: { dates: [] } } }, 'empty schedule'],
  ])('fails on %s %j', async (status, body, error) => {
    answer(status, body);
    const e = await fetchTraining().catch((err: unknown) => err);
    expect(e).toBeInstanceOf(HacomonoError);
    expect((e as Error).message).toContain(error);
  });

  it.each([
    [{ 'Retry-After': '120' }, 120],
    [{ 'Retry-After': 'soon' }, null],
    [{}, null],
  ])('reports rate limits (%j)', async (headers, retryAfter) => {
    answer(429, {}, headers);
    const e = await fetchTraining().catch((err: unknown) => err);
    expect(e).toBeInstanceOf(RateLimited);
    expect(e).toBeInstanceOf(HacomonoError);
    expect((e as RateLimited).retryAfter).toBe(retryAfter);
  });
});

describe('slots', () => {
  it.each([
    ['12:00', null, true],
    ['21:30', null, true],
    ['12:00', NOON, true],
    ['12:30', NOON, true], // ends exactly at 13:00
    ['13:00', NOON, false],
    ['11:30', NOON, false],
  ] as [string, Window, boolean][])('matches %s in %j: %s', (start, window, expected) => {
    expect(matches({ program: TRAINING, start: oct(3, start) }, window)).toBe(expected);
  });

  it('ends after the program', () => {
    const slot: Slot = { program: TRAINING, start: oct(3, '21:30') };
    expect(slotEnd(slot)).toBe(oct(3, '22:00'));
  });

  it('names the errors of a failed check', () => {
    const e = new CheckFailed([new HacomonoError('HTTP 500'), new RateLimited(60)], [], true);
    expect(e.message).toBe('HacomonoError: HTTP 500; RateLimited: rate limited (retry after 60s)');
    expect(e.allFailed).toBe(true);
  });
});
