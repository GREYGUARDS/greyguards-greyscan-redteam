import { useEffect, useMemo, useState } from 'react';
import { Eye, Library, Monitor, RefreshCw, Smartphone, Video, Image, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { SIMULATION_COMPANIES, getSimulationCompany } from '@/lib/simulationCompanies';
import { getDemoInjects } from '@/lib/demoInjects';
import { cataloguePhase, filterCatalogue, type CatalogueEntry } from '@/lib/injectCatalogue';
import type { Tables } from '@/integrations/supabase/types';
import InjectVisual from './InjectVisual';
import HostedInjectMedia from './HostedInjectMedia';

function channelFor(source: string, fallback: string): string {
  if (/tiktok/i.test(source)) return 'TikTok';
  if (/community page|facebook/i.test(source)) return 'Community page';
  if (/telegram/i.test(source)) return 'Telegram';
  if (/whatsapp|signal/i.test(source)) return 'Messaging';
  if (/news tonight|cbbn|news/i.test(source)) return 'News';
  if (/reddit/i.test(source)) return 'Forum';
  if (/tweets|twitter/i.test(source)) return 'Tweets';
  if (/linkedin/i.test(source)) return 'Professional';
  if (/reviews|trustpilot|glassdoor/i.test(source)) return 'Reviews';
  return fallback.split('_').join(' ');
}

const demos: CatalogueEntry[] = SIMULATION_COMPANIES.flatMap(company => (getDemoInjects(company.id) ?? []).map((inject, index) => ({
  id: `demo:${inject.id}`, brand: company.name, session: 'Public demo', origin: 'demo' as const,
  companyId: company.id, inject, content: inject.content, source: inject.source, offset: inject.timestamp,
  channel: channelFor(inject.source, inject.type), phase: cataloguePhase(inject.timestamp, 600), status: `Inject ${index + 1}`,
})));

function Filter({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return <Select value={value} onValueChange={onChange}><SelectTrigger aria-label={label} className="min-w-0"><SelectValue placeholder={label} /></SelectTrigger><SelectContent><SelectItem value="all">All {label.toLowerCase()}</SelectItem>{options.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent></Select>;
}

export default function MasterInjectSandbox({ refreshKey = 0 }: { refreshKey?: number }) {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<CatalogueEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [phone, setPhone] = useState(true);
  const [filters, setFilters] = useState({ search: '', brand: 'all', channel: 'all', phase: 'all', origin: 'all' });

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    async function load() {
      setLoading(true); setError('');
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) throw new Error('Sign in to view saved injects.');
        const sessions: Tables<'exercise_sessions'>[] = [];
        for (let start = 0; ; start += 500) {
          const { data, error: failure } = await supabase.from('exercise_sessions').select('*').eq('created_by_user_id', user.id).order('created_at', { ascending: false }).order('id').range(start, start + 499);
          if (failure) throw failure;
          sessions.push(...(data ?? []));
          if ((data?.length ?? 0) < 500) break;
        }
        const saved: CatalogueEntry[] = [];
        for (let batch = 0; batch < sessions.length; batch += 50) {
          const group = sessions.slice(batch, batch + 50);
          const byId = new Map(group.map(session => [session.id, session]));
          for (let start = 0; ; start += 500) {
            const { data, error: failure } = await supabase.from('exercise_injects').select('*').in('session_id', group.map(s => s.id)).order('timestamp_offset').order('id').range(start, start + 499);
            if (failure) throw failure;
            for (const inject of data ?? []) {
              const session = byId.get(inject.session_id);
              if (!session) continue;
              saved.push({ id: `saved:${inject.id}`, brand: session.brand_name, session: session.session_label || session.scenario_title || session.brand_name, origin: 'saved', saved: inject,
                content: inject.content, source: inject.source, offset: inject.timestamp_offset, channel: channelFor(inject.source, inject.inject_type),
                phase: inject.phase || cataloguePhase(inject.timestamp_offset, session.duration * 60), status: inject.is_sent ? 'Sent' : 'Ready' });
            }
            if ((data?.length ?? 0) < 500) break;
          }
        }
        if (!cancelled) setEntries(saved);
      } catch {
        if (!cancelled) setError('Saved-session injects could not be loaded. Demo injects are still available.');
      } finally { if (!cancelled) setLoading(false); }
    }
    void load();
    return () => { cancelled = true; };
  }, [open, refreshKey, reload]);

  const all = useMemo(() => [...demos, ...entries], [entries]);
  const filtered = useMemo(() => filterCatalogue(all, filters), [all, filters]);
  const selected = filtered.find(entry => entry.id === selectedId);
  const choices = (key: 'brand' | 'channel' | 'phase') => [...new Set(all.map(entry => entry[key]))].sort();
  const change = (key: keyof typeof filters, value: string) => setFilters(prev => ({ ...prev, [key]: value }));
  const company = selected?.companyId ? getSimulationCompany(selected.companyId) : undefined;

  return <>
    <Button variant="outline" onClick={() => setOpen(true)}><Library className="mr-2 h-4 w-4" />Master Inject Sandbox</Button>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="flex h-[90dvh] w-[calc(100%-1rem)] max-w-6xl flex-col gap-4 overflow-hidden p-4 sm:p-6">
        <DialogHeader className="pr-6"><DialogTitle className="font-display text-2xl">Master Inject Sandbox</DialogTitle><div className="flex flex-wrap gap-2 pt-2"><Badge variant="outline">Internal · Read only</Badge><Badge variant="secondary">{demos.length} demo · {entries.length} saved</Badge></div></DialogHeader>
        <div className="flex gap-2"><Input aria-label="Search inject catalogue" placeholder="Search company, session or content…" value={filters.search} onChange={e => change('search', e.target.value)} /><Button variant="outline" size="icon" aria-label="Refresh inject catalogue" disabled={loading} onClick={() => setReload(v => v + 1)}><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></Button></div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4"><Filter label="Companies" value={filters.brand} onChange={v => change('brand', v)} options={choices('brand')} /><Filter label="Channels" value={filters.channel} onChange={v => change('channel', v)} options={choices('channel')} /><Filter label="Phases" value={filters.phase} onChange={v => change('phase', v)} options={choices('phase')} /><Select value={filters.origin} onValueChange={v => change('origin', v)}><SelectTrigger aria-label="Catalogue source"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All sources</SelectItem><SelectItem value="demo">Demo scripts</SelectItem><SelectItem value="saved">Saved sessions</SelectItem></SelectContent></Select></div>
        {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
        {loading && <p role="status" className="text-xs text-muted-foreground">Loading saved injects…</p>}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {selected ? <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2"><Button variant="ghost" onClick={() => setSelectedId(null)}>← Catalogue</Button><div className="flex gap-1"><Button variant={phone ? 'secondary' : 'ghost'} size="icon" aria-label="Phone preview" aria-pressed={phone} onClick={() => setPhone(true)}><Smartphone className="h-4 w-4" /></Button><Button variant={!phone ? 'secondary' : 'ghost'} size="icon" aria-label="Desktop preview" aria-pressed={!phone} onClick={() => setPhone(false)}><Monitor className="h-4 w-4" /></Button></div></div>
            <div className="space-y-1"><h3 className="break-words font-semibold">{selected.brand} · {selected.status}</h3><p className="break-words text-xs text-muted-foreground">{selected.session} · {selected.channel} · {selected.phase} · {Math.floor(selected.offset / 60)}:{String(selected.offset % 60).padStart(2, '0')}</p><p className="break-words text-xs text-muted-foreground">{selected.source}</p></div>
            <div className={`mx-auto w-full min-w-0 ${phone ? 'max-w-[375px]' : 'max-w-3xl'}`} key={selected.id}>
              {selected.inject ? <InjectVisual inject={selected.inject} company={company} /> : selected.saved && <><p className="whitespace-pre-wrap break-words text-sm">{selected.content}</p><HostedInjectMedia storagePath={selected.saved.video_storage_path} artefact={selected.saved.artefact} /></>}
            </div>
            <section className="space-y-2 border-t border-border pt-4"><h3 className="text-sm font-semibold">Response matrix</h3>{selected.inject?.responseOptions?.length ? <div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr className="border-b border-border text-muted-foreground"><th className="p-2">Action</th><th className="p-2">Effectiveness</th><th className="p-2">Risk</th><th className="p-2">Time</th></tr></thead><tbody>{selected.inject.responseOptions.map(option => <tr key={option.id} className="border-b border-border"><td className="min-w-40 p-2"><p className="font-medium">{option.label}</p><p className="mt-1 text-muted-foreground">{option.description}</p></td><td className="p-2">{option.effectiveness}%</td><td className="p-2">{option.riskLevel}</td><td className="p-2">{option.timeToExecute}s</td></tr>)}</tbody></table><p className="mt-2 text-xs text-muted-foreground">Scripted training scores · host view only</p></div> : <p className="text-xs text-muted-foreground">Participant-written responses · no preset response matrix</p>}</section>
          </div> : <>
            <p className="mb-3 text-xs text-muted-foreground">{filtered.length} injects</p>
            {filtered.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">No matching injects.</p> : <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{filtered.map(entry => {
              const video = entry.inject?.demoVideo?.url;
              const mediaIcon = video || entry.saved?.video_storage_path ? <Video className="h-5 w-5" /> : entry.inject?.visual || entry.saved?.artefact ? <Image className="h-5 w-5" /> : <FileText className="h-5 w-5" />;
              return <article key={entry.id} className="min-w-0 overflow-hidden rounded-md border border-border bg-card"><div className="relative flex h-28 items-center justify-center overflow-hidden border-b border-border bg-secondary text-muted-foreground">{video ? <video src={video} muted playsInline preload="metadata" className="h-full w-full object-cover" /> : <div className="space-y-2 p-3">{mediaIcon}<p className="line-clamp-3 break-words text-xs">{entry.content}</p></div>}<Badge variant="secondary" className="absolute right-2 top-2">{entry.channel}</Badge></div><div className="space-y-2 p-3"><div className="flex flex-wrap gap-1"><Badge variant="outline">{entry.status}</Badge><span className="text-[10px] text-muted-foreground">{entry.phase}</span></div><h3 className="break-words text-sm font-semibold">{entry.brand}</h3><p className="line-clamp-1 text-xs text-muted-foreground">{entry.session}</p><p className="line-clamp-2 break-words text-xs">{entry.content}</p><Button variant="outline" size="sm" className="w-full" aria-label={`Preview ${entry.brand} ${entry.status}`} onClick={() => setSelectedId(entry.id)}><Eye className="mr-2 h-3 w-3" />Preview</Button></div></article>;
            })}</div>}
          </>}
        </div>
      </DialogContent>
    </Dialog>
  </>;
}