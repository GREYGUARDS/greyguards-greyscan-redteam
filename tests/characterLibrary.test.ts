import { expect, test } from 'bun:test';
import profiles from '../src/lib/characterProfiles.json';
import { characterSpeaker, characterPostBrief } from '../src/lib/characterDraft';

test('the supplied library contains 30 distinct character identities', () => {
  expect(profiles).toHaveLength(30);
  expect(new Set(profiles.map(p => p.code)).size).toBe(30);
  expect(profiles[1].name).toBe('Jo Mercer');
  expect(profiles[3].name).toBe('Chloe Taylor');
  expect(profiles[2].stills).toHaveLength(0); // Matt uses existing approved film stills.
  expect(profiles.filter(p => p.group === 'Student activists')).toHaveLength(8);
});
test('character selection produces an explicitly fictional, bounded speaker draft', () => {
  const c = { name: 'Jo Mercer', voice: profiles[1].fields['VOICE AND LOOK'], handle: '@sheffieldmum_jo_GG02', kind: 'influencer' as const };
  expect(characterSpeaker(c)).toContain('Fictional adult Jo Mercer');
  expect(characterSpeaker(c)).toContain('Sheffield');
  expect(characterSpeaker({ ...c, voice: 'x'.repeat(400) }).length).toBe(300);
  expect(characterPostBrief(c)).toContain('@sheffieldmum_jo_GG02');
});
