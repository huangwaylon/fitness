// Seeded randomness (random.ts): both phones and saved state depend on these sequences, so they're pinned exactly.
import { describe, expect, test } from 'vitest';
import { fnv1a, mulberry32, seeded, shuffle, smallHash } from './random.ts';

const draws = (r: () => number, n = 6) => Array.from({ length: n }, () => Math.round(r() * 2 ** 32));

describe('pinned sequences', () => {
  test('mulberry32: the same seed, the same numbers (a negative or fractional seed as its uint32)', () => {
    expect([0, 1, 42, 0xdeadbeef, -5, 2 ** 32 + 7].map((s) => draws(mulberry32(s)))).toMatchInlineSnapshot(`
      [
        [
          1144304738,
          1416247,
          958946056,
          627933444,
          2007157716,
          2340967985,
        ],
        [
          2693262067,
          11749833,
          2265367787,
          4213581821,
          4159151403,
          1207330352,
        ],
        [
          2581720956,
          1925393290,
          3661312704,
          2876485805,
          750819978,
          2261697747,
        ],
        [
          4043151706,
          1147597007,
          3315858022,
          1538288752,
          2042435954,
          3600176436,
        ],
        [
          2078107854,
          227493659,
          4033117029,
          3420415754,
          4193201262,
          3638068775,
        ],
        [
          50271532,
          266108690,
          4195786334,
          3002305430,
          2239590375,
          1741702388,
        ],
      ]
    `);
  });
  test('fnv1a: by UTF-16 code unit', () => {
    expect(['', 'a', 'sea-bass', '2026-11-09T07|sea', 'きのこ', '🐟'].map(fnv1a)).toMatchInlineSnapshot(`
      [
        2166136261,
        3826002220,
        4267872468,
        4015529842,
        1427493955,
        3660494421,
      ]
    `);
  });
  test('seeded and shuffle', () => {
    expect(draws(seeded('island'), 4)).toMatchInlineSnapshot(`
      [
        135119266,
        54465405,
        3060526221,
        2691721962,
      ]
    `);
    expect(shuffle([...'abcdefghij'], seeded('deck')).join('')).toMatchInlineSnapshot(`"dgbhecfaji"`);
  });
});

test('smallHash: the museum seeds (bugLife bugSeed, the aquarium) pinned', () => {
  expect(['tarantula', 'sea-bass', 'a', ''].map(smallHash)).toEqual([36050, 68025, 314, 7]);
});
