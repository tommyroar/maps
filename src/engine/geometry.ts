export type Coord = [number, number];

export function chaikin(coords: Coord[], iterations = 3): Coord[] {
  if (coords.length < 3) return coords.slice();
  let pts = coords.slice();
  for (let i = 0; i < iterations; i += 1) {
    const next: Coord[] = [pts[0]];
    for (let j = 0; j < pts.length - 1; j += 1) {
      const [x0, y0] = pts[j];
      const [x1, y1] = pts[j + 1];
      next.push([x0 * 0.75 + x1 * 0.25, y0 * 0.75 + y1 * 0.25]);
      next.push([x0 * 0.25 + x1 * 0.75, y0 * 0.25 + y1 * 0.75]);
    }
    next.push(pts[pts.length - 1]);
    pts = next;
  }
  return pts;
}

export function cumulativeDistances(coords: Coord[]): number[] {
  const out = new Array<number>(coords.length).fill(0);
  for (let i = 1; i < coords.length; i += 1) {
    const dx = coords[i][0] - coords[i - 1][0];
    const dy = coords[i][1] - coords[i - 1][1];
    out[i] = out[i - 1] + Math.hypot(dx, dy);
  }
  return out;
}

/** Returns (head coord, slice of coords up to & including head) for parameter t in [0, 1]. */
export function interpolateAlong(
  coords: Coord[],
  cumDist: number[],
  t: number
): { head: Coord; trail: Coord[] } {
  const total = cumDist[cumDist.length - 1];
  if (total === 0 || coords.length < 2) {
    return { head: coords[0] ?? [0, 0], trail: coords.slice(0, 1) };
  }
  const target = Math.max(0, Math.min(1, t)) * total;
  let i = 1;
  while (i < cumDist.length && cumDist[i] < target) i += 1;
  if (i >= coords.length) i = coords.length - 1;
  const segLen = cumDist[i] - cumDist[i - 1];
  const segT = segLen > 0 ? (target - cumDist[i - 1]) / segLen : 0;
  const a = coords[i - 1];
  const b = coords[i];
  const head: Coord = [a[0] + (b[0] - a[0]) * segT, a[1] + (b[1] - a[1]) * segT];
  const trail = coords.slice(0, i).concat([head]);
  return { head, trail };
}

export function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}
