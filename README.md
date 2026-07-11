# Weather Map UI

A mobile-first React weather map inspired by the supplied design reference. It includes Google Maps integration, weather-layer controls, location and zoom actions, a rain-intensity legend, an animated timeline, bottom navigation, and subtle Web Audio API button sounds.

## Open the website

After the GitHub Pages workflow has completed, the website is available at:

```text
https://wangkeyu-u.github.io/assignment-weather-public/
```

No installation or API key is required to view the interface. Without a valid Google Maps API key, the application displays a functional styled map preview.

## Run locally

```bash
npm install
npm run dev
```

Open the local address printed by Vite, usually `http://localhost:5173`.

The `.env` file is optional. It is only required when using a live Google Map.

## Configure Google Maps

1. In Google Cloud Console, enable **Maps JavaScript API** for your project.
2. Create a browser-restricted API key and restrict it to **Maps JavaScript API**.
3. Add the key to `.env`:

```env
VITE_GOOGLE_MAPS_API_KEY=AIza...
```

Restart the development server after changing `.env`.

On Windows, create the file with:

```bat
copy .env.example .env
```

The key is intentionally excluded from Git through `.gitignore`. When no key is present, or its format is invalid, the UI keeps working with a styled map preview and an English status message.

## Project structure

- `src/App.jsx` — Page layout, UI state, timeline playback, and navigation interactions.
- `src/GoogleWeatherMap.jsx` — Google Maps script loading, map initialization, map-type switching, and key validation.
- `src/useButtonSound.js` — Short generated feedback sounds using Web Audio API; no audio file is required.
- `src/styles.css` — Mobile-first visual system, weather overlays, map preview, and responsive rules.

## Interactions

- **Radar / Satellite / Wind / Rainfall** switch the visible map treatment.
- The **location chip** recenters the map on Sunway, Selangor.
- **+ / −** control Google Maps zoom.
- The **play button and slider** animate or scrub the weather time.
- The **bottom navigation** updates its selected state.
- Primary controls play a short, low-volume interaction sound.

## Production build

```bash
npm run build
npm run preview
```
