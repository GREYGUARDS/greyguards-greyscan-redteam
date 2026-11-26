import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CAST as BASE, RADIO_HOSTS, type CastMember, type CastKind } from '@/lib/characterLibrary';
import type { CharacterDraft } from '@/lib/characterDraft';
import { ChevronLeft, Mic, Users, Search, Plus, Check, Video, MessageCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const KEY = 'greyscan-custom-cast';
const shrink = (file: File) => new Promise<string>((resolve, reject) => {
  const img = new Image(); const url = URL.createObjectURL(file);
  img.onload = () => { const c = document.createElement('canvas'); const ratio = Math.min(1, 480 / img.width); c.width = img.width * ratio; c.height = img.height * ratio; const ctx = c.getContext('2d'); URL.revokeObjectURL(url); if (!ctx) { reject(new Error('Photo could not be prepared.')); return; } ctx.drawImage(img, 0, 0, c.width, c.height); resolve(c.toDataURL('image/jpeg', 0.75)); };
  img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Photo could not be opened.')); }; img.src = url;
});
function NewCharacter({ onSave, onCancel }: { onSave: (c: CastMember) => void; onCancel: () => void }) {
  const [f, setF] = useState({ name: '', kind: 'Content creator' as CastKind, voice: '', description: '' });
  const [pics, setPics] = useState<{ label: string; url: string }[]>([]);
  return <form className="max-w-xl space-y-3" onSubmit={e => { e.preventDefault(); if (f.name.trim()) onSave({ id: `custom-${Date.now()}`, ...f, usedIn: [], stills: pics }); }}>
    <h3 className="font-display text-xl">Create new character</h3>
    <Input aria-label="Generic name" placeholder="Generic name, e.g. The Angry Landlord" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} required />
    <Select value={f.kind} onValueChange={kind => setF({ ...f, kind: kind as CastKind })}><SelectTrigger aria-label="Type"><SelectValue /></SelectTrigger><SelectContent>{(['Content creator', 'Member of the public', 'Newsreader'] as const).map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent></Select>
    <Input aria-label="Voice" placeholder="Voice, e.g. Female, 40s, Welsh" value={f.voice} onChange={e => setF({ ...f, voice: e.target.value })} />
    <Textarea aria-label="Description" placeholder="Look, clothes, personality, typical setting" value={f.description} onChange={e => setF({ ...f, description: e.target.value })} />
    <label className="block text-xs text-muted-foreground">Stills (optional)<input type="file" accept="image/*" multiple className="mt-1 block max-w-full text-xs" onChange={async e => { try { const files = Array.from(e.target.files ?? []); const urls = await Promise.all(files.map(shrink)); setPics(p => [...p, ...urls.map((url, i) => ({ url, label: files[i].name.replace(/\.[^.]+$/, '') }))]); } catch { toast.error('Photo could not be opened.'); } }} /></label>
    {pics.length > 0 && <div className="flex flex-wrap gap-2">{pics.map(p => <img key={p.url} src={p.url} alt={p.label} className="h-20 w-14 rounded object-cover" />)}</div>}
    <div className="flex gap-2"><Button type="submit">Save character</Button><Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button></div>
    <p className="text-xs text-muted-foreground">Custom characters are saved on this device only.</p>
  </form>;
}

export default function CharacterLibrary({ onCreate }: { onCreate?: (draft: CharacterDraft) => void }) {
  const [id, setId] = useState<string | null>(null);
  const [chosen, setChosen] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState('all');
  const [custom, setCustom] = useState<CastMember[]>(() => { try { const value = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(value) ? value : []; } catch { return []; } });
  const [adding, setAdding] = useState(false);
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(custom)); } catch { /* storage full */ } }, [custom]);
  const cast = [...BASE, ...custom];
  const person = cast.find(c => c.id === id);
  if (adding) return <NewCharacter onCancel={() => setAdding(false)} onSave={c => { setCustom(x => [...x, c]); setAdding(false); setId(c.id); }} />;
  if (person) {
    const reference = chosen ?? person.stills[0]?.url;
    const create = (kind: CharacterDraft['kind']) => onCreate?.({ name: person.name, voice: person.voice, handle: person.handle, referenceUrl: reference, kind });
    return <div className="space-y-5 pb-3">
      <Button variant="ghost" size="sm" onClick={() => { setId(null); setChosen(null); }}><ChevronLeft className="mr-1 h-4 w-4" />All characters</Button>
      <header className="space-y-2"><p className="text-xs text-muted-foreground">{person.code ?? 'Custom character'} · Fictional · Internal</p><h3 className="font-display text-2xl">{person.name}</h3><p className="text-sm text-muted-foreground">{person.handle}</p><div className="flex flex-wrap gap-2"><Badge variant="outline">{person.group ?? person.kind}</Badge>{person.roles?.map(r => <Badge key={r} variant="secondary">{r}</Badge>)}</div></header>
      <div className="grid gap-4 sm:grid-cols-2"><section className="space-y-2"><h4 className="text-sm font-semibold">Voice & look</h4><p className="text-sm text-muted-foreground">{person.voice}</p><h4 className="pt-2 text-sm font-semibold">Default stance</h4><p className="text-sm text-muted-foreground">{person.description}</p></section><section className="space-y-2">{person.positiveWhen && <><h4 className="text-sm font-semibold">Turns positive when</h4><p className="text-sm text-muted-foreground">{person.positiveWhen}</p></>}{person.bestFit && <><h4 className="pt-2 text-sm font-semibold">Best fit</h4><p className="text-sm text-muted-foreground">{person.bestFit}</p></>}{person.typicalLines && <p className="text-sm italic">{person.typicalLines}</p>}</section></div>
      <p className="text-xs text-muted-foreground">Appears in: {person.usedIn.join(' · ') || 'Not used yet'}</p>
      {onCreate && <div className="flex flex-wrap gap-2 border-y border-border py-3"><Button onClick={() => create(person.kind === 'Newsreader' ? 'news' : 'influencer')}><Video className="mr-2 h-4 w-4" />Create video with {person.name}</Button><Button variant="outline" onClick={() => create('facebook')}><MessageCircle className="mr-2 h-4 w-4" />Create post</Button></div>}
      <h4 className="text-sm font-semibold">Reference stills · {person.stills.length}</h4>
      {!person.stills.length && <p className="text-sm text-muted-foreground">No reference photos supplied.</p>}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{person.stills.map((s, i) => <Button key={`${s.url}:${i}`} variant="outline" onClick={() => setChosen(s.url)} aria-label={`Select ${person.name} reference ${i + 1}`} aria-pressed={reference === s.url} className={`relative block h-auto min-w-0 overflow-hidden p-0 text-left ${reference === s.url ? 'border-primary ring-2 ring-primary' : ''}`}><img src={s.url} alt={`${person.name} · ${s.label}`} loading="lazy" className="aspect-[4/5] w-full object-cover object-top" />{reference === s.url && <Check className="absolute right-2 top-2 h-6 w-6 rounded bg-background p-1 text-primary" />}<span className="block whitespace-normal p-2 text-xs">{s.label}</span></Button>)}</div>
      {reference && <div className="flex flex-wrap gap-2"><Button size="sm" onClick={async () => { try { await navigator.clipboard.writeText(new URL(reference, location.origin).href); toast.success('Reference link copied.'); } catch { toast.error('Could not copy the link.'); } }}>Copy reference link</Button><Button size="sm" variant="outline" onClick={async () => { try { const response = await fetch(reference); if (!response.ok) throw new Error(); const url = URL.createObjectURL(await response.blob()); const link = document.createElement('a'); link.href = url; link.download = `${person.name.replace(/[^a-z0-9]/gi, '-')}-reference.jpg`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); } catch { toast.error('Reference could not be downloaded.'); } }}>Download still</Button></div>}
      {person.id.startsWith('custom-') && <Button size="sm" variant="ghost" className="text-destructive" onClick={() => { setCustom(x => x.filter(c => c.id !== person.id)); setId(null); }}>Delete character</Button>}
    </div>;
  }
  const groups = ['Core exercise cast', 'Student activists', 'Influencers', 'Members of the public', 'Newsreaders', 'Custom characters'];
  const category = (c: CastMember) => c.group ?? (c.kind === 'Newsreader' ? 'Newsreaders' : 'Custom characters');
  const filtered = cast.filter(c => (group === 'all' || category(c) === group) && `${c.name} ${c.handle ?? ''} ${c.code ?? ''} ${c.voice} ${c.description} ${c.roles?.join(' ') ?? ''}`.toLowerCase().includes(query.toLowerCase()));
  return <div className="space-y-6 pb-3">
    <div className="flex flex-wrap items-center justify-between gap-2"><div><h3 className="font-display text-xl">Character library</h3><p className="text-xs text-muted-foreground">30 supplied characters · 3 newsreaders · Fictional · Internal</p></div><Button onClick={() => setAdding(true)}><Plus className="mr-1 h-4 w-4" />Create new character</Button></div>
    <div className="flex flex-col gap-2 sm:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pl-9" aria-label="Search characters" placeholder="Search name, role or accent…" value={query} onChange={e => setQuery(e.target.value)} /></div><Select value={group} onValueChange={setGroup}><SelectTrigger aria-label="Character category" className="sm:w-56"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All characters</SelectItem>{groups.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent></Select></div>
    <p className="text-xs text-muted-foreground">{filtered.length} characters</p>
    {!filtered.length && <p className="py-8 text-center text-muted-foreground">No matching characters.</p>}
    {groups.map(g => { const members = filtered.filter(c => category(c) === g); return members.length ? <section key={g} className="space-y-3"><h3 className="flex items-center gap-2 text-sm font-semibold"><Users className="h-4 w-4" />{g} · {members.length}</h3><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{members.map(c => <Button key={c.id} variant="outline" onClick={() => { setId(c.id); setChosen(null); }} className="block h-auto min-w-0 overflow-hidden p-0 text-left">{c.stills[0] ? <img src={c.stills[0].url} alt={c.name} loading="lazy" className="aspect-[4/5] w-full object-cover object-top" /> : <span className="flex aspect-[4/5] items-center justify-center bg-muted"><Users className="h-8 w-8 text-muted-foreground" /></span>}<span className="block space-y-1 whitespace-normal p-3"><span className="block text-xs text-muted-foreground">{c.code ?? 'Custom'}</span><span className="block break-words text-sm font-semibold">{c.name}</span><span className="line-clamp-2 text-xs text-muted-foreground">{c.voice}</span><span className="block text-xs text-muted-foreground">{c.stills.length} reference stills</span></span></Button>)}</div></section> : null; })}
    <section className="space-y-3 border-t border-border pt-4"><h3 className="flex items-center gap-2 text-sm font-semibold"><Mic className="h-4 w-4" />Radio phone-in hosts</h3><div className="grid gap-3 sm:grid-cols-3">{RADIO_HOSTS.map(h => <div key={h.id} className="rounded-md border border-border p-3"><p className="font-medium">{h.name}</p><p className="text-xs text-muted-foreground">{h.show} · TalkUK · {h.voice} · {h.usedIn}</p><ul className="mt-2 space-y-1 border-t border-border pt-2">{h.callers.map(c => <li key={c.name} className="text-xs"><span className="font-medium">{c.name}, {c.location}</span> — <span className="text-muted-foreground">{c.stance}</span></li>)}</ul></div>)}</div></section>
  </div>;
}
