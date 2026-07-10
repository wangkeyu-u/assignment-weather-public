import { useCallback, useRef } from 'react';

export function useButtonSound() {
  const audioContextRef = useRef(null);

  return useCallback((tone = 'tap') => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const context = audioContextRef.current ?? new AudioContext();
    audioContextRef.current = context;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime;

    oscillator.type = tone === 'confirm' ? 'sine' : 'triangle';
    oscillator.frequency.setValueAtTime(tone === 'confirm' ? 520 : 330, now);
    oscillator.frequency.exponentialRampToValueAtTime(tone === 'confirm' ? 720 : 280, now + 0.055);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.035, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.075);
  }, []);
}
