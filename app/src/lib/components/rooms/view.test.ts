import { describe, expect, it } from 'vitest';
import { PerspectiveCamera, Raycaster } from 'three';
import { along, roomScreen, walkLens, type Walk } from './view.ts';

const walk = (from: [number, number], pts: [number, number][], ms = 1000): Walk => ({ from, pts, t0: 0, ms, ...walkLens(from, pts) });

describe('a walk', () => {
  it('measures its legs', () => {
    expect(walkLens([0, 0], [[3, 4], [3, 10]])).toEqual({ lens: [5, 6], total: 11 });
  });
  it('is where its time says, heading along its leg, and over at its end', () => {
    const w = walk([0, 0], [[10, 0], [10, 10]]);
    expect(along(w, -50)).toEqual({ p: [0, 0], d: [10, 0], done: false });
    expect(along(w, 250)).toEqual({ p: [5, 0], d: [10, 0], done: false });
    expect(along(w, 750)).toEqual({ p: [10, 5], d: [0, 10], done: false });
    expect(along(w, 1200)).toEqual({ p: [10, 10], d: [0, 10], done: true });
  });
  it('a walk to where it stands is over at once', () => {
    expect(along(walk([2, 2], [[2, 2]]), 0)).toMatchObject({ p: [2, 2] });
  });
});

describe("a room's screen", () => {
  const camera = new PerspectiveCamera(60, 2, 1, 100);
  camera.position.set(0, 0, 10);
  camera.updateMatrixWorld();
  const canvas = { getBoundingClientRect: () => ({ left: 100, top: 50, width: 400, height: 200 }) } as HTMLCanvasElement;
  const s = roomScreen(camera, canvas);
  it('puts the point looked at in the middle of the canvas', () => {
    expect(s.client(0, 0, 0)).toEqual([300, 150]);
    expect(s.project(0, 0, 0)).toEqual([300, 150]);
    expect(s.inView(0, 0, 0)).toBe(true);
  });
  it('a point behind the camera is out of view and not projected', () => {
    expect(s.inView(0, 0, 20)).toBe(false);
    expect(s.project(0, 0, 20)).toBeNull();
  });
  it("aims a tap's ray through the page point", () => {
    const ray = new Raycaster();
    s.aim(ray, 300, 150);
    expect(ray.ray.direction.z).toBeCloseTo(-1, 5);
  });
});
