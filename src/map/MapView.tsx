import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import type { SiteSpec } from '../engine/schema';
import { resolveMapboxToken } from '../engine/site-config';
import { buildLayerRegistry } from '../engine/layer-registry';
import { buildTracerController } from './Tracer';
import { useMapContext } from './MapProvider';

interface MapViewProps {
  site: SiteSpec;
}

export function MapView({ site }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { setMap, setLayers, setTracers, setReady } = useMapContext();
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    if (!containerRef.current) return;
    const token = resolveMapboxToken(site);
    if (!token) {
      setReady(false);
      return;
    }
    initializedRef.current = true;
    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: site.mapbox.style,
      center: site.initialCamera.center,
      zoom: site.initialCamera.zoom ?? 12,
      pitch: site.initialCamera.pitch ?? 0,
      bearing: site.initialCamera.bearing ?? 0,
      attributionControl: true,
    });
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
    setMap(map);

    map.on('load', async () => {
      const layers = await buildLayerRegistry(map, site);
      const tracers = await buildTracerController(map, site);
      setLayers(layers);
      setTracers(tracers);
      setReady(true);
    });

    return () => {
      map.remove();
      setMap(null);
      setLayers(null);
      setTracers(null);
      setReady(false);
      initializedRef.current = false;
    };
  }, [site, setLayers, setMap, setReady, setTracers]);

  const token = resolveMapboxToken(site);
  if (!token) {
    return (
      <div className="map-container">
        <div className="map-config-error">
          <h2>Mapbox token missing</h2>
          <p>
            Set <code>{site.mapbox.tokenEnvVar}</code> in <code>.env.local</code> (dev) or as a
            repository secret (CI).
          </p>
        </div>
      </div>
    );
  }
  return <div ref={containerRef} className="map-container" aria-hidden />;
}
