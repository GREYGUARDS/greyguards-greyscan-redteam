import { expect, test } from 'bun:test';
import { cataloguePhase, filterCatalogue, type CatalogueEntry } from '../src/lib/injectCatalogue';

const entries: CatalogueEntry[] = [
  { id: 'demo', brand: 'PigeeBank!', session: 'Public demo', origin: 'demo', channel: 'TikTok', phase: 'Opening', status: 'Scripted', content: 'Withdrawal rumour', source: 'Creator', offset: 150 },
  { id: 'saved', brand: 'Client', session: 'Prepared session', origin: 'saved', channel: 'Website', phase: 'Pressure', status: 'Ready', content: 'Forged notice', source: 'News Tonight', offset: 500 },
];
test('catalogue combines company, channel, phase and origin filters', () => {
  expect(filterCatalogue(entries, { search: 'withdrawal', brand: 'PigeeBank!', channel: 'TikTok', phase: 'Opening', origin: 'demo' }).map(e => e.id)).toEqual(['demo']);
  expect(filterCatalogue(entries, { search: '', brand: 'Client', channel: 'TikTok', phase: 'all', origin: 'all' })).toEqual([]);
});
test('saved inject search includes session and source', () => {
  expect(filterCatalogue(entries, { search: 'NEWS TONIGHT', brand: 'all', channel: 'all', phase: 'all', origin: 'saved' }).map(e => e.id)).toEqual(['saved']);
});
test('phase uses the session duration rather than a fixed demo clock', () => {
  expect(cataloguePhase(150, 600)).toBe('Opening');
  expect(cataloguePhase(300, 600)).toBe('Escalation');
  expect(cataloguePhase(500, 600)).toBe('Pressure');
  expect(cataloguePhase(500, 3600)).toBe('Opening');
});