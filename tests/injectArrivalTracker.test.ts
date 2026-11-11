import { expect, test } from 'bun:test';
import { createInjectArrivalTracker } from '../src/lib/injectArrivalTracker';
test('first inject alerts after any number of successful empty reads', () => {
  const tracker = createInjectArrivalTracker();
  expect(tracker.accept([])).toEqual([]);
  expect(tracker.accept([])).toEqual([]);
  expect(tracker.accept([{ id: 'first' }])).toEqual([{ id: 'first' }]);
});
test('joining an existing feed does not replay alerts or duplicate realtime notifications', () => {
  const tracker = createInjectArrivalTracker();
  expect(tracker.accept([{ id: 'old' }])).toEqual([]);
  expect(tracker.accept([{ id: 'new' }, { id: 'old' }])).toEqual([{ id: 'new' }]);
  expect(tracker.accept([{ id: 'new' }, { id: 'old' }])).toEqual([]);
});