import { useEffect, useRef, useState } from 'react';
import { Pause, Phone, Play, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface RadioCaller { name: string; location?: string; text: string }
export interface RadioPhoneInData { station?: string; show?: string; presenter?: string; intro?: string; callers?: RadioCaller[] }

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

export default function RadioPhoneIn({ data = {} }: { data?: RadioPhoneInData }) {
  const { station = 'TalkUK', show = 'The Midday Phone-In', presenter = 'Presenter', intro = '', callers = [] } = data;
  const [speaking, setSpeaking] = useState<number | null>(null); // -1 presenter, n caller
  const [playing, setPlaying] = useState(false);
  const cancelled = useRef(false);
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  useEffect(() => () => { cancelled.current = true; if (supported) window.speechSynthesis.cancel(); }, [supported]);

  const stop = () => { cancelled.current = true; if (supported) window.speechSynthesis.cancel(); setPlaying(false); setSpeaking(null); };
  const play = (only?: number) => {
    if (!supported) return;
    window.speechSynthesis.cancel(); cancelled.current = false; setPlaying(true);
    const voices = window.speechSynthesis.getVoices().filter(v => v.lang.startsWith('en'));
    const gb = voices.filter(v => v.lang === 'en-GB');
    const pool = gb.length ? gb : voices;
    const lines = only === undefined
      ? [{ who: -1, text: intro }, ...callers.map((c, i) => ({ who: i, text: `${c.text}` }))]
      : only === -1 ? [{ who: -1, text: intro }] : [{ who: only, text: callers[only]?.text ?? '' }];
    const speak = (n: number) => {
      if (cancelled.current || n >= lines.length) { setPlaying(false); setSpeaking(null); return; }
      const line = lines[n];
      if (!line.text) return speak(n + 1);
      const u = new SpeechSynthesisUtterance(line.text);
      u.lang = 'en-GB';
      u.voice = pool.length ? pool[(line.who + 1) % pool.length] : null;
      u.pitch = line.who === -1 ? 0.9 : [1.2, 0.8, 1.05, 0.7][line.who % 4];
      u.rate = line.who === -1 ? 1 : 1.12;
      u.onstart = () => setSpeaking(line.who);
      u.onend = () => speak(n + 1);
      u.onerror = () => speak(n + 1);
      window.speechSynthesis.speak(u);
    };
    speak(0);
  };

  return <div className="overflow-hidden rounded-md border border-border bg-card text-card-foreground">
    <div className="flex items-center justify-between gap-2 border-b border-border bg-secondary px-3 py-2">
      <div className="flex items-center gap-2"><Radio className="h-5 w-5 text-crimson" /><span className="font-display text-xl font-bold uppercase tracking-tight">{station}</span></div>
      <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-crimson"><span className="h-2 w-2 animate-pulse rounded-full bg-crimson" />On air</span>
    </div>
    <div className="space-y-1 px-3 pt-3"><p className="text-sm font-semibold">{show}</p><p className="text-xs text-muted-foreground">with {presenter}</p></div>
    <div className="px-3"><Waveform live={speaking !== null} /></div>
    <div className="flex flex-wrap gap-2 px-3 pb-3">
      {supported ? (playing
        ? <Button size="sm" variant="destructive" onClick={stop}><Pause className="mr-1 h-3 w-3" />Stop broadcast</Button>
        : <Button size="sm" onClick={() => play()}><Play className="mr-1 h-3 w-3" />Listen to the phone-in</Button>)
        : <p className="text-xs text-muted-foreground">Audio isn't available in this browser — read the transcript below.</p>}
    </div>
    <div className="space-y-2 border-t border-border p-3">
      {intro && <button type="button" onClick={() => play(-1)} className={`w-full rounded-md border p-2 text-left text-sm ${speaking === -1 ? 'border-crimson' : 'border-border'}`}><p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Presenter · {presenter}</p><p className="break-words">{intro}</p></button>}
      {callers.map((c, i) => <button key={i} type="button" onClick={() => play(i)} className={`w-full rounded-md border p-2 text-left text-sm ${speaking === i ? 'border-crimson' : 'border-border'}`}>
        <p className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-crimson"><Phone className="h-3 w-3" />Line {i + 1} · {c.name}{c.location ? ` (${c.location})` : ''}</p>
        <p className="break-words">“{c.text}”</p>
      </button>)}
      <p className="pt-1 text-[10px] uppercase tracking-wider text-muted-foreground">Fictional exercise · callers and station invented</p>
    </div>
  </div>;
}
