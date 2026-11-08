import { test, expect } from 'bun:test';
import { asPhoto } from '../src/components/redteam/HostedPhotoMedia';
test('only durable photo references are accepted as photo attachments', () => {
  expect(asPhoto({ kind: 'photo', storagePath: 'session/photo.png', caption: '', subject: 'board' })?.storagePath).toBe('session/photo.png');
  expect(asPhoto({ kind: 'photo', storagePath: 10 })).toBeNull();
  expect(asPhoto({ kind: 'video', storagePath: 'clip.mp4' })).toBeNull();
});