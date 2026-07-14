# Weather Map UI / 天气地图界面

> 移动优先的 React 天气地图 —— Leaflet + OpenStreetMap 瓦片、天气图层控制、降雨强度图例、动画时间轴、底部导航、Web Audio API 交互音效。
>
> A mobile-first React weather map — Leaflet + OpenStreetMap tiles, weather-layer controls, rain-intensity legend, animated timeline, bottom navigation, and Web Audio API interaction sounds.

[![React](https://img.shields.io/badge/React-18-61DAFB)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-Build-646CFF)](https://vitejs.dev/)
[![Leaflet](https://img.shields.io/badge/Map-Leaflet-199900)](https://leafletjs.com/)
[![Deploy](https://img.shields.io/badge/GitHub%20Pages-live-orange)](https://wangkeyu-u.github.io/assignment-weather-public/)

---

## 项目简介（中文）

一个移动优先的 React 天气地图界面，灵感来自设计参考稿。使用 Leaflet 加载 OpenStreetMap 瓦片，提供天气图层切换（雷达/卫星/风/降雨）、定位芯片、缩放控制、降雨强度图例、动画时间轴播放、底部导航和天气响应式 Web Audio API 按钮音效。

**在线预览 / Live demo：** <https://wangkeyu-u.github.io/assignment-weather-public/>

无需安装或 API Key 即可查看界面。卫星图层使用 Esri World Imagery，其余图层使用 OpenStreetMap 作为底图。

---

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
