import { describe, expect, it } from 'vitest';
import { RULES } from '#lib/config/rules.ts';
import { rulesFor } from '#lib/scoring/targets.ts';

describe('rulesFor', () => {
  it('the first version before any applies', () => {
    expect(rulesFor('2026-08-31')).toBe(RULES[0]);
    expect(rulesFor('2026-10-26')).toBe(RULES[0]);
  });
});
