---
title: "Before / After"
subtitle: "Photo slider example."
icon: SplitSquareHorizontal
camera:
  center: [-122.3155, 47.5988]
  zoom: 15
  pitch: 50
  bearing: 45
  durationMs: 2400
layers:
  hide: [highlight-route]
overlays:
  photoSlider:
    before: ./before.jpg
    after: ./after.jpg
---
Drop `before.jpg` and `after.jpg` next to this `content.md` to enable the slider.
For multi-overlay comparisons, add `options:` with additional images:

```yaml
overlays:
  photoSlider:
    before: ./before.jpg
    after:  ./after.jpg
    options:
      - { id: proposed, src: ./proposed.jpg, label: "Proposed" }
      - { id: alt,      src: ./alt.jpg,      label: "Alternative" }
```
