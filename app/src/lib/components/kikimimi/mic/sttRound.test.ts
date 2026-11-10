// A mic round's recogniser (sttRound.ts): one still being made when its page goes is disposed, never readied.
import { describe, expect, it } from 'vitest';
import { sttRound } from './sttRound.ts';

describe('sttRound', () => {
  it('released while the recogniser is made: disposed, not readied (no Worker, no model)', async () => {
    const log: string[] = [];
    let made!: () => void;
    const making = new Promise<void>((r) => (made = r));
    const rec = { ready: async () => (log.push('ready'), true), dispose: () => log.push('dispose') };
    const round = sttRound(async () => ({ recogniser: async () => (await making, rec), release: () => log.push('release') }) as never);
    const r = round.ready();
    round.release();
    made();
    expect(await r).toBeNull();
    expect(log.sort()).toEqual(['dispose', 'release']);
  });
});
