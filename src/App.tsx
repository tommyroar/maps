import { useEffect, useMemo, useState } from 'react';
import { loadSiteConfig } from './engine/site-config';
import { loadChapters } from './engine/content-loader';
import { MapProvider } from './map/MapProvider';
import { MapView } from './map/MapView';
import { ScrollyTeller } from './scrolly/ScrollyTeller';

export function App() {
  const [error, setError] = useState<string | null>(null);
  const [bundle, setBundle] = useState<{
    site: ReturnType<typeof loadSiteConfig>;
    chapters: ReturnType<typeof loadChapters>;
  } | null>(null);

  useEffect(() => {
    try {
      const site = loadSiteConfig();
      const chapters = loadChapters();
      setBundle({ site, chapters });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  const themeStyle = useMemo<React.CSSProperties | undefined>(() => {
    if (!bundle?.site.theme) return undefined;
    const t = bundle.site.theme;
    const out: Record<string, string> = {};
    if (t.primary) out['--color-primary'] = t.primary;
    if (t.accent) out['--color-accent'] = t.accent;
    if (t.foreground) out['--color-foreground'] = t.foreground;
    if (t.backgroundCard) out['--color-card'] = t.backgroundCard;
    if (t.font) out['--font-body'] = t.font;
    return out as React.CSSProperties;
  }, [bundle]);

  if (error) {
    return (
      <div className="map-config-error">
        <h2>Configuration error</h2>
        <pre style={{ whiteSpace: 'pre-wrap', textAlign: 'left' }}>{error}</pre>
      </div>
    );
  }
  if (!bundle) return null;

  if (bundle.chapters.length === 0) {
    return (
      <div className="map-config-error">
        <h2>No chapters</h2>
        <p>
          Add at least one chapter at <code>content/chapters/&lt;NN-slug&gt;/content.md</code>.
        </p>
      </div>
    );
  }

  return (
    <div className="app-shell" style={themeStyle}>
      <MapProvider>
        <MapView site={bundle.site} />
        <ScrollyTeller chapters={bundle.chapters} />
      </MapProvider>
    </div>
  );
}
