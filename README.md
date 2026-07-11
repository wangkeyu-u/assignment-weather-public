# Weather Map UI

A mobile-first React weather map inspired by the supplied design reference. It uses Leaflet with OpenStreetMap tiles, together with weather-layer controls, location and zoom actions, a rain-intensity legend, an animated timeline, bottom navigation, and weather-responsive Web Audio API button sounds.

## Open the website

After the GitHub Pages workflow has completed, the website is available at:

```text
https://wangkeyu-u.github.io/assignment-weather-public/
```

No installation or API key is required to view the interface. The application loads OpenStreetMap tiles directly and includes the required map attribution.

## Run locally

```bash
npm install
npm run dev
```

Open the local address printed by Vite, usually `http://localhost:5173`.

No environment variable is required for the map. The Satellite layer uses Esri World Imagery, while the remaining layers use OpenStreetMap as the base map and application-level weather overlays.

## Project structure

- `src/App.jsx` — Page layout, UI state, timeline playback, and navigation interactions.
- `src/OpenStreetWeatherMap.jsx` — Leaflet map initialization, OpenStreetMap/Esri tile switching, geolocation, marker handling, and zoom controls.
- `src/useButtonSound.js` — Short generated feedback sounds using Web Audio API; no audio file is required.
- `src/styles.css` — Mobile-first visual system, weather overlays, map preview, and responsive rules.

## Interactions

- **Radar / Satellite / Wind / Rainfall** switch the visible map treatment.
- The **location chip** recenters the map on Sunway, Selangor.
- **+ / −** control the Leaflet map zoom.
- The **play button and slider** animate or scrub the weather time.
- The **bottom navigation** updates its selected state.
- Primary controls play a short, low-volume interaction sound.

## Production build

```bash
npm run build
npm run preview
```
