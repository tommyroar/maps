import { useCallback, useRef } from 'react';
import type { Map as MapboxMap } from 'mapbox-gl';
import type { CameraSpec, CameraStep } from '../engine/schema';

const EASING_FNS: Record<string, (t: number) => number> = {
  linear: (t) => t,
  easeIn: (t) => t * t,
  easeOut: (t) => 1 - (1 - t) * (1 - t),
  easeInOut: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
};

function isMultiStep(camera: CameraSpec): camera is { steps: CameraStep[] } {
  return Object.prototype.hasOwnProperty.call(camera, 'steps');
}

function flyOnce(map: MapboxMap, step: CameraStep): Promise<void> {
  return new Promise((resolve) => {
    const easing = step.easing ? EASING_FNS[step.easing] : undefined;
    const onEnd = () => {
      map.off('moveend', onEnd);
      resolve();
    };
    map.on('moveend', onEnd);
    map.flyTo({
      center: step.center,
      zoom: step.zoom,
      pitch: step.pitch,
      bearing: step.bearing,
      duration: step.durationMs ?? 2000,
      essential: true,
      ...(easing ? { easing } : {}),
    });
  });
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export function useMapCamera(map: MapboxMap | null) {
  const tokenRef = useRef(0);

  const run = useCallback(
    async (camera: CameraSpec | undefined): Promise<void> => {
      if (!map || !camera) return;
      const myToken = ++tokenRef.current;
      const steps = isMultiStep(camera) ? camera.steps : [camera];
      for (const step of steps) {
        if (myToken !== tokenRef.current) return;
        await flyOnce(map, step);
        if (step.hold && step.hold > 0) await delay(step.hold);
      }
    },
    [map]
  );

  const cancel = useCallback(() => {
    tokenRef.current += 1;
  }, []);

  return { run, cancel };
}
