import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CAST as BASE, type CastMember, type CastKind } from '@/lib/characterLibrary';
import { ChevronLeft, Mic, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RADIO_HOSTS } from '@/lib/characterLibrary';

const KEY = 'greyscan-custom-cast';
const shrink = (file: File) => new Promise<string>(res => { const img = new Image(); img.onload = () => { const c = document.createElement('canvas'); const r = 480 / img.width; c.width = 480; c.height = img.height * r; c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', 0.75)); }; img.src = URL.createObjectURL(file); });

function NewCharacter({ onSave, onCancel }: { onSave: (c: CastMember) => void; onCancel: () => void }) {
  const [f, setF] = useState({ name: '', kind: 'Content creator' as CastKind, voice: '', description: '' });
  const [pics, setPics] = useState<{ label: string; url: string }[]>([]);
  return <form className="max-w-xl space-y-3" onSubmit={e => { e.preventDefault(); if (f.name.trim()) onSave({ id: `custom-${Date.now()}`, ...f, usedIn: [], stills: pics }); }}>
    <h3 className="font-display text-xl">Create new character</h3>
    <Input aria-label="Generic name" placeholder="Generic name, e.g. The Angry Landlord" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} required />
    <select aria-label="Type" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={f.kind} onChange={e => setF({ ...f, kind: e.target.value as CastKind })}><option>Content creator</option><option>Member of the public</option><option>Newsreader</option></select>
    <Input aria-label="Voice" placeholder="Voice, e.g. Female, 40s, Welsh" value={f.voice} onChange={e => setF({ ...f, voice: e.target.value })} />
    <Textarea aria-label="Description" placeholder="Look, clothes, personality, typical setting" value={f.description} onChange={e => setF({ ...f, description: e.target.value })} />
    <label className="block text-xs text-muted-foreground">Stills (optional)<input type="file" accept="image/*" multiple className="mt-1 block text-xs" onChange={async e => { const files = Array.from(e.target.files ?? []); const urls = await Promise.all(files.map(shrink)); setPics(p => [...p, ...urls.map((url, i) => ({ url, label: files[i].name.replace(/\.[^.]+$/, '') }))]); }} /></label>
    {pics.length > 0 && <div className="flex flex-wrap gap-2">{pics.map(p => <img key={p.url} src={p.url} alt={p.label} className="h-20 w-14 rounded object-cover" />)}</div>}
    <div className="flex gap-2"><Button type="submit">Save character</Button><Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button></div>
    <p className="text-xs text-muted-foreground">Saved on this device. New film or stills of them can be generated later from this description.</p>
  </form>;
}

export default function CharacterLibrary() {
  const [id, setId] = useState<string | null>(null);
  const [chosen, setChosen] = useState<string | null>(null);
  const [custom, setCustom] = useState<CastMember[]>(() => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } });
  const [adding, setAdding] = useState(false);
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(custom)); } catch { /* storage full */ } }, [custom]);
  const CAST = [...BASE, ...custom];
  if (adding) return <NewCharacter onCancel={() => setAdding(false)} onSave={c => { setCustom(x => [...x, c]); setAdding(false); setId(c.id); }} />;
  const person = CAST.find(c => c.id === id);
  if (person) return <div className="space-y-4">
    <Button variant="ghost" size="sm" onClick={() => { setId(null); setChosen(null); }}><ChevronLeft className="mr-1 h-4 w-4" />All characters</Button>
    <div><h3 className="font-display text-xl">{person.name}</h3><div className="mt-1 flex flex-wrap gap-2"><Badge variant="outline">{person.kind}</Badge>{person.voice && <Badge variant="secondary">{person.voice}</Badge>}</div><p className="mt-2 text-sm text-muted-foreground">{person.description}</p><p className="mt-1 text-xs text-muted-foreground">Appears in: {person.usedIn.join(' · ') || 'Not used yet'}</p>{person.id.startsWith('custom-') && <Button size="sm" variant="ghost" className="mt-1 text-destructive" onClick={() => { setCustom(x => x.filter(c => c.id !== person.id)); setId(null); }}>Delete character</Button>}</div>
    <p className="text-xs text-muted-foreground">{person.stills.length ? 'Select a still to use as the reference when creating content.' : 'No stills yet. Add photos when creating a character, or generate them from the description.'}</p>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{person.stills.map(s => <button key={s.url} type="button" onClick={() => setChosen(s.url)} aria-pressed={chosen === s.url} className={`overflow-hidden rounded-md border text-left ${chosen === s.url ? 'border-primary ring-2 ring-primary' : 'border-border'}`}><img src={s.url} alt={`${person.name} · ${s.label}`} loading="lazy" className="aspect-[9/16] w-full object-cover" /><span className="block p-2 text-xs">{s.label}</span></button>)}</div>
    {chosen && <div className="flex flex-wrap gap-2"><Button size="sm" onClick={() => navigator.clipboard?.writeText(new URL(chosen, location.origin).href)}>Copy reference link</Button><Button size="sm" variant="outline" asChild><a href={chosen} download>Download still</a></Button></div>}
  </div>;
  return <div className="space-y-6">
    <Button onClick={() => setAdding(true)}>+ Create new character</Button>
    {(['Content creator', 'Member of the public', 'Newsreader'] as const).map(kind => <section key={kind} className="space-y-2"><h3 className="flex items-center gap-2 text-sm font-semibold"><Users className="h-4 w-4" />{kind === 'Member of the public' ? 'Members of the public' : `${kind}s`}</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{CAST.filter(c => c.kind === kind).map(c => <button key={c.id} type="button" onClick={() => setId(c.id)} className="overflow-hidden rounded-md border border-border text-left hover:border-primary">{c.stills[0] ? <img src={c.stills[0].url} alt={c.name} loading="lazy" className="aspect-[4/5] w-full object-cover object-top" /> : <span className="flex aspect-[4/5] w-full items-center justify-center bg-muted"><Users className="h-8 w-8 text-muted-foreground" /></span>}<span className="block p-2"><span className="block text-sm font-medium">{c.name}</span><span className="block text-xs text-muted-foreground">{c.stills.length} stills · {c.voice}</span></span></button>)}</div></section>)}
    <section className="space-y-2"><h3 className="flex items-center gap-2 text-sm font-semibold"><Mic className="h-4 w-4" />Radio phone-in hosts</h3>
      <div className="grid gap-3 sm:grid-cols-3">{RADIO_HOSTS.map(h => <div key={h.id} className="rounded-md border border-border p-3"><p className="font-medium">{h.name}</p><p className="text-xs text-muted-foreground">{h.show} · TalkUK · {h.voice} · {h.usedIn}</p><ul className="mt-2 space-y-1 border-t border-border pt-2">{h.callers.map(c => <li key={c.name} className="text-xs"><span className="font-medium">{c.name}, {c.location}</span> — <span className="text-muted-foreground">{c.stance}</span></li>)}</ul></div>)}</div></section>
  </div>;
}
