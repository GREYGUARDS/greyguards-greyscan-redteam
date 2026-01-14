import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Pause, Play, AlertTriangle } from "lucide-react";

interface CountdownTimerProps {
  timeRemaining: number;
  totalDuration: number;
  isPaused: boolean;
  onPauseToggle: () => void;
}

const CountdownTimer = ({ timeRemaining, totalDuration, isPaused, onPauseToggle }: CountdownTimerProps) => {
  const [pulseIntensity, setPulseIntensity] = useState(0);

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const percentRemaining = (timeRemaining / totalDuration) * 100;

  // Increase urgency as time runs out
  useEffect(() => {
    if (timeRemaining <= 60) {
      setPulseIntensity(3); // Critical
    } else if (timeRemaining <= 120) {
      setPulseIntensity(2); // Warning
    } else if (timeRemaining <= 300) {
      setPulseIntensity(1); // Notice
    } else {
      setPulseIntensity(0); // Normal
    }
  }, [timeRemaining]);

  const getTimerStyles = () => {
    if (pulseIntensity === 3) {
      return "border-destructive text-destructive bg-destructive/10 animate-pulse shadow-[0_0_30px_rgba(220,38,38,0.5)]";
    }
    if (pulseIntensity === 2) {
      return "border-warning text-warning bg-warning/10 animate-pulse-glow shadow-[0_0_20px_rgba(234,179,8,0.3)]";
    }
    if (pulseIntensity === 1) {
      return "border-warning/50 text-warning bg-warning/5";
    }
    return "border-border text-foreground bg-card";
  };

  const getDigitStyles = () => {
    if (pulseIntensity === 3) {
      return "text-destructive animate-pulse";
    }
    if (pulseIntensity === 2) {
      return "text-warning";
    }
    return "text-foreground";
  };

  return (
    <div className="flex items-center gap-3">
      <div className={`relative px-6 py-3 border-4 transition-all duration-300 ${getTimerStyles()}`}>
        {/* Danger indicator */}
        {pulseIntensity >= 2 && (
          <div className="absolute -top-2 -right-2">
            <AlertTriangle className={`h-5 w-5 ${pulseIntensity === 3 ? 'text-destructive animate-bounce' : 'text-warning'}`} />
          </div>
        )}

        {/* Timer display */}
        <div className="flex items-center gap-1">
          <span className={`text-3xl font-mono font-bold tracking-wider ${getDigitStyles()}`}>
            {minutes.toString().padStart(2, '0')}
          </span>
          <span className={`text-3xl font-mono font-bold ${pulseIntensity === 3 ? 'animate-pulse' : ''} ${getDigitStyles()}`}>
            :
          </span>
          <span className={`text-3xl font-mono font-bold tracking-wider ${getDigitStyles()}`}>
            {seconds.toString().padStart(2, '0')}
          </span>
        </div>

        {/* Urgency label */}
        <div className="text-center mt-1">
          <span className={`text-[10px] uppercase tracking-widest ${
            pulseIntensity === 3 ? 'text-destructive font-bold' :
            pulseIntensity === 2 ? 'text-warning' :
            'text-muted-foreground'
          }`}>
            {pulseIntensity === 3 ? 'CRITICAL' :
             pulseIntensity === 2 ? 'TIME PRESSURE' :
             'REMAINING'}
          </span>
        </div>

        {/* Progress bar at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted overflow-hidden">
          <div 
            className={`h-full transition-all duration-1000 ${
              pulseIntensity === 3 ? 'bg-destructive' :
              pulseIntensity === 2 ? 'bg-warning' :
              'bg-primary'
            }`}
            style={{ width: `${percentRemaining}%` }}
          />
        </div>
      </div>

      <Button
        variant="outline"
        size="icon"
        onClick={onPauseToggle}
        className="border-2"
      >
        {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
      </Button>
    </div>
  );
};

export default CountdownTimer;
