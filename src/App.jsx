import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import OpenStreetWeatherMap from './OpenStreetWeatherMap';
import { useButtonSound } from './useButtonSound';
import { useWeatherSound } from './useWeatherSound';
import { severityLabel as zoneSeverityLabel } from './WeatherEffects';

const layers = ['Radar', 'Satellite', 'Wind', 'Rainfall'];
const navItems = [
  { label: 'Home', icon: 'home' },
  { label: 'Map', icon: 'map' },
  { label: 'Alerts', icon: 'alert' },
  { label: 'More', icon: 'more' },
];
const layerSeverity = { Radar: 0.36, Satellite: 0.16, Wind: 0.57, Rainfall: 0.82 };

function Icon({ name }) {
  if (name === 'back') return <svg viewBox="0 0 24 24"><path d="m15 5-7 7 7 7" /></svg>;
  if (name === 'layers') return <svg viewBox="0 0 24 24"><path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5"/></svg>;
  if (name === 'locate') return <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="6"/><path d="M12 2v4m0 12v4M2 12h4m12 0h4"/></svg>;
  if (name === 'home') return <svg viewBox="0 0 24 24"><path d="m4 10 8-7 8 7v10H4V10Z"/><path d="M9 20v-6h6v6"/></svg>;
  if (name === 'map') return <span className="diamond-icon" />;
  if (name === 'alert') return <span className="alert-icon">♟</span>;
  return <span className="more-icon"><i/><i/><i/></span>;
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60_000);
}

function formatPhoneTime(date) {
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: false }).format(date);
}

function formatWeatherTime(date) {
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).format(date);
}

function severityLabel(value) {
  if (value < 0.3) return 'Light';
  if (value < 0.55) return 'Moderate';
  if (value < 0.78) return 'Heavy';
  return 'Severe';
}

