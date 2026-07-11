import { useEffect, useRef, useState } from 'react';
import GoogleWeatherMap from './GoogleWeatherMap';
import { useButtonSound } from './useButtonSound';

const layers = ['Radar', 'Satellite', 'Wind', 'Rainfall'];
const navItems = [
  { label: 'Home', icon: 'home' },
  { label: 'Map', icon: 'map' },
  { label: 'Alerts', icon: 'alert' },
  { label: 'More', icon: 'more' },
];

function Icon({ name }) {
  if (name === 'back') return <svg viewBox="0 0 24 24"><path d="m15 5-7 7 7 7" /></svg>;
  if (name === 'layers') return <svg viewBox="0 0 24 24"><path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5"/></svg>;
  if (name === 'locate') return <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="6"/><path d="M12 2v4m0 12v4M2 12h4m12 0h4"/></svg>;
  if (name === 'home') return <svg viewBox="0 0 24 24"><path d="m4 10 8-7 8 7v10H4V10Z"/><path d="M9 20v-6h6v6"/></svg>;
  if (name === 'map') return <span className="diamond-icon" />;
  if (name === 'alert') return <span className="alert-icon">♟</span>;
  return <span className="more-icon"><i/><i/><i/></span>;
}

export default function App() {
  const [activeLayer, setActiveLayer] = useState('Radar');
  const [activeNav, setActiveNav] = useState('Map');
  const [minutes, setMinutes] = useState(65);
  const [playing, setPlaying] = useState(false);
  const [activePanel, setActivePanel] = useState(null);
  const [layerMenuOpen, setLayerMenuOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [alertsRead, setAlertsRead] = useState(false);
  const [toast, setToast] = useState('');
  const mapRef = useRef(null);
  const toastTimerRef = useRef(null);
  const playSound = useButtonSound();

  useEffect(() => {
    if (!playing) return undefined;
    const timer = window.setInterval(() => setMinutes((value) => (value >= 90 ? 0 : value + 1)), 350);
    return () => window.clearInterval(timer);
  }, [playing]);

  useEffect(() => () => window.clearTimeout(toastTimerRef.current), []);

  const notify = (message) => {
    window.clearTimeout(toastTimerRef.current);
    setToast(message);
    toastTimerRef.current = window.setTimeout(() => setToast(''), 2200);
  };

  const clickSound = (tone = 'tap') => {
    if (soundEnabled) playSound(tone);
  };

  const chooseLayer = (layer) => {
    setActiveLayer(layer);
    setActiveNav('Map');
    setActivePanel(null);
    setLayerMenuOpen(false);
    clickSound('tap');
    notify(`${layer} layer selected`);
  };

  const mapAction = (action, message) => {
    mapRef.current?.[action]();
    clickSound('tap');
    notify(message);
  };

  const togglePlayback = () => {
    setPlaying((value) => {
      const nextValue = !value;
      notify(nextValue ? 'Weather animation started' : 'Weather animation paused');
      return nextValue;
    });
    clickSound('confirm');
  };

  const handleTimelineChange = (event) => {
    setPlaying(false);
    setMinutes(Number(event.target.value));
  };

  const handleBack = () => {
    if (layerMenuOpen) {
      setLayerMenuOpen(false);
      notify('Layer menu closed');
    } else if (activePanel) {
      setActivePanel(null);
      setActiveNav('Map');
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
    }

    if (label === 'Home') {
      setActivePanel('home');
      notify('Home dashboard selected');
    }

    if (label === 'Alerts') {
      setActivePanel('alerts');
      setAlertsRead(true);
      notify('Weather alerts opened');
    }

    if (label === 'More') {
      setActivePanel('more');
      notify('More options opened');
    }
  };

  const toggleSound = () => {
    setSoundEnabled((value) => {
      const nextValue = !value;
      if (!value) playSound('confirm');
      notify(nextValue ? 'Button sounds enabled' : 'Button sounds muted');
      return nextValue;
    });
  };

  const resetMap = () => {
    setActiveLayer('Radar');
    setMinutes(65);
    setPlaying(false);
    setActiveNav('Map');
    setActivePanel(null);
    mapRef.current?.recenter();
    clickSound('confirm');
    notify('Map reset to default settings');
  };

  const timeLabel = (() => {
    const total = 8 * 60 + 30 + minutes;
    const hour = Math.floor(total / 60);
    const minute = total % 60;
    return `${hour}:${String(minute).padStart(2, '0')} AM`;
  })();

  return (
    <main className="app-shell">
      <header className="top-shell">
        <div className="status-bar" aria-hidden="true">
          <time>9:41</time>
          <div className="status-icons"><span className="signal"/><span className="wifi">⌁</span><span className="battery"/></div>
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
            <button
              key={layer}
              role="tab"
              aria-selected={activeLayer === layer}
              className={activeLayer === layer ? 'active' : ''}
              onClick={() => chooseLayer(layer)}
            >{layer}</button>
          ))}
        </div>
      </header>

      <section className="map-section">
        <GoogleWeatherMap ref={mapRef} layer={activeLayer} />
        <button className="place-chip" onClick={() => mapAction('recenter', 'Map recentered on Sunway, Selangor')}>
          <Icon name="locate" /><span>Sunway,<br/>Selangor</span>
        </button>
        <div className="zoom-controls">
          <button aria-label="Zoom in" onClick={() => mapAction('zoomIn', 'Map zoomed in')}>+</button>
          <button aria-label="Zoom out" onClick={() => mapAction('zoomOut', 'Map zoomed out')}>−</button>
        </div>
        <div className="rain-card">
          <div className="rain-copy"><span>Rain Intensity</span><strong>{timeLabel}</strong></div>
          <div className="intensity-bar"><i/><i/><i/><i/></div>
          <div className="intensity-labels"><span>Light</span><span>Heavy</span></div>
        </div>
      </section>

      {layerMenuOpen && (
        <section className="utility-sheet layer-menu" aria-label="Map layer controls">
          <div className="sheet-heading"><span>Map layers</span><button aria-label="Close layer menu" onClick={handleBack}>×</button></div>
          <div className="layer-menu-grid">
            {layers.map((layer) => (
              <button key={layer} className={activeLayer === layer ? 'active' : ''} onClick={() => chooseLayer(layer)}>
                <span className={`layer-swatch layer-swatch--${layer.toLowerCase()}`} />{layer}
              </button>
            ))}
          </div>
        </section>
      )}

      {activePanel === 'home' && (
        <section className="utility-sheet info-panel" aria-label="Home dashboard">
          <div className="sheet-heading"><span>Today in Sunway</span><button aria-label="Close home dashboard" onClick={handleBack}>×</button></div>
          <strong className="temperature">29°</strong>
          <p>Partly cloudy with light rain expected later this morning.</p>
          <button className="sheet-primary" onClick={() => handleNavigation('Map')}>Open weather map</button>
        </section>
      )}

      {activePanel === 'alerts' && (
        <section className="utility-sheet info-panel" aria-label="Weather alerts">
          <div className="sheet-heading"><span>Weather alerts</span><button aria-label="Close weather alerts" onClick={handleBack}>×</button></div>
          <p className="alert-message"><i /> Light rainfall is possible near Sunway between 9:30 AM and 10:00 AM.</p>
          <button className="sheet-primary" onClick={() => handleNavigation('Map')}>View on map</button>
        </section>
      )}

      {activePanel === 'more' && (
        <section className="utility-sheet info-panel" aria-label="More options">
          <div className="sheet-heading"><span>More options</span><button aria-label="Close more options" onClick={handleBack}>×</button></div>
          <button className="setting-row" onClick={toggleSound}><span>Button sounds</span><strong>{soundEnabled ? 'On' : 'Off'}</strong></button>
          <button className="setting-row" onClick={resetMap}><span>Reset map</span><strong>Reset</strong></button>
        </section>
      )}

      <section className="timeline-card" aria-label="Weather timeline">
        <button className={`play-button ${playing ? 'is-playing' : ''}`} aria-label={playing ? 'Pause animation' : 'Play animation'} onClick={togglePlayback}>
          {playing ? <span className="pause-icon"/> : <span className="play-icon"/>}
        </button>
        <div className="timeline-content">
          <input
            type="range"
            min="0"
            max="90"
            value={minutes}
            style={{ '--pct': `${(minutes / 90) * 100}%` }}
            onChange={handleTimelineChange}
            aria-label="Weather time"
          />
          <div className="time-labels"><span>8:30 AM</span><span>9:00 AM</span><span>9:30 AM</span><span>10:00 AM</span></div>
        </div>
      </section>

      <nav className="bottom-nav" aria-label="Main navigation">
        {navItems.map((item) => (
          <button key={item.label} className={activeNav === item.label ? 'active' : ''} onClick={() => handleNavigation(item.label)}>
            <span className="nav-icon"><Icon name={item.icon} />{item.label === 'Alerts' && !alertsRead && <i className="alert-dot"/>}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      {toast && <div className="toast" role="status">{toast}</div>}
      <div className="home-indicator" aria-hidden="true" />
    </main>
  );
}
