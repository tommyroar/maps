---
title: "A guided tour"
subtitle: "Multi-step camera and an animated tracer."
icon: Route
iconColor: "#f59e0b"
camera:
  steps:
    - center: [-122.3493, 47.6205]
      zoom: 13.5
      pitch: 45
      bearing: 20
      durationMs: 2500
    - center: [-122.2986, 47.5921]
      zoom: 14.5
      pitch: 60
      bearing: 90
      durationMs: 3000
layers:
  show: [highlight-route]
tracers:
  activate: [sample]
cta:
  label: "Star the repo"
  href: "https://github.com/tommyroar/maps"
---
Multi-step camera flights chain together: each `step` flies to a new viewpoint.
The `sample` route tracer lights up while this chapter is active and stops
automatically when you scroll away.

Add photos to this directory and reference them with relative paths:

`![alt text](./photo.jpg)`

…or use the photo-slider overlay (see chapter 3).
