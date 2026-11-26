export interface CharacterDraft {
  name: string;
  voice: string;
  handle?: string;
  referenceUrl?: string;
  kind: 'influencer' | 'news' | 'facebook';
}

export function characterSpeaker(character: CharacterDraft): string {
  return `Fictional adult ${character.name}. ${character.voice}`.slice(0, 300);
}

export function characterPostBrief(character: CharacterDraft): string {
  return `Fictional exercise post by ${character.name}${character.handle ? ` (${character.handle})` : ''}. Voice and look: ${character.voice}\nClaim and response: `;
}