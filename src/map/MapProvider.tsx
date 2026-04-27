import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Map as MapboxMap } from 'mapbox-gl';
import type { LayerRegistry } from '../engine/layer-registry';
import type { TracerController } from './Tracer';

interface MapContextValue {
  map: MapboxMap | null;
  setMap: (m: MapboxMap | null) => void;
  layers: LayerRegistry | null;
  setLayers: (l: LayerRegistry | null) => void;
  tracers: TracerController | null;
  setTracers: (t: TracerController | null) => void;
  ready: boolean;
  setReady: (r: boolean) => void;
}

const MapContext = createContext<MapContextValue | null>(null);

export function MapProvider({ children }: { children: ReactNode }) {
  const [map, setMap] = useState<MapboxMap | null>(null);
  const [layers, setLayers] = useState<LayerRegistry | null>(null);
  const [tracers, setTracers] = useState<TracerController | null>(null);
  const [ready, setReady] = useState(false);
  const value = useMemo(
    () => ({ map, setMap, layers, setLayers, tracers, setTracers, ready, setReady }),
    [map, layers, tracers, ready]
  );
  return <MapContext.Provider value={value}>{children}</MapContext.Provider>;
}

export function useMapContext(): MapContextValue {
  const ctx = useContext(MapContext);
  if (!ctx) throw new Error('useMapContext must be used inside <MapProvider>');
  return ctx;
}
