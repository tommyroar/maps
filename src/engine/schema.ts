import { z } from 'zod';

export const lngLat = z.tuple([z.number(), z.number()]);

const cameraStep = z.object({
  center: lngLat,
  zoom: z.number().optional(),
  pitch: z.number().min(0).max(85).optional(),
  bearing: z.number().optional(),
  durationMs: z.number().positive().optional(),
  easing: z.enum(['linear', 'easeIn', 'easeOut', 'easeInOut']).optional(),
  hold: z.number().nonnegative().optional(),
});
export type CameraStep = z.infer<typeof cameraStep>;

export const cameraSpec = z.union([cameraStep, z.object({ steps: z.array(cameraStep).min(1) })]);
export type CameraSpec = z.infer<typeof cameraSpec>;

const layerSourceInline = z.object({
  type: z.literal('geojson'),
  data: z.string(),
});
const layerSourceRef = z.object({ ref: z.string() });
const layerSource = z.union([layerSourceInline, layerSourceRef]);

export const layerSpec = z.object({
  source: layerSource,
  type: z.enum(['circle', 'line', 'fill', 'symbol', 'heatmap', 'fill-extrusion']),
  paint: z.record(z.string(), z.unknown()).optional(),
  layout: z.record(z.string(), z.unknown()).optional(),
  filter: z.array(z.unknown()).optional(),
  icons: z.record(z.string(), z.string()).optional(),
  beforeId: z.string().optional(),
  minzoom: z.number().optional(),
  maxzoom: z.number().optional(),
});
export type LayerSpec = z.infer<typeof layerSpec>;

export const routeSpec = z.object({
  file: z.string(),
  color: z.string(),
  widthPx: z.number().positive().optional(),
  durationMs: z.number().positive(),
  smooth: z.enum(['none', 'chaikin']).optional(),
  smoothIterations: z.number().int().min(1).max(5).optional(),
  glow: z.boolean().optional(),
  easing: z.enum(['linear', 'easeInOut']).optional(),
  beforeId: z.string().optional(),
});
export type RouteSpec = z.infer<typeof routeSpec>;

export const siteSpec = z.object({
  title: z.string(),
  shortTitle: z.string().optional(),
  description: z.string().optional(),
  mapbox: z.object({
    tokenEnvVar: z.string().default('VITE_MAPBOX_TOKEN'),
    style: z.string().default('mapbox://styles/mapbox/light-v11'),
  }),
  initialCamera: cameraStep,
  theme: z
    .object({
      primary: z.string().optional(),
      accent: z.string().optional(),
      font: z.string().optional(),
      backgroundCard: z.string().optional(),
      foreground: z.string().optional(),
    })
    .optional(),
  routing: z.object({ mode: z.enum(['hash', 'history']).default('hash') }).default({ mode: 'hash' }),
  layers: z.record(z.string(), layerSpec).default({}),
  routes: z.record(z.string(), routeSpec).default({}),
  footer: z.object({ aboutMd: z.string().optional() }).optional(),
});
export type SiteSpec = z.infer<typeof siteSpec>;

const photoSliderSpec = z.object({
  before: z.string(),
  after: z.string(),
  options: z
    .array(z.object({ id: z.string(), src: z.string(), label: z.string() }))
    .optional(),
});

const overlaysSpec = z
  .object({
    photoSlider: photoSliderSpec.optional(),
    photos: z.array(z.object({ src: z.string(), alt: z.string().optional(), caption: z.string().optional() })).optional(),
  })
  .optional();

export const chapterFrontmatter = z.object({
  slug: z.string().optional(),
  title: z.string(),
  subtitle: z.string().optional(),
  icon: z.string().optional(),
  iconColor: z.string().optional(),
  camera: cameraSpec.optional(),
  layers: z
    .object({
      show: z.array(z.string()).default([]),
      hide: z.array(z.string()).default([]),
    })
    .optional(),
  tracers: z.object({ activate: z.array(z.string()).default([]) }).optional(),
  overlays: overlaysSpec,
  cta: z.object({ label: z.string(), href: z.string() }).optional(),
  hero: z.boolean().optional(),
});
export type ChapterFrontmatter = z.infer<typeof chapterFrontmatter>;
