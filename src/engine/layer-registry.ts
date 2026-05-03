import type { Map as MapboxMap, LayerSpecification } from 'mapbox-gl';
import type { LayerSpec, SiteSpec } from './schema';
import { resolveContentAsset } from './asset-resolver';

type AnyLayer = LayerSpecification;

export interface LayerRegistry {
  ids: string[];
  apply(showIds: string[], hideIds: string[]): void;
  setBaselineHidden(): void;
}

async function loadIcon(map: MapboxMap, name: string, url: string): Promise<void> {
  if (map.hasImage(name)) return;
  return new Promise((resolve, reject) => {
    map.loadImage(url, (err, image) => {
      if (err) {
        reject(err);
        return;
      }
      if (image && !map.hasImage(name)) map.addImage(name, image);
      resolve();
    });
  });
}

export async function buildLayerRegistry(
  map: MapboxMap,
  site: SiteSpec
): Promise<LayerRegistry> {
  const layers = site.layers ?? {};
  const sourceIds = new Map<string, string>();

  // Pre-load icons.
  const iconPromises: Promise<void>[] = [];
  for (const spec of Object.values(layers)) {
    if (spec.icons) {
      for (const [name, url] of Object.entries(spec.icons)) {
        iconPromises.push(loadIcon(map, name, resolveContentAsset(url)));
      }
    }
  }
  await Promise.all(iconPromises);

  // Add sources (deduped). A `ref` source resolves to another layer's source id.
  for (const [id, spec] of Object.entries(layers)) {
    if ('ref' in spec.source) continue;
    const sourceId = `src-${id}`;
    if (!map.getSource(sourceId)) {
      map.addSource(sourceId, {
        type: 'geojson',
        data: resolveContentAsset(spec.source.data),
      });
    }
    sourceIds.set(id, sourceId);
  }
  for (const [id, spec] of Object.entries(layers)) {
    if ('ref' in spec.source) {
      const refSourceId = sourceIds.get(spec.source.ref);
      if (!refSourceId) {
        throw new Error(
          `Layer "${id}" references unknown source "${spec.source.ref}". Define the referenced layer first.`
        );
      }
      sourceIds.set(id, refSourceId);
    }
  }

  // Add layers in declared order.
  for (const [id, spec] of Object.entries(layers)) {
    addLayer(map, id, spec, sourceIds.get(id)!);
  }

  function setBaselineHidden(): void {
    for (const id of Object.keys(layers)) {
      if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', 'none');
    }
  }

  function apply(showIds: string[], hideIds: string[]): void {
    const show = new Set(showIds);
    const hide = new Set(hideIds);
    for (const id of Object.keys(layers)) {
      if (!map.getLayer(id)) continue;
      if (show.has(id)) map.setLayoutProperty(id, 'visibility', 'visible');
      else if (hide.has(id)) map.setLayoutProperty(id, 'visibility', 'none');
    }
  }

  return { ids: Object.keys(layers), apply, setBaselineHidden };
}

function addLayer(map: MapboxMap, id: string, spec: LayerSpec, sourceId: string): void {
  if (map.getLayer(id)) return;
  const layer: AnyLayer = {
    id,
    type: spec.type,
    source: sourceId,
    ...(spec.paint ? { paint: spec.paint as Record<string, unknown> } : {}),
    ...(spec.layout ? { layout: spec.layout as Record<string, unknown> } : { layout: {} }),
    ...(spec.filter ? { filter: spec.filter as unknown[] } : {}),
    ...(spec.minzoom !== undefined ? { minzoom: spec.minzoom } : {}),
    ...(spec.maxzoom !== undefined ? { maxzoom: spec.maxzoom } : {}),
  } as unknown as AnyLayer;
  const beforeId = spec.beforeId && map.getLayer(spec.beforeId) ? spec.beforeId : undefined;
  map.addLayer(layer, beforeId);
}
