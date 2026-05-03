import { describe, expect, it } from 'vitest';
import { chaikin, cumulativeDistances, interpolateAlong, type Coord } from './geometry';

describe('chaikin', () => {
  it('returns input unchanged for fewer than 3 points', () => {
    const pts: Coord[] = [
      [0, 0],
      [1, 1],
    ];
    expect(chaikin(pts, 3)).toEqual(pts);
  });

  it('smooths a 3-point chevron', () => {
    const pts: Coord[] = [
      [0, 0],
      [1, 1],
      [2, 0],
    ];
    const smoothed = chaikin(pts, 1);
    expect(smoothed.length).toBeGreaterThan(pts.length);
    expect(smoothed[0]).toEqual(pts[0]);
    expect(smoothed[smoothed.length - 1]).toEqual(pts[pts.length - 1]);
  });
});

describe('interpolateAlong', () => {
  it('returns the midpoint of a straight 2-point line at t=0.5', () => {
    const coords: Coord[] = [
      [0, 0],
      [10, 0],
    ];
    const cum = cumulativeDistances(coords);
    const { head, trail } = interpolateAlong(coords, cum, 0.5);
    expect(head[0]).toBeCloseTo(5);
    expect(head[1]).toBeCloseTo(0);
    expect(trail.length).toBe(2);
  });

  it('returns endpoints at t=0 and t=1', () => {
    const coords: Coord[] = [
      [0, 0],
      [4, 0],
      [4, 3],
    ];
    const cum = cumulativeDistances(coords);
    expect(interpolateAlong(coords, cum, 0).head).toEqual([0, 0]);
    const tail = interpolateAlong(coords, cum, 1).head;
    expect(tail[0]).toBeCloseTo(4);
    expect(tail[1]).toBeCloseTo(3);
  });
});
