import type { Inject } from '@/pages/RedTeam';
import type { Tables } from '@/integrations/supabase/types';

export interface CatalogueEntry {
  id: string;
  brand: string;
  session: string;
  origin: 'demo' | 'saved';
  channel: string;
  phase: string;
  status: string;
  inject?: Inject;
  saved?: Tables<'exercise_injects'>;
  companyId?: string;
  content: string;
  source: string;
  offset: number;
}

export function cataloguePhase(offset: number, durationSeconds: number): string {
  const progress = offset / Math.max(1, durationSeconds);
  return progress < 1 / 3 ? 'Opening' : progress < 2 / 3 ? 'Escalation' : 'Pressure';
}

export function filterCatalogue(entries: CatalogueEntry[], filters: { search: string; brand: string; channel: string; phase: string; origin: string }): CatalogueEntry[] {
  const query = filters.search.trim().toLowerCase();
  return entries.filter(entry =>
    (filters.brand === 'all' || entry.brand === filters.brand) &&
    (filters.channel === 'all' || entry.channel === filters.channel) &&
    (filters.phase === 'all' || entry.phase === filters.phase) &&
    (filters.origin === 'all' || entry.origin === filters.origin) &&
    (!query || `${entry.brand} ${entry.session} ${entry.source} ${entry.content}`.toLowerCase().includes(query))
  );
}