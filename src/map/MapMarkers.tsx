import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import mapboxgl from 'mapbox-gl';
import * as Icons from 'lucide-react';
import type { Chapter } from '../engine/content-loader';
import { useMapContext } from './MapProvider';

interface MapMarkersProps {
  chapters: Chapter[];
  activeSlug: string | null;
}

interface MarkerEntry {
  marker: mapboxgl.Marker;
  el: HTMLDivElement;
}

export function MapMarkers({ chapters, activeSlug }: MapMarkersProps) {
  const { map, ready } = useMapContext();
  const [entries, setEntries] = useState<Record<string, MarkerEntry>>({});

  useEffect(() => {
    if (!map || !ready) return;
    const next: Record<string, MarkerEntry> = {};
    for (const c of chapters) {
      if (!c.frontmatter.marker) continue;
      const el = document.createElement('div');
      el.className = 'chapter-marker';
      const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
        .setLngLat(c.frontmatter.marker.center)
        .addTo(map);
      next[c.slug] = { marker, el };
    }
    setEntries(next);
    return () => {
      for (const { marker } of Object.values(next)) marker.remove();
      setEntries({});
    };
  }, [map, ready, chapters]);

  return (
    <>
      {chapters.map((c) => {
        const entry = entries[c.slug];
        if (!entry || !c.frontmatter.marker) return null;
        return createPortal(
          <MarkerContent chapter={c} active={c.slug === activeSlug} />,
          entry.el,
          c.slug
        );
      })}
    </>
  );
}

function MarkerContent({ chapter, active }: { chapter: Chapter; active: boolean }) {
  const fm = chapter.frontmatter;
  const marker = fm.marker!;
  const bg = marker.emoji ? 'rgba(255,255,255,0.92)' : marker.color ?? fm.color ?? fm.iconColor ?? '#1e40af';
  const Icon = fm.icon
    ? (Icons as unknown as Record<string, React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>>)[
        fm.icon
      ]
    : null;
  return (
    <div
      className="chapter-marker-inner"
      style={{
        backgroundColor: bg,
        transform: active ? 'scale(1.3)' : 'scale(1)',
        transition: 'transform 0.3s ease',
      }}
    >
      {marker.emoji ? (
        <span style={{ fontSize: 20, lineHeight: 1 }}>{marker.emoji}</span>
      ) : Icon ? (
        <Icon size={17} color="white" strokeWidth={2.5} />
      ) : null}
    </div>
  );
}
