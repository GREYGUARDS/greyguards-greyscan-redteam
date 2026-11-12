import { expect, test } from 'bun:test';
import { canAccessProduct, normaliseExerciseCode } from '../src/lib/guestExerciseAccess';

test('guests may enter only the Blue Team joining product', () => {
  expect(canAccessProduct({ is_anonymous: true }, true)).toBe(true);
  expect(canAccessProduct({ is_anonymous: true })).toBe(false);
});
test('code entry alone does not bypass session authentication', () => {
  expect(canAccessProduct(null, true)).toBe(false);
});
test('host accounts retain access and entered codes are normalised', () => {
  expect(canAccessProduct({ is_anonymous: false })).toBe(true);
  expect(normaliseExerciseCode(' abc123 ')).toBe('ABC123');
});