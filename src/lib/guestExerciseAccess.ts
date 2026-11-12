export function canAccessProduct(user: { is_anonymous?: boolean } | null | undefined, allowGuest = false): boolean {
  return !!user && (!user.is_anonymous || allowGuest);
}

export function normaliseExerciseCode(code: string): string {
  return code.trim().toUpperCase();
}