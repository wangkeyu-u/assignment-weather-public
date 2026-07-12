import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import WeatherEffects from './WeatherEffects';

const SUNWAY = { lat: 3.0687, lng: 101.6032 };
const ROAD_TILES = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const SATELLITE_TILES = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

function tileConfig(layer) {
  if (layer === 'Satellite') {
    return {
      url: SATELLITE_TILES,
      attribution: 'Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics',
    };
  }

  return {
    url: ROAD_TILES,
    attribution: '© OpenStreetMap contributors',
  };
}

const OpenStreetWeatherMap = forwardRef(function OpenStreetWeatherMap({ layer, severity, onZoneClick }, ref) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const tileLayerRef = useRef(null);
  const [mapInstance, setMapInstance] = useState(null);

  useImperativeHandle(ref, () => ({
    zoomIn: () => mapRef.current?.zoomIn(),
    zoomOut: () => mapRef.current?.zoomOut(),
    recenter: () => {
      mapRef.current?.setView(SUNWAY, 14, { animate: true });
      markerRef.current?.setLatLng(SUNWAY);
    },
    locateUser: () => new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          const position = { lat: coords.latitude, lng: coords.longitude };
          mapRef.current?.setView(position, 14, { animate: true });
          markerRef.current?.setLatLng(position);
          resolve(position);
        },
        reject,
        { enableHighAccuracy: true, timeout: 8_000, maximumAge: 60_000 },
      );
    }),
  }));

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return undefined;

    const map = L.map(containerRef.current, {
      center: SUNWAY,
      zoom: 14,
      zoomControl: false,
      attributionControl: true,
    });
    mapRef.current = map;
    setMapInstance(map);

    const config = tileConfig(layer);
    tileLayerRef.current = L.tileLayer(config.url, {
      attribution: config.attribution,
      maxZoom: 19,
    }).addTo(map);

    markerRef.current = L.circleMarker(SUNWAY, {
      radius: 12,
      color: '#ffffff',
      weight: 7,
      fillColor: '#9ebbed',
      fillOpacity: 0.95,
    }).addTo(map);

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
      tileLayerRef.current = null;
      setMapInstance(null);
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !tileLayerRef.current) return;
    const config = tileConfig(layer);
    mapRef.current.removeLayer(tileLayerRef.current);
    tileLayerRef.current = L.tileLayer(config.url, {
      attribution: config.attribution,
      maxZoom: 19,
    }).addTo(mapRef.current);
  }, [layer]);

  return (
    <div className="map-canvas-wrap">
      <div ref={containerRef} className="leaflet-map" aria-label="OpenStreetMap centered on Sunway, Selangor" />
      <div className={`weather-wash weather-wash--${layer.toLowerCase()}`} style={{ '--weather-strength': severity }} aria-hidden="true" />
      <WeatherEffects map={mapInstance} layer={layer} severity={severity} onZoneClick={onZoneClick} />
    </div>
  );
});

export default OpenStreetWeatherMap;
