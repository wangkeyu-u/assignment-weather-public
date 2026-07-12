import { useEffect, useRef } from 'react';
import L from 'leaflet';

const SUNWAY = { lat: 3.0687, lng: 101.6032 };
const ZONE_OFFSETS = [
  [-0.012, -0.017], [-0.004, -0.008], [0.006, -0.014], [0.014, -0.004],
  [-0.015, 0.005], [-0.005, 0.012], [0.005, 0.006], [0.014, 0.014],
  [-0.011, 0.020], [0.000, 0.022], [0.018, 0.021], [-0.021, -0.006],
];

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function seeded(index) {
  const value = Math.sin(index * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

function severityColor(severity) {
  if (severity < 0.25) return 'rgba(60, 180, 75, 0.50)';
  if (severity < 0.5) return 'rgba(220, 210, 35, 0.55)';
  if (severity < 0.75) return 'rgba(245, 135, 25, 0.58)';
  return 'rgba(225, 45, 45, 0.62)';
}

function severityBorder(severity) {
  if (severity < 0.25) return 'rgba(40, 140, 55, 0.55)';
  if (severity < 0.5) return 'rgba(180, 170, 20, 0.55)';
  if (severity < 0.75) return 'rgba(200, 100, 10, 0.58)';
  return 'rgba(180, 25, 25, 0.60)';
}

function severityLabel(severity) {
  if (severity < 0.25) return 'Light';
  if (severity < 0.5) return 'Moderate';
  if (severity < 0.75) return 'Heavy';
  return 'Severe';
}

function generateZones(severity) {
  const count = 8 + Math.round(severity * 8);
  return Array.from({ length: count }, (_, index) => {
    const offset = ZONE_OFFSETS[index % ZONE_OFFSETS.length];
    const jitterLat = (seeded(index + 1) - 0.5) * 0.003;
    const jitterLng = (seeded(index + 101) - 0.5) * 0.003;
    const zoneSeverity = clamp(0.18 + severity * 0.65 + (seeded(index + 31) - 0.5) * 0.35, 0.08, 1);

    return {
      lat: SUNWAY.lat + offset[0] + jitterLat,
      lng: SUNWAY.lng + offset[1] + jitterLng,
      rxDeg: 0.003 + seeded(index + 201) * 0.006,
      ryDeg: 0.0025 + seeded(index + 301) * 0.005,
      sev: zoneSeverity,
    };
  });
}

function degreesToPixels(degrees, zoom, latitude) {
  return (degrees * 111320 * Math.cos((latitude * Math.PI) / 180)) / Math.pow(2, 17 - zoom);
}

const WeatherCircleLayer = L.Layer.extend({
  initialize(layerName, severity, onZoneClick) {
    this._layerName = layerName;
    this._severity = severity;
    this._onZoneClick = onZoneClick;
    this._zones = generateZones(severity);
    this._zoneBounds = [];
  },

  onAdd(map) {
    this._map = map;
    this._canvas = L.DomUtil.create('canvas', 'weather-leaflet-canvas');
    this._canvas.style.position = 'absolute';
    this._canvas.style.inset = '0';
    this._canvas.style.pointerEvents = 'none';
    this._canvas.style.zIndex = '500';
    map.getContainer().appendChild(this._canvas);
    this._ctx = this._canvas.getContext('2d');

    this._updateCanvasSize();
    this._draw();
    map.on('click', this._handleMapClick, this);
    map.on('moveend zoomend resize', this._onMapChange, this);
  },

  onRemove(map) {
    map.off('click', this._handleMapClick, this);
    map.off('moveend zoomend resize', this._onMapChange, this);
    L.DomUtil.remove(this._canvas);
  },

  setOnZoneClick(callback) {
    this._onZoneClick = callback;
  },

  setSeverity(severity) {
    this._severity = severity;
    this._zones = generateZones(severity);
    this._draw();
  },

  _onMapChange() {
    this._updateCanvasSize();
    this._draw();
  },

  _handleMapClick(event) {
    if (!this._onZoneClick) return;
    const point = this._map.latLngToContainerPoint(event.latlng);

    for (let index = this._zoneBounds.length - 1; index >= 0; index -= 1) {
      const zone = this._zoneBounds[index];
      const x = (point.x - zone.cx) / zone.rx;
      const y = (point.y - zone.cy) / zone.ry;
      if (x * x + y * y <= 1) {
        this._onZoneClick(zone.zone);
        return;
      }
    }
  },

  _updateCanvasSize() {
    const size = this._map.getSize();
    const devicePixelRatio = window.devicePixelRatio || 1;
    this._canvas.width = size.x * devicePixelRatio;
    this._canvas.height = size.y * devicePixelRatio;
    this._canvas.style.width = `${size.x}px`;
    this._canvas.style.height = `${size.y}px`;
    this._devicePixelRatio = devicePixelRatio;
    this._size = size;
  },

  _draw() {
    if (!this._map || !this._ctx) return;
    const dpr = this._devicePixelRatio || 1;
    const size = this._size || this._map.getSize();
    const zoom = this._map.getZoom();
    const context = this._ctx;
    context.clearRect(0, 0, size.x * dpr, size.y * dpr);
    context.save();
    context.scale(dpr, dpr);
    this._zoneBounds = [];

    for (const zone of this._zones) {
      const point = this._map.latLngToContainerPoint([zone.lat, zone.lng]);
      const rx = degreesToPixels(zone.rxDeg, zoom, zone.lat);
      const ry = degreesToPixels(zone.ryDeg, zoom, zone.lat);
      if (rx < 3 || ry < 3) continue;

      this._zoneBounds.push({ cx: point.x, cy: point.y, rx, ry, zone });
      context.beginPath();
      context.ellipse(point.x, point.y, rx, ry, 0, 0, Math.PI * 2);
      context.fillStyle = severityColor(zone.sev);
      context.fill();
      context.strokeStyle = severityBorder(zone.sev);
      context.lineWidth = Math.max(0.75, rx * 0.04);
      context.stroke();
    }

    context.restore();
  },
});

export default function WeatherEffects({ map, layer, severity, onZoneClick }) {
  const weatherLayerRef = useRef(null);

  useEffect(() => {
    if (!map) return undefined;
    if (layer !== 'Wind' && layer !== 'Rainfall') return undefined;

    const weatherLayer = new WeatherCircleLayer(layer, severity, onZoneClick);
    weatherLayer.addTo(map);
    weatherLayerRef.current = weatherLayer;

    return () => {
      map.removeLayer(weatherLayer);
      weatherLayerRef.current = null;
    };
  }, [map, layer]);

  useEffect(() => {
    weatherLayerRef.current?.setSeverity(severity);
  }, [severity]);

  useEffect(() => {
    weatherLayerRef.current?.setOnZoneClick(onZoneClick);
  }, [onZoneClick]);

  return null;
}

export { severityLabel };
