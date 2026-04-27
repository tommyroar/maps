import type { Map as MapboxMap, GeoJSONSource, LayerSpecification } from 'mapbox-gl';
import type { RouteSpec, SiteSpec } from '../engine/schema';
import { resolveContentAsset } from '../engine/asset-resolver';
import { chaikin, cumulativeDistances, easeInOut, interpolateAlong, type Coord } from '../engine/geometry';

interface PreparedRoute {
  id: string;
  spec: RouteSpec;
  coords: Coord[];
  cumDist: number[];
}

export interface TracerController {
  ids: string[];
  activate(ids: string[]): void;
  stopAll(): void;
}

async function fetchCoords(file: string): Promise<Coord[]> {
  const url = resolveContentAsset(file);
  const res = await fetch(url);
  const data = (await res.json()) as Coord[] | { coordinates: Coord[] };
  return Array.isArray(data) ? data : data.coordinates;
}

function trailSourceId(id: string): string {
  return `tracer-trail-${id}`;
}
function headSourceId(id: string): string {
  return `tracer-head-${id}`;
}

function emptyLine(): GeoJSON.Feature<GeoJSON.LineString> {
  return { type: 'Feature', geometry: { type: 'LineString', coordinates: [] }, properties: {} };
}
function emptyPoint(): GeoJSON.Feature<GeoJSON.Point> {
  return { type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0] }, properties: {} };
}

export async function buildTracerController(
  map: MapboxMap,
  site: SiteSpec
): Promise<TracerController> {
  const routes = site.routes ?? {};
  const prepared = new Map<string, PreparedRoute>();
  const running = new Map<string, number>();

  for (const [id, spec] of Object.entries(routes)) {
    const raw = await fetchCoords(spec.file);
    const coords =
      spec.smooth === 'chaikin'
        ? chaikin(raw, spec.smoothIterations ?? 3)
        : raw;
    const cumDist = cumulativeDistances(coords);
    prepared.set(id, { id, spec, coords, cumDist });

    map.addSource(trailSourceId(id), { type: 'geojson', data: emptyLine() });
    map.addSource(headSourceId(id), { type: 'geojson', data: emptyPoint() });

    const beforeId = spec.beforeId && map.getLayer(spec.beforeId) ? spec.beforeId : undefined;

    if (spec.glow) {
      map.addLayer(
        {
          id: `tracer-glow-outer-${id}`,
          type: 'line',
          source: trailSourceId(id),
          paint: {
            'line-color': spec.color,
            'line-width': (spec.widthPx ?? 3) * 4,
            'line-opacity': 0.18,
            'line-blur': 6,
          },
          layout: { 'line-cap': 'round', 'line-join': 'round' },
        } as LayerSpecification,
        beforeId
      );
      map.addLayer(
        {
          id: `tracer-glow-inner-${id}`,
          type: 'line',
          source: trailSourceId(id),
          paint: {
            'line-color': spec.color,
            'line-width': (spec.widthPx ?? 3) * 2,
            'line-opacity': 0.4,
            'line-blur': 2,
          },
          layout: { 'line-cap': 'round', 'line-join': 'round' },
        } as LayerSpecification,
        beforeId
      );
    }
    map.addLayer(
      {
        id: `tracer-line-${id}`,
        type: 'line',
        source: trailSourceId(id),
        paint: {
          'line-color': spec.color,
          'line-width': spec.widthPx ?? 3,
          'line-opacity': 0.95,
        },
        layout: { 'line-cap': 'round', 'line-join': 'round' },
      } as LayerSpecification,
      beforeId
    );
    map.addLayer(
      {
        id: `tracer-head-${id}`,
        type: 'circle',
        source: headSourceId(id),
        paint: {
          'circle-radius': (spec.widthPx ?? 3) + 2,
          'circle-color': spec.color,
          'circle-opacity': 0.95,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 1.5,
          'circle-blur': 0.2,
        },
      } as LayerSpecification,
      beforeId
    );
  }

  function start(id: string): void {
    if (running.has(id)) return;
    const route = prepared.get(id);
    if (!route) return;
    const { spec, coords, cumDist } = route;
    const startTs = performance.now();
    const ease = spec.easing === 'easeInOut' ? easeInOut : (t: number) => t;
    const tick = (now: number): void => {
      const elapsed = (now - startTs) % spec.durationMs;
      const t = ease(elapsed / spec.durationMs);
      const { head, trail } = interpolateAlong(coords, cumDist, t);
      const trailFeature: GeoJSON.Feature<GeoJSON.LineString> = {
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: trail },
        properties: {},
      };
      const headFeature: GeoJSON.Feature<GeoJSON.Point> = {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: head },
        properties: {},
      };
      const trailSrc = map.getSource(trailSourceId(id)) as GeoJSONSource | undefined;
      const headSrc = map.getSource(headSourceId(id)) as GeoJSONSource | undefined;
      trailSrc?.setData(trailFeature);
      headSrc?.setData(headFeature);
      const handle = requestAnimationFrame(tick);
      running.set(id, handle);
    };
    const handle = requestAnimationFrame(tick);
    running.set(id, handle);
  }

  function stop(id: string): void {
    const handle = running.get(id);
    if (handle !== undefined) cancelAnimationFrame(handle);
    running.delete(id);
    const trailSrc = map.getSource(trailSourceId(id)) as GeoJSONSource | undefined;
    const headSrc = map.getSource(headSourceId(id)) as GeoJSONSource | undefined;
    trailSrc?.setData(emptyLine());
    headSrc?.setData(emptyPoint());
  }

  function activate(ids: string[]): void {
    const next = new Set(ids);
    for (const id of running.keys()) if (!next.has(id)) stop(id);
    for (const id of ids) start(id);
  }

  function stopAll(): void {
    for (const id of Array.from(running.keys())) stop(id);
  }

  return { ids: Array.from(prepared.keys()), activate, stopAll };
}
