// The runner's bodies (contract.ts), checked before they reach the object: shapes, sizes and the characters a name may
// hold. The page's settings go through the contract's own parseSettingsInput. Each answers the value or an error code
// (logged by the Worker, answered as 400).
import {
  BOOKING_KINDS, EVENT_KINDS, HOSTS, ID_RE, LIMITS, MAX_SITE_NAME, PHASES, SCANS_PER_REPORT, isDate, isId, isName,
  type BookingInput, type ClaimInput, type EventInput, type Host, type LastError, type Phase, type RunInput, type RunnerReport,
  type ScanEntry,
} from '../../../app/src/lib/its/contract.ts';

type Parsed<T> = { ok: true; value: T } | { ok: false; error: string };

const SPOTS = ['centre', 'left', null] as const;

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
const count = (x: unknown): x is number => Number.isInteger(x) && (x as number) >= 0;
const time = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x) && x >= 0;
const timeOrNull = (x: unknown): x is number | null => x === null || time(x);

export function parseRunInput(x: unknown): Parsed<RunInput> {
  if (!isObj(x) || (x.action !== 'start' && x.action !== 'stop')) return { ok: false, error: 'bad_action' };
  return { ok: true, value: { action: x.action } };
}

export function parseClaim(x: unknown): Parsed<ClaimInput> {
  if (!isObj(x) || !isId(x.runId) || !HOSTS.includes(x.host as Host)) return { ok: false, error: 'bad_claim' };
  return { ok: true, value: { runId: x.runId, host: x.host as Host } };
}

export function parseBookings(x: unknown): Parsed<BookingInput[]> {
  if (!Array.isArray(x)) return { ok: false, error: 'bad_bookings' };
  if (x.length > LIMITS.bookingsPerPost) return { ok: false, error: 'too_many_bookings' };
  const out: BookingInput[] = [];
  for (const b of x) {
    if (!isObj(b) || !isId(b.id) || !isId(b.runId) || !BOOKING_KINDS.includes(b.kind as BookingInput['kind'])) return { ok: false, error: 'bad_booking' };
    if (!isDate(b.date) || !isName(b.hotel, MAX_SITE_NAME)) return { ok: false, error: 'bad_booking' };
    if (b.number !== undefined && !isName(b.number, LIMITS.number)) return { ok: false, error: 'bad_booking' };
    const e: BookingInput = { id: b.id, kind: b.kind as BookingInput['kind'], date: b.date, hotel: b.hotel, runId: b.runId };
    if (b.number !== undefined) e.number = b.number as string;
    out.push(e);
  }
  return { ok: true, value: out };
}

function parseEvent(x: unknown): EventInput | null {
  if (!isObj(x) || !Number.isInteger(x.seq) || (x.seq as number) < 1 || !EVENT_KINDS.includes(x.kind as EventInput['kind'])) return null;
  if (x.date !== undefined && !isDate(x.date)) return null;
  if (x.hotel !== undefined && !isName(x.hotel, LIMITS.eventHotel)) return null;
  if (x.detail !== undefined && !isName(x.detail, LIMITS.detail)) return null;
  const e: EventInput = { seq: x.seq as number, kind: x.kind as EventInput['kind'] };
  if (x.date !== undefined) e.date = x.date as string;
  if (x.hotel !== undefined) e.hotel = x.hotel as string;
  if (x.detail !== undefined) e.detail = x.detail as string;
  return e;
}

function parseLastError(x: unknown): LastError | null | undefined {
  if (x === null) return null;
  if (!isObj(x) || !time(x.at) || !isId(x.step) || !isId(x.cls)) return undefined;
  if (x.status !== null && !(Number.isInteger(x.status) && (x.status as number) >= 0 && (x.status as number) < 1000)) return undefined;
  return { at: x.at, step: x.step, status: x.status as number | null, cls: x.cls };
}

