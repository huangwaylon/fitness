// /status's verdict and error codes (src/status.ts): each rule, their order, and what a failed fetch is called.
import { describe, expect, it } from 'vitest';
import { HacomonoError, RateLimited } from '../src/hacomono.ts';
import { outcomeOf, statusOf, type Check } from '../src/status.ts';

const NOW = Date.parse('2026-10-12T12:00:00+09:00');
const MIN = 60_000;

const check = (r: Check['r'], extra: Partial<Check> = {}): Check =>
  ({ t: NOW - MIN, by: 'alarm', ms: 3000, r, open: 0, fresh: 0, push: 'none', ...extra });
const idle: Check = { t: NOW, by: 'alarm', ms: 0, idle: true, open: 0, fresh: 0, push: 'none' };

/** A healthy runner, with `f` changed. */
const statusWith = (f: Partial<Parameters<typeof statusOf>[0]> = {}) => statusOf({
  now: NOW, mode: 'bot', paused: false, nextCheck: NOW + 10 * MIN, failures: 0, retryPending: false,
  checks: [check({ training: 'ok', pilates: 'ok' })], groupSet: true, running: false,
  line: { used: 10, limit: 200, webhookOk: true, asOf: NOW }, ...f,
});

describe('statusOf', () => {
  it('healthy when nothing applies (LINE not read yet, no checks yet)', () => {
    expect(statusWith()).toEqual({ verdict: 'healthy', reasons: [] });
    expect(statusWith({ checks: [], line: { used: null, limit: null, webhookOk: null, asOf: null } }))
      .toEqual({ verdict: 'healthy', reasons: [] });
  });

  it.each([
    ['off', { mode: 'off' }, ['mode_off']],
    ['stopped', { paused: true, nextCheck: null }, ['paused']],
    ['broken', { nextCheck: null }, ['no_alarm']],
    ['broken', { groupSet: false }, ['no_group']],
    ['broken', { line: { used: 0, limit: 200, webhookOk: false, asOf: NOW } }, ['webhook_wrong']],
    ['late', { nextCheck: NOW - 6 * MIN }, ['overdue']],
    ['failing', { failures: 3 }, ['site_failing']],
    ['degraded', { failures: 2 }, ['site_failing']],
    ['degraded', { checks: [idle, check({ training: 'ok', pilates: 'timeout' })] }, ['program_failing']],
    ['degraded', { retryPending: true }, ['push_retry']],
    ['degraded', { line: { used: 160, limit: 200, webhookOk: true, asOf: NOW } }, ['quota_high']],
  ] as const)('%s: %j', (verdict, f, reasons) => {
    expect(statusWith(f as never)).toEqual({ verdict, reasons });
  });

  it('lists every reason in rule order, the verdict the first one’s', () => {
    expect(statusWith({
      mode: 'off', paused: true, groupSet: false, nextCheck: NOW - 6 * MIN, failures: 5, retryPending: true,
      checks: [check({ training: 'http_5xx', pilates: 'http_5xx' })],
      line: { used: 200, limit: 200, webhookOk: false, asOf: NOW },
    })).toEqual({
      verdict: 'off',
      reasons: ['mode_off', 'paused', 'no_group', 'webhook_wrong', 'overdue', 'site_failing', 'program_failing',
        'push_retry', 'quota_high'],
    });
    expect(statusWith({ nextCheck: null, failures: 4 })).toEqual({ verdict: 'broken', reasons: ['no_alarm', 'site_failing'] });
    expect(statusWith({ nextCheck: NOW - 6 * MIN, failures: 1 })).toEqual({ verdict: 'late', reasons: ['overdue', 'site_failing'] });
    expect(statusWith({ failures: 3, retryPending: true }).verdict).toBe('failing');
  });

  it('no_alarm only for a running bot whose alarm isn’t mid-check', () => {
    expect(statusWith({ nextCheck: null, mode: 'off' }).reasons).toEqual(['mode_off']);
    expect(statusWith({ nextCheck: null, running: true }).verdict).toBe('healthy');
  });

  it('overdue only past the alarm by more than 5 minutes', () => {
    expect(statusWith({ nextCheck: NOW - 5 * MIN }).verdict).toBe('healthy');
    expect(statusWith({ nextCheck: NOW - 5 * MIN - 1 }).verdict).toBe('late');
  });

  it('program_failing looks at the newest check that fetched, not older ones', () => {
    const checks = [idle, check({ training: 'ok', pilates: 'ok' }), check({ training: 'error', pilates: 'ok' })];
    expect(statusWith({ checks }).verdict).toBe('healthy');
    expect(statusWith({ checks: [idle] }).verdict).toBe('healthy');
  });

  it('quota_high from 80%, never without a limit', () => {
    const line = (used: number, limit: number | null) => ({ used, limit, webhookOk: true, asOf: NOW });
    expect(statusWith({ line: line(159, 200) }).verdict).toBe('healthy');
    expect(statusWith({ line: line(160, 200) }).reasons).toEqual(['quota_high']);
    expect(statusWith({ line: line(5000, null) }).verdict).toBe('healthy');
  });
});

describe('outcomeOf', () => {
  it.each([
    [new RateLimited(30), 'rate_limited'],
    [new RateLimited(null), 'rate_limited'],
    [new HacomonoError('HTTP 403'), 'http_4xx'],
    [new HacomonoError('HTTP 503'), 'http_5xx'],
    [new HacomonoError('empty schedule'), 'empty'],
    [new HacomonoError('API errors: {"x":1}'), 'error'],
    [new DOMException('timed out', 'TimeoutError'), 'timeout'],
    [new DOMException('aborted', 'AbortError'), 'timeout'],
    [new TypeError('fetch failed'), 'error'],
    ['a string', 'error'],
  ])('%s → %s', (e, code) => {
    expect(outcomeOf(e)).toBe(code);
  });
});
