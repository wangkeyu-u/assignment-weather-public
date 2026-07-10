import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

const SUNWAY = { lat: 3.0687, lng: 101.6032 };

const MAP_STYLES = [
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#cfeaf3' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#e9f2e8' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#6e7d78' }] },
];

let googleMapsPromise;

function isPlausibleGoogleMapsKey(apiKey) {
  return /^AIza[\w-]{20,}$/.test(apiKey ?? '');
}

function loadGoogleMaps(apiKey) {
  if (window.google?.maps) return Promise.resolve(window.google.maps);
  if (googleMapsPromise) return googleMapsPromise;

  googleMapsPromise = new Promise((resolve, reject) => {
    const callbackName = '__weatherMapReady';
    window[callbackName] = () => {
      resolve(window.google.maps);
      delete window[callbackName];
    };
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&callback=${callbackName}&v=weekly`;
    script.async = true;
    script.onerror = () => reject(new Error('Google Maps failed to load'));
    document.head.appendChild(script);
  });
  return googleMapsPromise;
}

const GoogleWeatherMap = forwardRef(function GoogleWeatherMap({ layer }, ref) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [status, setStatus] = useState('loading');
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  useImperativeHandle(ref, () => ({
    zoomIn: () => mapRef.current?.setZoom((mapRef.current.getZoom() ?? 13) + 1),
    zoomOut: () => mapRef.current?.setZoom((mapRef.current.getZoom() ?? 13) - 1),
    recenter: () => {
      mapRef.current?.panTo(SUNWAY);
      mapRef.current?.setZoom(14);
    },
  }));

  useEffect(() => {
    if (!apiKey) {
      setStatus('missing-key');
      return;
    }

    if (!isPlausibleGoogleMapsKey(apiKey)) {
      setStatus('invalid-key');
      return;
    }

    let cancelled = false;
    loadGoogleMaps(apiKey)
      .then((maps) => {
        if (cancelled || !containerRef.current) return;
        mapRef.current = new maps.Map(containerRef.current, {
          center: SUNWAY,
          zoom: 14,
          disableDefaultUI: true,
          gestureHandling: 'greedy',
          mapTypeId: layer === 'Satellite' ? 'satellite' : 'roadmap',
          styles: layer === 'Satellite' ? null : MAP_STYLES,
        });

        markerRef.current = new maps.Marker({
          map: mapRef.current,
          position: SUNWAY,
          title: 'Sunway, Selangor',
          icon: {
            path: maps.SymbolPath.CIRCLE,
            fillColor: '#9ebbed',
            fillOpacity: 0.95,
            strokeColor: '#ffffff',
            strokeWeight: 7,
            scale: 12,
          },
        });
        setStatus('ready');
      })
      .catch(() => setStatus('error'));

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.setMapTypeId(layer === 'Satellite' ? 'satellite' : 'roadmap');
    mapRef.current.setOptions({ styles: layer === 'Satellite' ? null : MAP_STYLES });
  }, [layer]);

  return (
    <div className="map-canvas-wrap">
      <div ref={containerRef} className="google-map" aria-label="Google map centered on Sunway, Selangor" />
      {status !== 'ready' && (
        <div className="map-demo" aria-label="Map preview">
          <div className="map-road road-one" />
          <div className="map-road road-two" />
          <div className="map-road road-three" />
          <div className="map-water" />
          <span className="map-label label-one">Petaling Jaya</span>
          <span className="map-label label-two">Bandar Sunway</span>
          {status !== 'loading' && (
            <div className="map-key-note">
              {status === 'missing-key' && 'Add a Google Maps API key to enable the live map'}
              {status === 'invalid-key' && 'This Google Maps API key format is invalid — showing preview'}
              {status === 'error' && 'Google Maps could not load — showing preview'}
            </div>
          )}
        </div>
      )}
      <div className={`weather-wash weather-wash--${layer.toLowerCase()}`} aria-hidden="true" />
      <div className="location-dot" aria-hidden="true"><span /></div>
    </div>
  );
});

export default GoogleWeatherMap;
