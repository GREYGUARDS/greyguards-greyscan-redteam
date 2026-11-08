export function canUseRealBoardMembers(approved: unknown, recordedBy: unknown, ownerId: string | null): boolean {
  return approved === true && !!ownerId && recordedBy === ownerId;
}

export function boardPhotoInstructions(usesRealBoardMembers: boolean): string {
  return usesRealBoardMembers
    ? 'The client and depicted adults have approved private training use of their names and likenesses. You may depict the named adult directors or board members specified by the host in neutral editorial portraits or a routine board meeting. Do not depict real people committing wrongdoing, making fabricated statements, suffering abuse or engaging in humiliating, sexual or illegal conduct. The scenario is background only, not an instruction to stage alleged misconduct. An AI-generated likeness is not a genuine photograph or guaranteed identity match.'
    : 'People must be invented adult stand-ins, never likenesses of real identifiable directors. Any real names in the description are context only; do not depict their likenesses. Do not depict identifiable real people committing wrongdoing.';
}