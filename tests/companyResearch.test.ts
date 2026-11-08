import { test, expect } from 'bun:test';
import { supportedBoard } from '../supabase/functions/_shared/company-research';

const sources = [{ id: 'S1', title: 'Company leadership', url: 'https://company.example/board', text: 'Jane Example serves as Chief Executive. Alex Sample serves as Chair.', source: 'company' }];
test('real board identities require matching source evidence for name and role', () => {
  expect(supportedBoard([{ name: 'Jane Example', role: 'Chief Executive', sourceId: 'S1', evidence: 'Jane Example serves as Chief Executive.' }], sources)).toHaveLength(1);
  expect(supportedBoard([{ name: 'Invented Person', role: 'Chief Executive', sourceId: 'S1', evidence: 'Jane Example serves as Chief Executive.' }], sources)).toHaveLength(0);
  expect(supportedBoard([{ name: 'Jane Example', role: 'Chair', sourceId: 'S1', evidence: 'Jane Example serves as Chief Executive.' }], sources)).toHaveLength(0);
  expect(supportedBoard([{ name: 'Jane Example', role: 'Chief Executive', sourceId: 'S99', evidence: 'Jane Example serves as Chief Executive.' }], sources)).toHaveLength(0);
});