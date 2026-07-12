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

function severityLabel(severity) {
  if (severity < 0.25) return 'Light';
  if (severity < 0.5) return 'Moderate';
  if (severity < 0.75) return 'Heavy';
  return 'Severe';
}

function rainPalette(severity) {
  if (severity < 0.25) return [47, 135, 87];
  if (severity < 0.5) return [210, 188, 34];
  if (severity < 0.75) return [241, 128, 21];
  return [222, 48, 48];
}

function rgba([red, green, blue], alpha) {
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function generateZones(severity) {
  const count = 8 + Math.round(severity * 8);
  return Array.from({ length: count }, (_, index) => {
    const offset = ZONE_OFFSETS[index % ZONE_OFFSETS.length];
    const jitterLat = (seeded(index + 1) - 0.5) * 0.003;
    const jitterLng = (seeded(index + 101) - 0.5) * 0.003;
    const zoneSeverity = clamp(0.18 + severity * 0.65 + (seeded(index + 31) - 0.5) * 0.35, 0.08, 1);

    return {
      id: index,
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

function traceIrregularCell(context, cx, cy, rx, ry, seedIndex, time, scale = 1) {
  const points = 15;
  context.beginPath();

  for (let index = 0; index <= points; index += 1) {
    const angle = (index / points) * Math.PI * 2;
    const organicEdge = 0.76 + seeded(seedIndex * 41 + index * 17) * 0.34 + Math.sin(time / 2400 + seedIndex + angle * 3) * 0.045;
    const x = cx + Math.cos(angle) * rx * organicEdge * scale;
    const y = cy + Math.sin(angle) * ry * organicEdge * scale;

    if (index === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  }

  context.closePath();
}

function drawRainCell(context, zone, cx, cy, rx, ry, time) {
  const color = rainPalette(zone.sev);
  const pulse = 1 + Math.sin(time / 1700 + zone.id * 1.7) * 0.035;

  context.save();
  traceIrregularCell(context, cx, cy, rx, ry, zone.id, time, pulse);
  context.clip();

  const gradient = context.createRadialGradient(
    cx - rx * 0.16,
    cy - ry * 0.12,
    Math.min(rx, ry) * 0.08,
    cx,
    cy,
    Math.max(rx, ry) * 1.05,
  );
  gradient.addColorStop(0, rgba(color, 0.68));
  gradient.addColorStop(0.45, rgba(color, 0.42));
  gradient.addColorStop(0.82, rgba(color, 0.18));
  gradient.addColorStop(1, rgba(color, 0));
  context.fillStyle = gradient;
  context.fillRect(cx - rx * 1.2, cy - ry * 1.2, rx * 2.4, ry * 2.4);
  context.restore();

  if (zone.sev > 0.62) {
    context.save();
    traceIrregularCell(context, cx + rx * 0.1, cy - ry * 0.06, rx, ry, zone.id + 91, time, 0.48);
    context.fillStyle = rgba(color, 0.24);
    context.fill();
    context.restore();
  }
}

function drawWindField(context, size, severity, time) {
  const count = 22 + Math.round(severity * 30);
  const travel = (time / 1000) * (24 + severity * 34);

  context.save();
  context.lineCap = 'round';
  context.shadowBlur = 5;
  context.shadowColor = 'rgba(20, 102, 142, 0.28)';

  for (let index = 0; index < count; index += 1) {
    const lane = seeded(index + 701) * (size.y + 48) - 24;
    const span = size.x + 140;
    const x = ((seeded(index + 801) * span + travel * (0.55 + seeded(index + 901))) % span) - 70;
    const length = 44 + severity * 42 + seeded(index + 1001) * 22;
    const lift = (seeded(index + 1101) - 0.5) * 20;
    const color = severity > 0.68 ? 'rgba(15, 101, 144, 0.72)' : 'rgba(28, 130, 164, 0.62)';

    context.beginPath();
    context.moveTo(x, lane);
    context.quadraticCurveTo(x + length * 0.45, lane + lift, x + length, lane + lift * 0.2);
    context.strokeStyle = color;
    context.lineWidth = 1.4 + severity * 1.45;
    context.stroke();
  }

  context.restore();
}

const WeatherTextureLayer = L.Layer.extend({
  initialize(layerName, severity, onZoneClick) {
    this._layerName = layerName;
    this._severity = severity;
    this._onZoneClick = onZoneClick;
    this._zones = generateZones(severity);
    this._zoneBounds = [];
    this._frame = null;
    this._animate = this._animate.bind(this);
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
    this._draw(performance.now());
    map.on('click', this._handleMapClick, this);
    map.on('moveend zoomend resize', this._onMapChange, this);

    if (!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      this._frame = window.requestAnimationFrame(this._animate);
    }
  },

  onRemove(map) {
    map.off('click', this._handleMapClick, this);
    map.off('moveend zoomend resize', this._onMapChange, this);
    if (this._frame) window.cancelAnimationFrame(this._frame);
    L.DomUtil.remove(this._canvas);
  },

  setOnZoneClick(callback) {
    this._onZoneClick = callback;
  },

  setSeverity(severity) {
    this._severity = severity;
    this._zones = generateZones(severity);
    this._draw(performance.now());
  },

  _animate(timestamp) {
    this._draw(timestamp);
    this._frame = window.requestAnimationFrame(this._animate);
  },

  _onMapChange() {
    this._updateCanvasSize();
    this._draw(performance.now());
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

  _draw(time) {
    if (!this._map || !this._ctx) return;
    const dpr = this._devicePixelRatio || 1;
    const size = this._size || this._map.getSize();
    const zoom = this._map.getZoom();
    const context = this._ctx;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, size.x, size.y);
    this._zoneBounds = [];

    if (this._layerName === 'Wind') {
      drawWindField(context, size, this._severity, time);
    }

    for (const zone of this._zones) {
      const point = this._map.latLngToContainerPoint([zone.lat, zone.lng]);
      const rx = degreesToPixels(zone.rxDeg, zoom, zone.lat);
      const ry = degreesToPixels(zone.ryDeg, zoom, zone.lat);
      if (rx < 3 || ry < 3) continue;

      this._zoneBounds.push({ cx: point.x, cy: point.y, rx: Math.max(rx, 18), ry: Math.max(ry, 18), zone });
      if (this._layerName === 'Rainfall') drawRainCell(context, zone, point.x, point.y, rx, ry, time);
    }
  },
});

export default function WeatherEffects({ map, layer, severity, onZoneClick }) {
  const weatherLayerRef = useRef(null);

  useEffect(() => {
    if (!map) return undefined;
    if (layer !== 'Wind' && layer !== 'Rainfall') return undefined;

    const weatherLayer = new WeatherTextureLayer(layer, severity, onZoneClick);
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
