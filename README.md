# Mapbox Scrollytelling Site Generator

A reusable Vite + React + TypeScript engine for Mapbox-driven scrollytelling sites. Drop a `content/` directory of YAML + markdown into a fork of this repo and you get a deployable static site with cinematic camera flights, layer toggles, route tracers, and photo sliders.

The engine extracts the shared shell from projects like
[JudkinsParkForPeople](https://github.com/tommyroar/JudkinsParkForPeople) and
[sporty40](https://github.com/tommyroar/sporty40).

## Quick start

```bash
cp .env.example .env.local        # add your Mapbox public token
npm install
npm run dev
```

## Authoring

Everything project-specific lives under `content/`:

```
content/
├── site.yaml                  # site-level config (style, layers, routes, theme)
├── about.md                   # optional, referenced from site.yaml.footer
├── chapters/
│   └── 01-intro/
│       ├── content.md         # frontmatter + markdown body
│       └── photo.jpg
├── data/                      # GeoJSON + icon assets referenced by site.yaml.layers
└── routes/                    # JSON coord arrays referenced by site.yaml.routes
```

To make a new project: fork this repo, replace `content/`, set `VITE_MAPBOX_TOKEN` and `VITE_BASE_PATH`, push.

### Site spec (`content/site.yaml`)

```yaml
title: My Story
mapbox:
  tokenEnvVar: VITE_MAPBOX_TOKEN
  style: mapbox://styles/mapbox/light-v11
initialCamera: { center: [-122.3, 47.6], zoom: 12, pitch: 30, bearing: 0 }
layers:
  myLayer:
    source: { type: geojson, data: /content/data/my.geojson }
    type: line
    paint: { line-color: "#f59e0b", line-width: 3 }
    layout: { visibility: none }
routes:
  myRoute: { file: /content/routes/my.json, color: "#22d3ee", durationMs: 6000, smooth: chaikin, glow: true }
```

### Chapter (`content/chapters/01-intro/content.md`)

```markdown
---
title: "The Beginning"
camera: { center: [-122.3, 47.6], zoom: 14, pitch: 45, bearing: 0, durationMs: 2500 }
layers: { show: [myLayer] }
tracers: { activate: [myRoute] }
overlays:
  photoSlider: { before: ./before.jpg, after: ./after.jpg }
icon: MapPin
cta: { label: "Learn more", href: "https://example.org" }
---
Markdown body. Images resolve relative to this file.
```

For a multi-step camera flight, use `camera: { steps: [...] }` instead of a single object.

## Build & deploy

```bash
npm run build          # outputs dist/
```

GitHub Pages deploy is configured at `.github/workflows/deploy.yml`. Set the
`VITE_MAPBOX_TOKEN` repository secret and `VITE_BASE_PATH` repository variable.

## Engine layout

```
src/
├── engine/      schema, site config, content loader, layer + route registries
├── map/         MapProvider, MapView, hooks, Tracer
├── scrolly/     ScrollyTeller, ChapterCard, hash router
├── components/  PhotoSlider, Markdown, ReturnToStart
└── styles/      tokens.css, app.css
```