/** One calendar read (the page's minute strip): a fractional duration rounded, unknown fields dropped. */
function parseScan(x: unknown): ScanEntry | null {
  if (!isObj(x) || !time(x.t) || typeof x.ok !== 'boolean' || !time(x.ms) || !count(x.avail)) return null;
  if (x.code !== undefined && !isId(x.code)) return null;
  return { t: x.t, ok: x.ok, ...(x.code !== undefined && { code: x.code as string }), ms: Math.round(x.ms), avail: x.avail };
}

/** A heartbeat. The runner's own strings (runUrl, sha) are held to their shapes: they reach the page as links/text. */
export function parseReport(x: unknown): Parsed<RunnerReport> {
  const bad = (what: string): Parsed<RunnerReport> => ({ ok: false, error: `bad_report_${what}` });
  if (!isObj(x) || x.v !== 1 || !isId(x.runId) || !HOSTS.includes(x.host as Host) || !PHASES.includes(x.phase as Phase)) return bad('shape');
  if (x.runUrl !== null && !(typeof x.runUrl === 'string' && x.runUrl.length <= 200 && /^https:\/\/github\.com\/[\w./-]+$/.test(x.runUrl))) return bad('url');
  if (x.sha !== null && !(typeof x.sha === 'string' && /^[0-9a-f]{4,40}$/.test(x.sha))) return bad('sha');
  if (!time(x.startedAt) || !timeOrNull(x.deadline) || !timeOrNull(x.lastScanAt) || !timeOrNull(x.lastOkAt)) return bad('times');
  // a newer runner's (absent from an older one: left absent)
  if (x.settingsAt !== undefined && !timeOrNull(x.settingsAt)) return bad('times');
  if (x.mailOk !== undefined && x.mailOk !== null && typeof x.mailOk !== 'boolean') return bad('mail');
  const scans = x.scansLog === undefined ? undefined : Array.isArray(x.scansLog) && x.scansLog.length <= SCANS_PER_REPORT ? x.scansLog.map(parseScan) : null;
  if (scans === null || scans?.some((e) => e === null)) return bad('scans');
  if (!count(x.scans) || !count(x.scanFailures) || !count(x.unsynced)) return bad('counts');
  const s = x.solves;
  if (!isObj(s) || !count(s.ok) || !count(s.failed) || !timeOrNull(s.lastOkAt) || !(s.lastSecs === null || time(s.lastSecs)) || !SPOTS.includes(s.lastSpot as never)) return bad('solves');
  const f = x.failuresByStep;
  if (!isObj(f) || Object.keys(f).length > LIMITS.steps || !Object.entries(f).every(([k, n]) => ID_RE.test(k) && count(n))) return bad('steps');
  const lastError = parseLastError(x.lastError);
  if (lastError === undefined) return bad('error');
  if (!Array.isArray(x.events) || x.events.length > LIMITS.eventsPerReport) return bad('events');
  const events = x.events.map(parseEvent);
  if (events.some((e) => e === null)) return bad('event');
  if (!Array.isArray(x.seen) || x.seen.length > LIMITS.seenPerReport || !x.seen.every((n) => isName(n, MAX_SITE_NAME))) return bad('seen');
  return {
    ok: true,
    value: {
      v: 1, runId: x.runId, runUrl: x.runUrl as string | null, sha: x.sha as string | null, host: x.host as Host,
      startedAt: x.startedAt, deadline: x.deadline, phase: x.phase as Phase,
      scans: x.scans, scanFailures: x.scanFailures, lastScanAt: x.lastScanAt, lastOkAt: x.lastOkAt,
      solves: { ok: s.ok, failed: s.failed, lastOkAt: s.lastOkAt, lastSecs: s.lastSecs as number | null, lastSpot: s.lastSpot as RunnerReport['solves']['lastSpot'] },
      failuresByStep: { ...(f as Record<string, number>) }, lastError, unsynced: x.unsynced,
      ...(x.settingsAt !== undefined && { settingsAt: x.settingsAt as number | null }),
      ...(x.mailOk !== undefined && { mailOk: x.mailOk as boolean | null }),
      ...(scans && { scansLog: scans as ScanEntry[] }),
      events: events as EventInput[], seen: x.seen as string[],
    },
  };
}
