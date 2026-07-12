import { useCallback, useRef } from 'react';

function createNoiseBuffer(context, duration) {
  const sampleRate = context.sampleRate;
  const length = Math.floor(sampleRate * duration);
  const buffer = context.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

export function useWeatherSound() {
  const audioContextRef = useRef(null);
  const windSourceRef = useRef(null);
  const rainSourceRef = useRef(null);

  const stopWind = useCallback(() => {
    if (windSourceRef.current) {
      try { windSourceRef.current.stop(); } catch (e) { /* ignore */ }
      windSourceRef.current = null;
    }
  }, []);

  const stopRain = useCallback(() => {
    if (rainSourceRef.current) {
      try { rainSourceRef.current.stop(); } catch (e) { /* ignore */ }
      rainSourceRef.current = null;
    }
  }, []);

  const stopAll = useCallback(() => {
    stopWind();
    stopRain();
  }, [stopWind, stopRain]);

  const playWind = useCallback((severity = 0.5) => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    stopAll();

    const context = audioContextRef.current ?? new AudioContext();
    audioContextRef.current = context;
    if (context.state === 'suspended') context.resume();

    const vol = Math.min(1, Math.max(0, severity));
    const now = context.currentTime;
    const duration = 1.2 + vol * 0.8;

    const noiseBuffer = createNoiseBuffer(context, duration);
    const noise = context.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = false;

    const lowpass = context.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(200 + vol * 600, now);
    lowpass.Q.setValueAtTime(0.7, now);

    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.04 + vol * 0.12, now + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.03 + vol * 0.08, now + duration * 0.7);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    noise.connect(lowpass);
    lowpass.connect(gain);
    gain.connect(context.destination);

    noise.start(now);
    noise.stop(now + duration);

    windSourceRef.current = noise;
  }, [stopAll]);

  const playRain = useCallback((severity = 0.5) => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    stopAll();

    const context = audioContextRef.current ?? new AudioContext();
    audioContextRef.current = context;
    if (context.state === 'suspended') context.resume();

    const vol = Math.min(1, Math.max(0, severity));
    const now = context.currentTime;
    const duration = 1.5 + vol * 0.8;

    const noiseBuffer = createNoiseBuffer(context, duration);
    const noise = context.createBufferSource();
    noise.buffer = noiseBuffer;

    const lowpass = context.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(800 + vol * 3000, now);
    lowpass.Q.setValueAtTime(0.5, now);

    const hipass = context.createBiquadFilter();
    hipass.type = 'highpass';
    hipass.frequency.setValueAtTime(300 + vol * 600, now);
    hipass.Q.setValueAtTime(0.6, now);

    const peak1 = context.createBiquadFilter();
    peak1.type = 'peaking';
    peak1.frequency.setValueAtTime(1200 + vol * 800, now);
    peak1.Q.setValueAtTime(1.2, now);
    peak1.gain.setValueAtTime(6 + vol * 8, now);

    const peak2 = context.createBiquadFilter();
    peak2.type = 'peaking';
    peak2.frequency.setValueAtTime(3500 + vol * 1500, now);
    peak2.Q.setValueAtTime(2.5, now);
    peak2.gain.setValueAtTime(3 + vol * 6, now);

    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.06 + vol * 0.14, now + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.04 + vol * 0.10, now + duration * 0.6);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    noise.connect(hipass);
    hipass.connect(lowpass);
    lowpass.connect(peak1);
    peak1.connect(peak2);
    peak2.connect(gain);
    gain.connect(context.destination);

    noise.start(now);
    noise.stop(now + duration);

    rainSourceRef.current = noise;
  }, [stopAll]);

  return { playWind, playRain, stopAll };
}
