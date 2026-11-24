// The flake hunt's failed tests in a readable line (specNames.ts): spec names once each, "+N more", no paths.
import { describe, expect, it } from 'vitest';
import { alertTitle, specName, testsLine } from './specNames.ts';

describe('spec names', () => {
  it('a place → its spec file’s name; a path cut off mid-name → null', () => {
    expect(specName('e2e/kk-sync.spec.ts:40')).toBe('kk-sync');
    expect(specName('e2e/island/highfive-star.spec.ts')).toBe('highfive-star');
    expect(specName('e2e/pon')).toBeNull();
  });

  it('the hunt’s places → "N tests failed: a, b, c, d +N more", a spec once, a place once', () => {
    expect(testsLine(['e2e/kk-sync.spec.ts:40', 'e2e/highfive-star.spec.ts:9', 'e2e/players.spec.ts:33', 'e2e/guest.spec.ts:152']))
      .toBe('4 tests failed: kk-sync, highfive-star, players, guest');
    expect(testsLine(['e2e/kk-sync.spec.ts:40', 'e2e/kk-sync.spec.ts:88', 'e2e/kk-sync.spec.ts:40', '', 'e2e/guest.spec.ts:152']))
      .toBe('3 tests failed: kk-sync, guest');
    const nine = ['guest:152', 'gymbot:235', 'players:33', 'pond:12', 'kk-sync:40', 'room-pan:114', 'speech:69', 'health:80', 'guest:200'].map((p) => `e2e/${p.replace(':', '.spec.ts:')}`);
    expect(testsLine(nine)).toBe('9 tests failed: guest, gymbot, players, pond +4 more');
    expect(testsLine(['e2e/kk-sync.spec.ts:40'])).toBe('1 test failed: kk-sync');
  });

  it('an old title (raw paths, cut at 120 characters) reads as names; "(+k more)" or a cut path: "+more"; others: the prefix off', () => {
    const cut = 'Ops: flake hunt: 9 tests failed in the hunt: e2e/guest.spec.ts:152 e2e/gymbot.spec.ts:235 e2e/players.spec.ts:33 e2e/pon';
    expect(alertTitle(cut)).toBe('Flake hunt: 9 tests failed: guest, gymbot, players +more');
    expect(alertTitle('Ops: flake hunt: 2 tests failed in the hunt: e2e/a.spec.ts:1 e2e/b.spec.ts:2')).toBe('Flake hunt: 2 tests failed: a, b');
    expect(alertTitle('Ops: flake hunt: 7 tests failed in the hunt: e2e/a.spec.ts:1 e2e/b.spec.ts:2 e2e/a.spec.ts:9 e2e/c.spec.ts:3 e2e/d.spec.ts:4 (+2 more)'))
      .toBe('Flake hunt: 7 tests failed: a, b, c, d +more');
    expect(alertTitle('Ops: flake hunt: 6 tests failed in the hunt: e2e/a.spec.ts:1 e2e/b.spec.ts:2 e2e/c.spec.ts:3 e2e/d.spec.ts:4 e2e/e.spec.ts:5 e2e/f.spec.ts:6'))
      .toBe('Flake hunt: 6 tests failed: a, b, c, d +2 more');
    expect(alertTitle('Ops: flake hunt: 4 tests failed: kk-sync, highfive-star, players, guest')).toBe('Flake hunt: 4 tests failed: kk-sync, highfive-star, players, guest');
    expect(alertTitle('Ops: backup: dump_failed')).toBe('Backup: dump_failed');
    expect(alertTitle('Something else')).toBe('Something else');
  });
});
