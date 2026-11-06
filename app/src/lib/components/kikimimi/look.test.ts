// ききみみ's small looks (look.ts): a level's mark, a domain's icon and tint, a speed as shown.
import { describe, expect, it } from 'vitest';
import { domainIcon, domainTint, levelMark, sx } from './look.ts';

describe('kikimimi looks', () => {
  it('marks a level by its place on the ladder (the アナウンス pack 📢), a domain by its icon and tint, a speed to one decimal', () => {
    expect([1, 4, 5, 6, 7].map(levelMark)).toEqual(['★', '★★★★', '📢', '★★★★★', '★★★★★★']);
    expect([domainIcon('tabi'), domainIcon('glue'), domainIcon('nope'), domainIcon('constructor')]).toEqual(['✈️', '💬', '', '']);
    expect([domainTint('ie'), domainTint('nope')]).toEqual(['var(--person-b)', 'var(--c-mint)']);
    expect([0.8, 1, 1.4].map(sx)).toEqual(['0.8', '1.0', '1.4']);
  });
});
