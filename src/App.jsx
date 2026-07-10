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
  const mapRef = useRef(null);
  const playSound = useButtonSound();

  useEffect(() => {
    if (!playing) return undefined;
    const timer = window.setInterval(() => setMinutes((value) => (value >= 90 ? 0 : value + 1)), 350);
    return () => window.clearInterval(timer);
  }, [playing]);

  const chooseLayer = (layer) => {
    setActiveLayer(layer);
    playSound('tap');
  };

  const mapAction = (action) => {
    mapRef.current?.[action]();
    playSound('tap');
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
          <button className="icon-button" aria-label="Go back" onClick={() => playSound('tap')}><Icon name="back" /></button>
          <h1>Weather Map</h1>
          <button className="icon-button" aria-label="Map layers" onClick={() => playSound('tap')}><Icon name="layers" /></button>
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
        <button className="place-chip" onClick={() => mapAction('recenter')}>
          <Icon name="locate" /><span>Sunway,<br/>Selangor</span>
        </button>
        <div className="zoom-controls">
          <button aria-label="Zoom in" onClick={() => mapAction('zoomIn')}>+</button>
          <button aria-label="Zoom out" onClick={() => mapAction('zoomOut')}>−</button>
        </div>
        <div className="rain-card">
          <div className="rain-copy"><span>Rain Intensity</span><strong>{timeLabel}</strong></div>
          <div className="intensity-bar"><i/><i/><i/><i/></div>
          <div className="intensity-labels"><span>Light</span><span>Heavy</span></div>
        </div>
      </section>

      <section className="timeline-card" aria-label="Weather timeline">
        <button className={`play-button ${playing ? 'is-playing' : ''}`} aria-label={playing ? 'Pause animation' : 'Play animation'} onClick={() => { setPlaying(!playing); playSound('confirm'); }}>
          {playing ? <span className="pause-icon"/> : <span className="play-icon"/>}
        </button>
        <div className="timeline-content">
          <input
            type="range"
            min="0"
            max="90"
            value={minutes}
            style={{ '--pct': `${(minutes / 90) * 100}%` }}
            onChange={(e) => setMinutes(Number(e.target.value))}
            aria-label="Weather time"
          />
          <div className="time-labels"><span>8:30 AM</span><span>9:00 AM</span><span>9:30 AM</span><span>10:00 AM</span></div>
        </div>
      </section>

      <nav className="bottom-nav" aria-label="Main navigation">
        {navItems.map((item) => (
          <button key={item.label} className={activeNav === item.label ? 'active' : ''} onClick={() => { setActiveNav(item.label); playSound('tap'); }}>
            <span className="nav-icon"><Icon name={item.icon} />{item.label === 'Alerts' && <i className="alert-dot"/>}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="home-indicator" aria-hidden="true" />
    </main>
  );
}
