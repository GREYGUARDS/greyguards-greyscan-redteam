import { describe, expect, test } from 'bun:test';
import { canHostVideo, canPublishVideo, canPrepareInject, canSavePreparedVideo, VIDEO_DURATION_SECONDS, VIDEO_CREATE_LIMIT } from '../supabase/functions/_shared/hosted-inject-rules';

describe('hosted video rules', () => {
  test('only the admin who owns the session can generate video', () => {
    expect(canHostVideo(true, 'host', 'host')).toBe(true);
    expect(canHostVideo(false, 'host', 'host')).toBe(false);
    expect(canHostVideo(true, 'other', 'host')).toBe(false);
    expect(canHostVideo(true, 'host', null)).toBe(false);
  });
  test('video is reviewed and ready before delivery to an active session', () => {
    expect(canPublishVideo('completed', 'clip.mp4', 'active')).toBe(true);
    expect(canPublishVideo('in_progress', null, 'active')).toBe(false);
    expect(canPublishVideo('completed', null, 'active')).toBe(false);
    expect(canPublishVideo('completed', 'clip.mp4', 'waiting')).toBe(false);
  });
  test('new clips last eight seconds', () => expect(VIDEO_DURATION_SECONDS).toBe(8));
  test('clip creation is capped at ten per hour', () => expect(VIDEO_CREATE_LIMIT).toBe(10));
});
test('prepare client sessions without starting or sending', () => {
  expect(canPrepareInject('preparing')).toBe(true);
  expect(canPrepareInject('completed')).toBe(false);
  expect(canPublishVideo('completed', 'clip.mp4', 'preparing')).toBe(false);
});
test('ready shelf requires completed footage', () => {
  expect(canSavePreparedVideo('completed', 'clip.mp4', 'preparing')).toBe(true);
  expect(canSavePreparedVideo('queued', null, 'preparing')).toBe(false);
});
