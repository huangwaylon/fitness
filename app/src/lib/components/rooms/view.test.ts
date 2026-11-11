import { describe, expect, it, vi } from 'vitest';
import { PerspectiveCamera, Raycaster } from 'three';
import { along, atAim, roomScreen, roomView, walkLens, type Walk } from './view.ts';

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

describe("a room's view (the two-finger pan on its camera)", () => {
  const camera = new PerspectiveCamera(60, 2, 1, 100);
  camera.position.set(0, 0, 10);
  const canvas = { clientWidth: 400, clientHeight: 200, getBoundingClientRect: () => ({ left: 0, top: 0, width: 400, height: 200 }) } as HTMLCanvasElement;
  const make = (wake = () => {}) => roomView(camera, canvas, {
    mix: () => 0, shiftY: () => 0, insets: () => ({ top: 0, bottom: 0 }), dprMoving: 1.25, wake,
    corners: () => [[-2, -1, 0], [2, -1, 0], [-2, 1, 0], [2, 1, 0]]
  });
  it('draws at the lighter ratio through a gesture and 160 ms after its last lift, one wake then', () => {
    vi.useFakeTimers();
    const wake = vi.fn(), v = make(wake);
    expect(v.ratio(3)).toBe(3);
    v.hold(true);
    expect(v.ratio(3)).toBe(1.25);
    v.hold(false);
    vi.advanceTimersByTime(100);
    // (a second gesture straight after: no swap back between them)
    v.hold(true);
    v.hold(false);
    vi.advanceTimersByTime(150);
    expect(v.ratio(3)).toBe(1.25);
    expect(wake).not.toHaveBeenCalled();
    vi.advanceTimersByTime(20);
    expect(v.ratio(3)).toBe(3);
    expect(wake).toHaveBeenCalledTimes(1);
    // (a lift with no gesture on: nothing)
    v.hold(false);
    vi.advanceTimersByTime(500);
    expect(wake).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
  it("a pinch's move pans the view, and a frame steps it home", () => {
    const v = make();
    v.hold(true);
    v.pinch(30, -10, 1, 200, 100);
    expect([v.pan.x, v.pan.y]).toEqual([30, -10]);
    expect(camera.view?.offsetX).toBe(-30);
    v.hold(false);
    v.pan.home(0, 420);
    v.step(1);
    v.step(500);
    expect(v.pan.isHome()).toBe(true);
    expect(v.step(600)).toBe(false);
    v.dispose();
  });
  it('is at the default within 0.02 of each, the turn the shortest way round', () => {
    const d = { az: 0, pitch: 0.6, k: 1 };
    expect(atAim({ az: 2 * Math.PI - 0.01, pitch: 0.61, k: 1.01 }, d)).toBe(true);
    expect(atAim({ az: 0, pitch: 0.63, k: 1 }, d)).toBe(false);
  });
});
