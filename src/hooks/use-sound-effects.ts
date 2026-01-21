import { useCallback, useRef } from "react";

// Sound effect types for the crisis simulation
type SoundType = "inject" | "success" | "warning" | "error" | "tick";

interface SoundConfig {
  frequency: number;
  duration: number;
  type: OscillatorType;
  volume: number;
  ramp?: boolean;
  secondFreq?: number;
}

const SOUND_CONFIGS: Record<SoundType, SoundConfig> = {
  inject: {
    frequency: 440,
    secondFreq: 880,
    duration: 0.3,
    type: "square",
    volume: 0.15,
    ramp: true,
  },
  success: {
    frequency: 523.25, // C5
    secondFreq: 659.25, // E5
    duration: 0.2,
    type: "sine",
    volume: 0.12,
  },
  warning: {
    frequency: 349.23, // F4
    duration: 0.4,
    type: "sawtooth",
    volume: 0.1,
  },
  error: {
    frequency: 220,
    duration: 0.3,
    type: "square",
    volume: 0.12,
  },
  tick: {
    frequency: 1000,
    duration: 0.05,
    type: "sine",
    volume: 0.05,
  },
};

export const useSoundEffects = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const enabledRef = useRef(true);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playSound = useCallback((type: SoundType) => {
    if (!enabledRef.current) return;

    try {
      const ctx = getAudioContext();
      const config = SOUND_CONFIGS[type];
      
      // Resume context if suspended (browser autoplay policy)
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = config.type;
      oscillator.frequency.setValueAtTime(config.frequency, ctx.currentTime);

      // Add frequency sweep for inject sound
      if (config.secondFreq) {
        oscillator.frequency.linearRampToValueAtTime(
          config.secondFreq,
          ctx.currentTime + config.duration * 0.5
        );
      }

      gainNode.gain.setValueAtTime(config.volume, ctx.currentTime);
      
      // Fade out to avoid clicks
      gainNode.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + config.duration
      );

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + config.duration);

      // For success sound, add a second tone
      if (type === "success" && config.secondFreq) {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        
        osc2.type = config.type;
        osc2.frequency.setValueAtTime(config.secondFreq, ctx.currentTime + 0.1);
        
        gain2.gain.setValueAtTime(config.volume, ctx.currentTime + 0.1);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        
        osc2.start(ctx.currentTime + 0.1);
        osc2.stop(ctx.currentTime + 0.3);
      }

      // For inject, play urgent double-beep
      if (type === "inject") {
        setTimeout(() => {
          if (!enabledRef.current) return;
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          
          osc2.type = "square";
          osc2.frequency.setValueAtTime(660, ctx.currentTime);
          osc2.frequency.linearRampToValueAtTime(880, ctx.currentTime + 0.15);
          
          gain2.gain.setValueAtTime(0.12, ctx.currentTime);
          gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
          
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          
          osc2.start(ctx.currentTime);
          osc2.stop(ctx.currentTime + 0.2);
        }, 200);
      }

    } catch (err) {
      console.warn("Could not play sound:", err);
    }
  }, [getAudioContext]);

  const setEnabled = useCallback((enabled: boolean) => {
    enabledRef.current = enabled;
  }, []);

  const isEnabled = useCallback(() => enabledRef.current, []);

  return { playSound, setEnabled, isEnabled };
};
