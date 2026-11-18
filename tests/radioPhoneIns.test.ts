import { expect, test } from 'bun:test';
import { getDemoInjects } from '../src/lib/demoInjects';
import pharmacoreUk from '../src/assets/radio_pharmacore_uk.mp3.asset.json';

test('Pharmacore uses the recorded UK phone-in with its timed transcript', () => {
  const injects = getDemoInjects('ashworth-reilly');
  const phoneIn = injects?.find(inject => inject.visual?.template === 'radio');
  const data = phoneIn?.visual?.data;

  expect(data?.audioUrl).toBe(pharmacoreUk.url);
  expect(data?.script?.length).toBeGreaterThan(0);
  expect(data?.presenter).toBe('Geoff Pennington');
});
