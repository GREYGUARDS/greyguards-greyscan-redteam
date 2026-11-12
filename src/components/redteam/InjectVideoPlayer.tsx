import { useEffect, useRef, useState } from 'react';
import { Pause, Play, Volume2, VolumeX } from 'lucide-react';

/** Video with its controls in a separate bar under the footage, so text overlays never hide volume. Starts with sound on where the browser allows it. */
export default function InjectVideoPlayer({ src, overlay, className = '', frameClassName = '', loop = false, label = 'Exercise video', onError }: { src: string; overlay?: React.ReactNode; className?: string; frameClassName?: string; loop?: boolean; label?: string; onError?: () => void }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const v = ref.current; if (!v) return;
    v.muted = false; v.volume = 1;
    v.play().then(() => setMuted(false)).catch(() => { v.muted = true; setMuted(true); void v.play().catch(() => {}); });
  }, [src]);
  const toggle = () => { const v = ref.current; if (!v) return; if (v.paused) void v.play(); else v.pause(); };
  const toggleMute = () => { const v = ref.current; if (!v) return; v.muted = !v.muted; if (!v.muted && v.volume === 0) { v.volume = 1; setVolume(1); } setMuted(v.muted); if (v.paused) void v.play(); };
  return <div className={className}>
    <div className={`relative overflow-hidden bg-background ${frameClassName}`}>
      <video ref={ref} src={src} playsInline loop={loop} preload="metadata" aria-label={label} className="h-full w-full object-contain" onClick={toggle}
        onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onError={onError}
        onTimeUpdate={e => { const v = e.currentTarget; setProgress(v.duration ? v.currentTime / v.duration : 0); }} />
      {overlay}
    </div>
    <div className="flex items-center gap-2 border-t border-border bg-card px-2 py-2">
      <button type="button" onClick={toggle} aria-label={playing ? 'Pause video' : 'Play video'} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border hover:bg-muted">{playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}</button>
      <input type="range" min={0} max={1} step={0.001} value={progress} aria-label="Video position" className="min-w-0 flex-1 accent-primary"
        onChange={e => { const v = ref.current; if (v?.duration) v.currentTime = Number(e.target.value) * v.duration; }} />
      <button type="button" onClick={toggleMute} aria-label={muted ? 'Turn sound on' : 'Mute'} className={`flex h-9 shrink-0 items-center gap-1 rounded-md border px-2 text-[11px] uppercase tracking-wider ${muted ? 'border-destructive text-destructive animate-pulse' : 'border-border hover:bg-muted'}`}>{muted ? <><VolumeX className="h-4 w-4" />Tap for sound</> : <Volume2 className="h-4 w-4" />}</button>
      {!muted && <input type="range" min={0} max={1} step={0.05} value={volume} aria-label="Volume" className="hidden w-20 accent-primary sm:block"
        onChange={e => { const v = ref.current; const n = Number(e.target.value); setVolume(n); if (v) { v.volume = n; v.muted = n === 0; setMuted(n === 0); } }} />}
    </div>
  </div>;
}
