import { describe, expect, test } from 'bun:test';
import { forwardReadAllowed, containsRoomQuote, MAX_CONTEXT_MS, MAX_PAUSE_MS, ROOM_REQUEST_LIMIT, roomFocusLabels, FORWARD_READ_PRIVACY_VERIFIED } from '../supabase/functions/_shared/forward-read-rules';

const now = Date.parse('2026-11-25T10:00:00Z');
const session = { status: 'active', room_audio_enabled: true, forward_read_agreed_at: new Date(now).toISOString(), forward_read_paused_at: null };
describe('Forward Read privacy and consent', () => {
  test('off by default and no listening without whole-room agreement', () => {
    expect(forwardReadAllowed({ ...session, room_audio_enabled: false }, now, true)).toBe(false);
    expect(forwardReadAllowed({ ...session, forward_read_agreed_at: null }, now, true)).toBe(false);
    expect(forwardReadAllowed(session, now, true)).toBe(true);
  });
  test('unverified diagnostic retention blocks all live listening', () => {
    expect(FORWARD_READ_PRIVACY_VERIFIED).toBe(false);
    expect(forwardReadAllowed(session, now)).toBe(false);
  });
  test('pause expires at 30 minutes', () => {
    const paused = { ...session, status: 'paused', forward_read_paused_at: new Date(now - MAX_PAUSE_MS).toISOString() };
    expect(MAX_PAUSE_MS).toBe(1_800_000);
    expect(forwardReadAllowed(paused, now, true)).toBe(false);
    expect(forwardReadAllowed(paused, now - 1, true)).toBe(true);
  });
  test('completed and locked sessions never listen', () => {
    expect(forwardReadAllowed({ ...session, status: 'completed' }, now, true)).toBe(false);
    expect(forwardReadAllowed({ ...session, status: 'locked' }, now, true)).toBe(false);
  });
  test('context ceiling is ten minutes and AI request limit is ten per hour', () => {
    expect(MAX_CONTEXT_MS).toBe(600_000);
    expect(ROOM_REQUEST_LIMIT).toBe(10);
  });
  test('room quotes are rejected in any generated field', () => {
    const room = 'I think we should wait for legal before posting anything';
    expect(containsRoomQuote('They said: we should wait for legal.', room)).toBe(true);
    expect(containsRoomQuote('A fictional campaign disputes the company statement', room)).toBe(false);
    expect(roomFocusLabels.legal).toBe('Room was weighing legal advice');
    expect(containsRoomQuote(roomFocusLabels.legal, room)).toBe(false);
  });
});