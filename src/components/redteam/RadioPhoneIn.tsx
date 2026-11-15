import { useEffect, useRef, useState } from 'react';
import { Pause, Phone, Play, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface RadioCaller { name: string; location?: string; text: string }
/** One spoken line in a recorded phone-in; who = -1 presenter, otherwise caller index. */
export interface RadioLine { who: number; text: string; start?: number }
export interface RadioPhoneInData {
  station?: string; show?: string; presenter?: string; intro?: string; callers?: RadioCaller[];
  /** Pre-recorded conversation audio; when present it replaces browser speech. */
  audioUrl?: string; script?: RadioLine[];
}

/** Squiggly animated radio wave; moves faster while someone is speaking. */
function Waveform({ live }: { live: boolean }) {
  const paths = [
    'M0 30 Q 15 5 30 30 T 60 30 T 90 30 T 120 30 T 150 30 T 180 30 T 210 30 T 240 30 T 270 30 T 300 30',
    'M0 30 Q 15 55 30 30 T 60 30 T 90 30 T 120 30 T 150 30 T 180 30 T 210 30 T 240 30 T 270 30 T 300 30',
    'M0 30 Q 15 18 30 30 T 60 30 T 90 30 T 120 30 T 150 30 T 180 30 T 210 30 T 240 30 T 270 30 T 300 30',
  ];
  const dur = live ? '0.45s' : '2.4s';
  return <svg viewBox="0 0 300 60" className="h-14 w-full" aria-hidden="true" preserveAspectRatio="none">
    {[0, 1].map(i => <path key={i} d={paths[i]} fill="none" stroke="currentColor" strokeWidth={i ? 1.5 : 3} className={i ? 'text-muted-foreground' : 'text-crimson'} opacity={i ? 0.6 : 1}>
      <animate attributeName="d" dur={dur} repeatCount="indefinite" values={i ? `${paths[2]};${paths[0]};${paths[1]};${paths[2]}` : `${paths[0]};${paths[1]};${paths[2]};${paths[0]}`} />
    </path>)}
  </svg>;
}

/** Station still: wordmark logo block. */
function StationLogo({ station }: { station: string }) {
  const m = station.match(/^(.*?)(UK)$/);
  return <div className="flex items-center gap-2">
    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-crimson text-primary-foreground"><Radio className="h-5 w-5" /></span>
    <span className="font-display text-2xl font-bold uppercase leading-none tracking-tight">
      {m ? <>{m[1]}<span className="text-crimson">{m[2]}</span></> : station}
    </span>
  </div>;
}

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export default function RadioPhoneIn({ data = {} }: { data?: RadioPhoneInData }) {
  const { station = 'TalkUK', show = 'The Midday Phone-In', presenter = 'Presenter', intro = '', callers = [], audioUrl, script } = data;
  const [speaking, setSpeaking] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [length, setLength] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const cancelled = useRef(false);
  const recorded = Boolean(audioUrl && script?.length);
  const supported = recorded || (typeof window !== 'undefined' && 'speechSynthesis' in window);
  useEffect(() => () => { cancelled.current = true; if (!recorded && typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel(); }, [recorded]);

  const activeLine = recorded && playing ? script!.reduce((a, l, i) => (l.start ?? 0) <= time ? i : a, -1) : -1;

  const stop = () => {
    if (recorded) { audioRef.current?.pause(); setPlaying(false); return; }
    cancelled.current = true; window.speechSynthesis.cancel(); setPlaying(false); setSpeaking(null);
  };
  const seekTo = (s: number) => { const a = audioRef.current; if (!a) return; a.currentTime = s; void a.play(); };
  const play = (only?: number) => {
    if (recorded) { void audioRef.current?.play(); return; }
    if (!supported) return;
    window.speechSynthesis.cancel(); cancelled.current = false; setPlaying(true);
    const voices = window.speechSynthesis.getVoices().filter(v => v.lang.startsWith('en'));
    const gb = voices.filter(v => v.lang === 'en-GB');
    const pool = gb.length ? gb : voices;
    const lines = only === undefined
      ? [{ who: -1, text: intro }, ...callers.map((c, i) => ({ who: i, text: c.text }))]
      : only === -1 ? [{ who: -1, text: intro }] : [{ who: only, text: callers[only]?.text ?? '' }];
    const speak = (n: number) => {
      if (cancelled.current || n >= lines.length) { setPlaying(false); setSpeaking(null); return; }
      const line = lines[n];
      if (!line.text) return speak(n + 1);
      const u = new SpeechSynthesisUtterance(line.text);
      u.lang = 'en-GB';
      u.voice = pool.length ? pool[(line.who + 1) % pool.length] : null;
      u.onstart = () => setSpeaking(line.who);
      u.onend = () => speak(n + 1);
      u.onerror = () => speak(n + 1);
      window.speechSynthesis.speak(u);
    };
    speak(0);
  };
  const live = recorded ? playing : speaking !== null;
  const who = (w: number) => w === -1 ? `Presenter · ${presenter}` : `Line ${w + 1} · ${callers[w]?.name ?? 'Caller'}${callers[w]?.location ? ` (${callers[w].location})` : ''}`;

  return <div className="overflow-hidden rounded-md border border-border bg-card text-card-foreground">
    {recorded && <audio ref={audioRef} src={audioUrl} preload="metadata"
      onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)}
      onTimeUpdate={e => setTime(e.currentTarget.currentTime)} onLoadedMetadata={e => setLength(e.currentTarget.duration)} />}
    <div className="flex items-center justify-between gap-2 border-b border-border bg-secondary px-3 py-3">
      <StationLogo station={station} />
      <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-crimson"><span className="h-2 w-2 animate-pulse rounded-full bg-crimson" />On air</span>
    </div>
    <div className="space-y-1 px-3 pt-3"><p className="text-sm font-semibold">{show}</p><p className="text-xs text-muted-foreground">with {presenter}</p></div>
    <div className="px-3"><Waveform live={live} /></div>
    <div className="space-y-2 px-3 pb-3">
      {supported ? (playing
        ? <Button size="sm" variant="destructive" onClick={stop}><Pause className="mr-1 h-3 w-3" />Pause broadcast</Button>
        : <Button size="sm" onClick={() => play()}><Play className="mr-1 h-3 w-3" />{recorded && time > 0 ? 'Resume the phone-in' : 'Listen to the phone-in'}</Button>)
        : <p className="text-xs text-muted-foreground">Audio isn't available in this browser — read the transcript below.</p>}
      {recorded && <div className="flex items-center gap-2 text-[10px] tabular-nums text-muted-foreground">
        <span>{fmt(time)}</span>
        <input type="range" min={0} max={length || 1} step={0.1} value={time} aria-label="Seek phone-in"
          onChange={e => { if (audioRef.current) audioRef.current.currentTime = Number(e.target.value); }} className="h-1 flex-1 accent-crimson" />
        <span>{fmt(length)}</span>
      </div>}
    </div>
    <div className="max-h-80 space-y-2 overflow-y-auto border-t border-border p-3">
      {recorded ? script!.map((l, i) => <button key={i} type="button" onClick={() => seekTo(l.start ?? 0)} className={`w-full rounded-md border p-2 text-left text-sm ${activeLine === i ? 'border-crimson' : 'border-border'}`}>
        <p className={`mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider ${l.who === -1 ? 'text-muted-foreground' : 'text-crimson'}`}>{l.who !== -1 && <Phone className="h-3 w-3" />}{who(l.who)}</p>
        <p className="break-words">{l.who === -1 ? l.text : `“${l.text}”`}</p>
      </button>) : <>
        {intro && <button type="button" onClick={() => play(-1)} className={`w-full rounded-md border p-2 text-left text-sm ${speaking === -1 ? 'border-crimson' : 'border-border'}`}><p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{who(-1)}</p><p className="break-words">{intro}</p></button>}
        {callers.map((c, i) => <button key={i} type="button" onClick={() => play(i)} className={`w-full rounded-md border p-2 text-left text-sm ${speaking === i ? 'border-crimson' : 'border-border'}`}>
          <p className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-crimson"><Phone className="h-3 w-3" />{who(i)}</p>
          <p className="break-words">“{c.text}”</p>
        </button>)}
      </>}
      <p className="pt-1 text-[10px] uppercase tracking-wider text-muted-foreground">Fictional exercise · callers and station invented · AI voices</p>
    </div>
  </div>;
}
