---
title: "Welcome"
subtitle: "A starter chapter showing single-step camera and layer toggle."
icon: MapPin
iconColor: "#0ea5e9"
camera:
  center: [-122.3321, 47.6062]
  zoom: 12
  pitch: 30
  bearing: 0
  durationMs: 2200
layers:
  show: [highlight-route]
hero: true
---
This is the first chapter. Replace `content/chapters/` with your own directories
named `NN-slug` (the numeric prefix sets order; the slug becomes the URL hash).

Each chapter's frontmatter drives the map:

- `camera` for a single fly-to,
- `camera: { steps: [...] }` for a multi-step sequence,
- `layers.show` / `layers.hide` to toggle layers declared in `site.yaml`,
- `tracers.activate` to start animated route tracers.
