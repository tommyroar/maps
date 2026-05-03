import type { Map as MapboxMap, GeoJSONSource, LayerSpecification } from 'mapbox-gl';
import type { RouteSegment, RouteSpec, SiteSpec } from '../engine/schema';
import { resolveContentAsset } from '../engine/asset-resolver';
import { chaikin, cumulativeDistances, easeInOut, interpolateAlong, type Coord } from '../engine/geometry';

interface PreparedSegment {
  index: number;
  color: string;
  coreColor: string;
  coords: Coord[];
}
interface PreparedRoute {
  id: string;
  spec: RouteSpec;
  segments: PreparedSegment[];
  combinedCoords: Coord[];
  combinedCumDist: number[];
  lineLayerIds: string[];
  headLayerIds: string[];
  trailSourceIds: string[];
  headSourceId: string;
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

function emptyPoint(): GeoJSON.Feature<GeoJSON.Point> {
  return { type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0] }, properties: {} };
}

function lineFeature(coords: Coord[]): GeoJSON.Feature<GeoJSON.LineString> {
  return { type: 'Feature', geometry: { type: 'LineString', coordinates: coords }, properties: {} };
}

function setLayerVisibility(map: MapboxMap, layerId: string, visible: boolean): void {
  if (map.getLayer(layerId)) map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
}

function effectiveSegments(spec: RouteSpec): RouteSegment[] {
  if (spec.segments && spec.segments.length > 0) return spec.segments;
  return [{ file: spec.file!, color: spec.color!, coreColor: spec.coreColor }];
}

function addGlowLineLayers(
  map: MapboxMap,
  baseId: string,
  sourceId: string,
  segment: PreparedSegment,
  spec: RouteSpec,
  beforeId: string | undefined
): string[] {
  const ids: string[] = [];
  const cap: Record<string, unknown> = { 'line-cap': 'round', 'line-join': 'round', visibility: 'none' };
  if (spec.glow) {
    const outer = `${baseId}-glow-outer`;
    const mid = `${baseId}-glow-mid`;
    const inner = `${baseId}-glow-inner`;
    map.addLayer(
      {
        id: outer,
        type: 'line',
        source: sourceId,
        layout: cap,
        paint: { 'line-width': 28, 'line-color': segment.color, 'line-opacity': 0.07, 'line-blur': 14 },
      } as LayerSpecification,
      beforeId
    );
    map.addLayer(
      {
        id: mid,
        type: 'line',
        source: sourceId,
        layout: cap,
        paint: { 'line-width': 12, 'line-color': segment.color, 'line-opacity': 0.2, 'line-blur': 5 },
      } as LayerSpecification,
      beforeId
    );
    map.addLayer(
      {
        id: inner,
        type: 'line',
        source: sourceId,
        layout: cap,
        paint: { 'line-width': 5, 'line-color': segment.color, 'line-opacity': 0.65 },
      } as LayerSpecification,
      beforeId
    );
    ids.push(outer, mid, inner);
  }
  const core = `${baseId}-core`;
  map.addLayer(
    {
      id: core,
      type: 'line',
      source: sourceId,
      layout: cap,
      paint: {
        'line-width': spec.glow ? 1.5 : (spec.widthPx ?? 3),
        'line-color': segment.coreColor,
        'line-opacity': 0.95,
      },
    } as LayerSpecification,
    beforeId
  );
  ids.push(core);
  return ids;
}

function addHeadLayers(
  map: MapboxMap,
  baseId: string,
  sourceId: string,
  primary: string,
  stroke: string,
  spec: RouteSpec,
  beforeId: string | undefined
): string[] {
  const ids: string[] = [];
  const layoutHidden = { visibility: 'none' as const };
  if (spec.glow) {
    const halo3 = `${baseId}-pt-halo-3`;
    const halo2 = `${baseId}-pt-halo-2`;
    const halo1 = `${baseId}-pt-halo-1`;
    map.addLayer(
      {
        id: halo3,
        type: 'circle',
        source: sourceId,
        layout: layoutHidden,
        paint: { 'circle-radius': 28, 'circle-color': primary, 'circle-opacity': 0.07, 'circle-blur': 1 },
      } as LayerSpecification,
      beforeId
    );
    map.addLayer(
      {
        id: halo2,
        type: 'circle',
        source: sourceId,
        layout: layoutHidden,
        paint: { 'circle-radius': 14, 'circle-color': primary, 'circle-opacity': 0.25 },
      } as LayerSpecification,
      beforeId
    );
    map.addLayer(
      {
        id: halo1,
        type: 'circle',
        source: sourceId,
        layout: layoutHidden,
        paint: { 'circle-radius': 8, 'circle-color': primary, 'circle-opacity': 0.55 },
      } as LayerSpecification,
      beforeId
    );
    ids.push(halo3, halo2, halo1);
  }
  const core = `${baseId}-pt-core`;
  map.addLayer(
    {
      id: core,
      type: 'circle',
      source: sourceId,
      layout: layoutHidden,
      paint: {
        'circle-radius': 5,
        'circle-color': '#ffffff',
        'circle-opacity': 1,
        'circle-stroke-width': 2.5,
        'circle-stroke-color': stroke,
      },
    } as LayerSpecification,
    beforeId
  );
  ids.push(core);
  return ids;
}

