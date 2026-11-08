import { test, expect } from 'bun:test';
import { canUseRealBoardMembers, boardPhotoInstructions } from '../supabase/functions/_shared/board-image-consent';
test('real board members require explicit approval recorded by the session owner', () => {
  expect(canUseRealBoardMembers(true, 'host', 'host')).toBe(true);
  expect(canUseRealBoardMembers(false, 'host', 'host')).toBe(false);
  expect(canUseRealBoardMembers(undefined, 'host', 'host')).toBe(false);
  expect(canUseRealBoardMembers('true', 'host', 'host')).toBe(false);
  expect(canUseRealBoardMembers(true, 'participant', 'host')).toBe(false);
  expect(canUseRealBoardMembers(true, null, null)).toBe(false);
});
test('default portrait instructions require stand-ins', () => {
  expect(boardPhotoInstructions(false)).toContain('never likenesses of real identifiable directors');
});
test('approval allows neutral named portraits but not fabricated wrongdoing', () => {
  expect(boardPhotoInstructions(true)).toContain('named adult directors');
  expect(boardPhotoInstructions(true)).toContain('Do not depict real people committing wrongdoing');
  expect(boardPhotoInstructions(true)).toContain('not a genuine photograph');
});