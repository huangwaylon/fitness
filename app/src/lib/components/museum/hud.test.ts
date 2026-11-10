// The museum's HUD helpers (hud.ts): the room chip's label from a room id (today's wings and the coming F1..G2), its
// wing's found/total, and the card's dock edge.
import { describe, expect, test } from 'vitest';
import { DOCK_LOW, WING_NAME, WING_TOTAL, cardDock, roomLabel, roomOf, wingTally } from './hud.ts';

describe("the room chip's label", () => {
  test("today's wings by their id, each its plaque's name, no number", () => {
    expect(roomLabel('hall')).toBe('はくぶつかん');
    expect(roomLabel('bug')).toBe('こんちゅう');
    expect(roomLabel('fish')).toBe('さかな');
    expect(roomLabel('sea')).toBe('うみの さち');
    expect(roomLabel('fossil')).toBe('かせき');
    expect(roomLabel('art')).toBe('びじゅつ');
  });
  test("a multi-room wing's rooms numbered, any spelling", () => {
    expect(roomOf('F2')).toEqual({ wing: 'fossil', n: 2 });
    expect(roomOf('g1')).toEqual({ wing: 'art', n: 1 });
    expect(roomOf('fossil-3')).toEqual({ wing: 'fossil', n: 3 });
    expect(roomOf(' art_2 ')).toEqual({ wing: 'art', n: 2 });
    expect(roomLabel('F1')).toBe('かせき 1');
    expect(roomLabel('G2')).toBe('びじゅつ 2');
  });
  test('the number only where the plan has more than one room of the wing', () => {
    const plan = ['hall', 'bug', 'fish', 'F1', 'F2', 'G1'];
    expect(roomLabel('F2', plan)).toBe('かせき 2');
    expect(roomLabel('G1', plan)).toBe('びじゅつ');
    expect(roomLabel('fish', plan)).toBe('さかな');
  });
  test('an unknown id: the hall, never a blank chip', () => {
    expect(roomOf('X9')).toBeNull();
    expect(roomOf('')).toBeNull();
    expect(roomLabel('lobby')).toBe(WING_NAME.hall);
  });
});

describe("the chip's count", () => {
  test("NH's whole collections", () => {
    expect(WING_TOTAL).toEqual({ fish: 80, bug: 80, sea: 40, fossil: 73, art: 43 });
  });
  test("a wing's finds of its whole; the hall none", () => {
    const on = { specimens: [{ kind: 'fish' }, { kind: 'fish' }, { kind: 'bug' }, { kind: 'sea' }] as const, fossils: [1, 2, 3], artworks: [1] };
    expect(wingTally('fish', on)).toEqual({ found: 2, total: 80 });
    expect(wingTally('bug', on)).toEqual({ found: 1, total: 80 });
    expect(wingTally('sea', on)).toEqual({ found: 1, total: 40 });
    expect(wingTally('fossil', on)).toEqual({ found: 3, total: 73 });
    expect(wingTally('art', on)).toEqual({ found: 1, total: 43 });
    expect(wingTally('hall', on)).toBeNull();
  });
});

describe("the card's dock", () => {
  const H = 852;
  test('the bottom, unless the exhibit is drawn in the lower 45 %', () => {
    expect(cardDock(100, H)).toBe('bottom');
    expect(cardDock(H * (1 - DOCK_LOW), H)).toBe('bottom');
    expect(cardDock(H * (1 - DOCK_LOW) + 1, H)).toBe('top');
    expect(cardDock(800, H)).toBe('top');
  });
  test('off screen above: bottom; no viewport yet: bottom', () => {
    expect(cardDock(-40, H)).toBe('bottom');
    expect(cardDock(500, 0)).toBe('bottom');
  });
});
