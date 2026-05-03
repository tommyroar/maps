import { describe, expect, it } from 'vitest';
import { loadSiteConfig } from './site-config';
import { loadChapters } from './content-loader';

describe('sporty40 content smoke', () => {
  it('parses site.yaml without errors', () => {
    const site = loadSiteConfig();
    expect(site.title).toBe('Sporty 40');
    expect(site.mapbox.style).toBe('mapbox://styles/mapbox/outdoors-v12');
    expect(site.initialCamera.center).toEqual([-128.0, 53.0]);
    expect(Object.keys(site.routes ?? {})).toEqual(
      expect.arrayContaining(['ferry', 'seaplane', 'alaska-highway'])
    );
  });

  it('parses ferry route as single-file', () => {
    const site = loadSiteConfig();
    const ferry = site.routes!.ferry;
    expect(ferry.file).toBeDefined();
    expect(ferry.color).toBe('#00e5ff');
    expect(ferry.durationMs).toBe(6000);
    expect(ferry.pauseMs).toBe(800);
    expect(ferry.glow).toBe(true);
  });

  it('parses alaska-highway as multi-segment', () => {
    const site = loadSiteConfig();
    const hwy = site.routes!['alaska-highway'];
    expect(hwy.segments).toBeDefined();
    expect(hwy.segments).toHaveLength(2);
    expect(hwy.segments![0].color).toBe('#00e5ff');
    expect(hwy.segments![1].color).toBe('#f97316');
    expect(hwy.headColor).toBe('#f97316');
    expect(hwy.durationMs).toBe(14000);
  });

  it('loads 6 chapters in order', () => {
    const chapters = loadChapters();
    expect(chapters).toHaveLength(6);
    const slugs = chapters.map((c) => c.slug);
    expect(slugs).toEqual(['intro', 'ferry', 'car', 'juneau-stay', 'taku-feast', 'alaska-highway']);
  });

  it('intro chapter is hero with simple camera', () => {
    const intro = loadChapters().find((c) => c.slug === 'intro')!;
    expect(intro.frontmatter.hero).toBe(true);
    expect(intro.frontmatter.title).toBe('Sporty 40');
    expect(intro.frontmatter.camera).toMatchObject({ center: [-128.0, 53.0], zoom: 5 });
  });

  it('ferry chapter has 4-step camera + ferry tracer + marker', () => {
    const ferry = loadChapters().find((c) => c.slug === 'ferry')!;
    const cam = ferry.frontmatter.camera as { steps: { center: [number, number] }[] };
    expect(cam.steps).toHaveLength(4);
    expect(cam.steps[3].center).toEqual([-134.42, 58.30]);
    expect(ferry.frontmatter.tracers?.activate).toEqual(['ferry']);
    expect(ferry.frontmatter.marker?.center).toEqual([-134.42, 58.30]);
  });

  it('car chapter has truck photo resolved to a Vite URL', () => {
    const car = loadChapters().find((c) => c.slug === 'car')!;
    expect(car.frontmatter.photos).toEqual([{ src: 'truck.jpg', alt: 'My truck' }]);
    expect(car.photos['truck.jpg']).toMatch(/truck.*\.jpg$/);
  });

  it('taku-feast chapter has seaplane tracer + emoji marker', () => {
    const taku = loadChapters().find((c) => c.slug === 'taku-feast')!;
    expect(taku.frontmatter.tracers?.activate).toEqual(['seaplane']);
    expect(taku.frontmatter.marker?.emoji).toBe('✈️');
  });

  it('alaska-highway chapter has 6-step camera + combined tracer', () => {
    const hwy = loadChapters().find((c) => c.slug === 'alaska-highway')!;
    const cam = hwy.frontmatter.camera as { steps: unknown[] };
    expect(cam.steps).toHaveLength(6);
    expect(hwy.frontmatter.tracers?.activate).toEqual(['alaska-highway']);
  });

  it('chapter body markdown is preserved with embedded links', () => {
    const ferry = loadChapters().find((c) => c.slug === 'ferry')!;
    expect(ferry.body).toContain('[Alaska Marine Highway]');
    expect(ferry.body).toContain('Queen Charlotte Sound');
    expect(ferry.body).toContain('62 hours');
  });
});
