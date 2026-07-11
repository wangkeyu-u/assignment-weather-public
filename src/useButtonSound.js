import { useCallback, useRef } from 'react';

export function useButtonSound() {
  const audioContextRef = useRef(null);

  return useCallback((tone = 'tap', severity = 0.25) => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const context = audioContextRef.current ?? new AudioContext();
    audioContextRef.current = context;
    if (context.state === 'suspended') context.resume();

    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime;
    const weatherLevel = Math.min(1, Math.max(0, severity));
    const baseFrequency = tone === 'confirm' ? 430 : 280;
    const peakFrequency = baseFrequency + 140 + weatherLevel * 1_050;
    const peakVolume = 0.018 + weatherLevel * 0.072;
    const duration = 0.055 + weatherLevel * 0.07;

    oscillator.type = weatherLevel > 0.7 ? 'square' : tone === 'confirm' ? 'sine' : 'triangle';
    oscillator.frequency.setValueAtTime(baseFrequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(peakFrequency, now + duration * 0.55);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(180, peakFrequency * 0.72), now + duration);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(peakVolume, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.01);
  }, []);
}