export default function App() {
  const [activeLayer, setActiveLayer] = useState('Radar');
  const [activeNav, setActiveNav] = useState('Map');
  const [timelineOffset, setTimelineOffset] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [activePanel, setActivePanel] = useState(null);
  const [layerMenuOpen, setLayerMenuOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [alertsRead, setAlertsRead] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [toast, setToast] = useState('');
  const [systemTime, setSystemTime] = useState(() => new Date());
  const mapRef = useRef(null);
  const toastTimerRef = useRef(null);
  const playSound = useButtonSound();
  const { playWind, playRain, stopAll } = useWeatherSound();

  useEffect(() => {
    const timer = window.setInterval(() => setSystemTime(new Date()), 1_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!playing) return undefined;
    const timer = window.setInterval(() => {
      setTimelineOffset((value) => (value >= 90 ? 0 : value + 1));
    }, 350);
    return () => window.clearInterval(timer);
  }, [playing]);

  useEffect(() => () => window.clearTimeout(toastTimerRef.current), []);

  useEffect(() => () => stopAll(), [stopAll]);

  useEffect(() => {
    if (!soundEnabled || (activeLayer !== 'Wind' && activeLayer !== 'Rainfall')) stopAll();
  }, [activeLayer, soundEnabled, stopAll]);

  const weatherSeverity = useMemo(() => {
    const variation = Math.sin((timelineOffset / 90) * Math.PI) * 0.16;
    return Math.min(1, Math.max(0.08, layerSeverity[activeLayer] + variation));
  }, [activeLayer, timelineOffset]);
  const weatherLabel = severityLabel(weatherSeverity);
  const forecastTime = addMinutes(systemTime, timelineOffset);
  const timeLabels = [0, 30, 60, 90].map((offset) => formatWeatherTime(addMinutes(systemTime, offset)));

  const notify = useCallback((message) => {
    window.clearTimeout(toastTimerRef.current);
    setToast(message);
    toastTimerRef.current = window.setTimeout(() => setToast(''), 2200);
  }, []);

  const clickSound = (tone = 'tap') => {
    if (soundEnabled) playSound(tone, weatherSeverity);
  };

  const chooseLayer = (layer) => {
    setActiveLayer(layer);
    setActiveNav('Map');
    setActivePanel(null);
    setLayerMenuOpen(false);
    clickSound('tap');
    notify(`${layer} layer selected — ${weatherLabel.toLowerCase()} conditions`);
  };

  const mapAction = (action, message) => {
    mapRef.current?.[action]?.();
    clickSound('tap');
    notify(message);
  };

  const locateUser = async () => {
    setIsLocating(true);
    clickSound('tap');
    try {
      const location = await mapRef.current?.locateUser?.();
      if (!location) throw new Error('Map is not ready');
      notify('Map centered on your current location');
    } catch {
      mapRef.current?.recenter?.();
      notify('Location unavailable — centered on Sunway');
    } finally {
      window.setTimeout(() => setIsLocating(false), 550);
    }
  };

  const togglePlayback = () => {
    const nextValue = !playing;
    setPlaying(nextValue);
    clickSound('confirm');
    notify(nextValue ? 'Weather timeline started' : 'Weather timeline paused');
  };

  const handleTimelineChange = (event) => {
    setPlaying(false);
    setTimelineOffset(Number(event.target.value));
    clickSound('tap');
  };

  const closePanels = () => {
    setLayerMenuOpen(false);
    setActivePanel(null);
    setActiveNav('Map');
  };

  const handleBack = () => {
    if (layerMenuOpen || activePanel) {
      closePanels();
      notify('Returned to map');
    } else {
      setActiveNav('Home');
      setActivePanel('home');
      notify('Opened home dashboard');
    }
    clickSound('tap');
  };

  const handleNavigation = (label) => {
    setActiveNav(label);
    setLayerMenuOpen(false);
    clickSound('tap');

    if (label === 'Map') {
      setActivePanel(null);
      notify('Map view selected');
    } else if (label === 'Home') {
      setActivePanel('home');
      notify('Home dashboard selected');
    } else if (label === 'Alerts') {
      setActivePanel('alerts');
      setAlertsRead(true);
      notify('Weather alerts opened');
    } else {
      setActivePanel('more');
      notify('More options opened');
    }
  };

  const toggleSound = () => {
    const nextValue = !soundEnabled;
    setSoundEnabled(nextValue);
    if (nextValue) playSound('confirm', weatherSeverity);
    notify(nextValue ? 'Weather-responsive sounds enabled' : 'Button sounds muted');
  };

  const resetMap = () => {
    setActiveLayer('Radar');
    setTimelineOffset(0);
    setPlaying(false);
    stopAll();
    closePanels();
    mapRef.current?.recenter?.();
    clickSound('confirm');
    notify('Map reset to live default settings');
  };

  const onZoneClick = useCallback((zone) => {
    const label = zoneSeverityLabel(zone.sev);
    if (soundEnabled && activeLayer === 'Wind') {
      playWind(zone.sev);
    } else if (soundEnabled) {
      playRain(zone.sev);
    }
    notify(`${activeLayer}: ${label} conditions`);
  }, [soundEnabled, playWind, playRain, activeLayer, notify]);

  return (
    <main className="app-shell">
      <header className="top-shell">
        <div className="status-bar" aria-label="Current system time">
          <time dateTime={systemTime.toISOString()}>{formatPhoneTime(systemTime)}</time>
          <div className="status-icons" aria-hidden="true"><span className="signal"/><span className="wifi">⌁</span><span className="battery"/></div>
        </div>
        <div className="title-row">
          <button className="icon-button" aria-label="Go back" onClick={handleBack}><Icon name="back" /></button>
          <h1>Weather Map</h1>
          <button
            className={`icon-button ${layerMenuOpen ? 'is-active' : ''}`}
            aria-label="Open map layer menu"
            aria-expanded={layerMenuOpen}
            onClick={() => {
              setLayerMenuOpen((value) => !value);
              setActivePanel(null);
              clickSound('tap');
            }}
          ><Icon name="layers" /></button>
        </div>
        <div className="layer-tabs" role="tablist" aria-label="Weather map layers">
          {layers.map((layer) => (
            <button key={layer} role="tab" aria-selected={activeLayer === layer} className={activeLayer === layer ? 'active' : ''} onClick={() => chooseLayer(layer)}>{layer}</button>
          ))}
        </div>
      </header>

      <section className="map-section">
        <OpenStreetWeatherMap ref={mapRef} layer={activeLayer} severity={weatherSeverity} onZoneClick={onZoneClick} />
        <button className="place-chip" aria-busy={isLocating} onClick={locateUser}>
          <Icon name="locate" /><span>{isLocating ? 'Locating…' : <>Sunway,<br/>Selangor</>}</span>
        </button>
        <div className="zoom-controls">
          <button aria-label="Zoom in" onClick={() => mapAction('zoomIn', 'Map zoomed in')}>+</button>
          <button aria-label="Zoom out" onClick={() => mapAction('zoomOut', 'Map zoomed out')}>−</button>
        </div>
        <button className="rain-card" style={{ '--severity': weatherSeverity }} onClick={() => { setActivePanel('weather'); setLayerMenuOpen(false); clickSound('confirm'); }}>
          <div className="rain-copy"><span>Rain Intensity <em>{weatherLabel}</em></span><strong>{formatWeatherTime(systemTime)}</strong></div>
          <div className="intensity-bar"><i/><i/><i/><i/><b aria-hidden="true" /></div>
          <div className="intensity-labels"><span>Light</span><span>Heavy</span></div>
        </button>
      </section>

      {layerMenuOpen && (
        <section className="utility-sheet layer-menu" aria-label="Map layer controls">
          <div className="sheet-heading"><span>Map layers</span><button aria-label="Close layer menu" onClick={handleBack}>×</button></div>
          <div className="layer-menu-grid">
            {layers.map((layer) => <button key={layer} className={activeLayer === layer ? 'active' : ''} onClick={() => chooseLayer(layer)}><span className={`layer-swatch layer-swatch--${layer.toLowerCase()}`} />{layer}</button>)}
          </div>
        </section>
      )}

      {activePanel === 'home' && (
        <section className="utility-sheet info-panel" aria-label="Home dashboard">
          <div className="sheet-heading"><span>Today in Sunway</span><button aria-label="Close home dashboard" onClick={handleBack}>×</button></div>
          <strong className="temperature">29°</strong>
          <p>{weatherLabel} {activeLayer.toLowerCase()} conditions at {formatWeatherTime(forecastTime)}.</p>
          <button className="sheet-primary" onClick={() => handleNavigation('Map')}>Open weather map</button>
        </section>
      )}

      {activePanel === 'weather' && (
        <section className="utility-sheet info-panel" aria-label="Rain intensity details">
          <div className="sheet-heading"><span>Rain intensity</span><button aria-label="Close rain intensity details" onClick={handleBack}>×</button></div>
          <strong className="weather-status">{weatherLabel}</strong>
          <p>Forecast intensity is {Math.round(weatherSeverity * 100)}% at {formatWeatherTime(forecastTime)}. Higher values produce a brighter and louder weather feedback sound.</p>
          <button className="sheet-primary" onClick={() => handleNavigation('Alerts')}>View weather alerts</button>
        </section>
      )}

      {activePanel === 'alerts' && (
        <section className="utility-sheet info-panel" aria-label="Weather alerts">
          <div className="sheet-heading"><span>Weather alerts</span><button aria-label="Close weather alerts" onClick={handleBack}>×</button></div>
          <p className="alert-message"><i /> {weatherSeverity >= 0.75 ? 'Heavy rainfall may affect Sunway during the selected forecast period.' : 'Light rainfall is possible near Sunway during the selected forecast period.'}</p>
          <button className="sheet-primary" onClick={() => handleNavigation('Map')}>View on map</button>
        </section>
      )}

      {activePanel === 'more' && (
        <section className="utility-sheet info-panel" aria-label="More options">
          <div className="sheet-heading"><span>More options</span><button aria-label="Close more options" onClick={handleBack}>×</button></div>
          <button className="setting-row" onClick={toggleSound}><span>Weather-responsive sounds</span><strong>{soundEnabled ? 'On' : 'Off'}</strong></button>
          <button className="setting-row" onClick={resetMap}><span>Reset map</span><strong>Reset</strong></button>
        </section>
      )}

      <section className="timeline-card" aria-label="Weather timeline">
        <button className={`play-button ${playing ? 'is-playing' : ''}`} aria-label={playing ? 'Pause animation' : 'Play animation'} onClick={togglePlayback}>{playing ? <span className="pause-icon"/> : <span className="play-icon"/>}</button>
        <div className="timeline-content">
          <input type="range" min="0" max="90" value={timelineOffset} style={{ '--pct': `${(timelineOffset / 90) * 100}%` }} onChange={handleTimelineChange} aria-label="Forecast time offset" />
          <div className="time-labels">{timeLabels.map((label) => <span key={label}>{label}</span>)}</div>
        </div>
      </section>

      <nav className="bottom-nav" aria-label="Main navigation">
        {navItems.map((item) => (
          <button key={item.label} className={activeNav === item.label ? 'active' : ''} onClick={() => handleNavigation(item.label)}>
            <span className="nav-icon"><Icon name={item.icon} />{item.label === 'Alerts' && !alertsRead && <i className="alert-dot"/>}</span><span>{item.label}</span>
          </button>
        ))}
      </nav>
      {toast && <div className="toast" role="status">{toast}</div>}
      <div className="home-indicator" aria-hidden="true" />
    </main>
  );
}