export async function buildTracerController(
  map: MapboxMap,
  site: SiteSpec
): Promise<TracerController> {
  const routes = site.routes ?? {};
  const prepared = new Map<string, PreparedRoute>();
  const running = new Map<string, number>();

  for (const [id, spec] of Object.entries(routes)) {
    const segs = effectiveSegments(spec);
    const segments: PreparedSegment[] = [];
    let combined: Coord[] = [];
    for (let i = 0; i < segs.length; i += 1) {
      const seg = segs[i];
      const raw = await fetchCoords(seg.file);
      const coords = spec.smooth === 'chaikin' ? chaikin(raw, spec.smoothIterations ?? 3) : raw;
      segments.push({
        index: i,
        color: seg.color,
        coreColor: seg.coreColor ?? deriveCoreColor(seg.color),
        coords,
      });
      // Concatenate; skip first point of subsequent segments if it duplicates previous end.
      if (i === 0) combined = coords.slice();
      else {
        const last = combined[combined.length - 1];
        const first = coords[0];
        const dup = last && first && last[0] === first[0] && last[1] === first[1];
        combined.push(...(dup ? coords.slice(1) : coords));
      }
    }
    const combinedCumDist = cumulativeDistances(combined);

    const beforeId = spec.beforeId && map.getLayer(spec.beforeId) ? spec.beforeId : undefined;
    const lineLayerIds: string[] = [];
    const trailSourceIds: string[] = [];

    segments.forEach((segment, i) => {
      const sourceId = `tracer-line-src-${id}-${i}`;
      map.addSource(sourceId, { type: 'geojson', data: lineFeature(segment.coords) });
      trailSourceIds.push(sourceId);
      const baseId = `tracer-line-${id}-${i}`;
      const ids = addGlowLineLayers(map, baseId, sourceId, segment, spec, beforeId);
      lineLayerIds.push(...ids);
    });

    const headSourceId = `tracer-head-src-${id}`;
    map.addSource(headSourceId, { type: 'geojson', data: emptyPoint() });
    const headPrimary = spec.headColor ?? segments[segments.length - 1].color;
    const headStroke = spec.headStrokeColor ?? headPrimary;
    const headLayerIds = addHeadLayers(map, `tracer-${id}`, headSourceId, headPrimary, headStroke, spec, beforeId);

    prepared.set(id, {
      id,
      spec,
      segments,
      combinedCoords: combined,
      combinedCumDist,
      lineLayerIds,
      headLayerIds,
      trailSourceIds,
      headSourceId,
    });
  }

  function setRouteVisible(route: PreparedRoute, visible: boolean): void {
    for (const lid of route.lineLayerIds) setLayerVisibility(map, lid, visible);
    for (const lid of route.headLayerIds) setLayerVisibility(map, lid, visible);
  }

  function start(id: string): void {
    if (running.has(id)) return;
    const route = prepared.get(id);
    if (!route) return;
    const { spec, combinedCoords, combinedCumDist } = route;
    setRouteVisible(route, true);
    const travelMs = spec.durationMs;
    const pauseMs = spec.pauseMs ?? 0;
    const cycleMs = travelMs + pauseMs;
    const startTs = performance.now();
    const ease = spec.easing === 'easeInOut' || spec.easing === undefined ? easeInOut : (t: number) => t;
    const tick = (now: number): void => {
      const elapsed = (now - startTs) % cycleMs;
      const raw = Math.min(elapsed / travelMs, 1);
      const t = ease(raw);
      const { head } = interpolateAlong(combinedCoords, combinedCumDist, t);
      const headFeature: GeoJSON.Feature<GeoJSON.Point> = {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: head },
        properties: {},
      };
      const headSrc = map.getSource(route.headSourceId) as GeoJSONSource | undefined;
      headSrc?.setData(headFeature);
      const handle = requestAnimationFrame(tick);
      running.set(id, handle);
    };
    const handle = requestAnimationFrame(tick);
    running.set(id, handle);
  }

  function stop(id: string): void {
    const route = prepared.get(id);
    const handle = running.get(id);
    if (handle !== undefined) cancelAnimationFrame(handle);
    running.delete(id);
    if (route) setRouteVisible(route, false);
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

function deriveCoreColor(color: string): string {
  // Default core stripe is a near-white tint of the route color.
  // For unknown formats, just return the input.
  return tintColor(color, 0.85);
}

function tintColor(color: string, amount: number): string {
  const hex = color.startsWith('#') ? color.slice(1) : color;
  if (hex.length !== 6) return color;
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const mix = (c: number) => Math.round(c + (255 - c) * amount);
  return `#${[mix(r), mix(g), mix(b)].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}
