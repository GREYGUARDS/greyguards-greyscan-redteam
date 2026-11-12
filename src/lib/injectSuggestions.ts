import type { StorylineBeat } from './hostedScenarios';
import type { OverlayPlatform } from '@/components/redteam/InjectOverlay';

export interface StudioSuggestion { script: string; speaker: string; caption: string; handle: string; headline: string; ticker: string; channel: string; brief: string }

const trim = (text: string, max: number) => (text.length <= max ? text : `${text.slice(0, max - 1).replace(/\s+\S*$/, '')}…`);
const firstSentence = (text: string) => text.split(/(?<=[.!?])\s/)[0] ?? text;

/** Instant, offline suggestions built from the storyline beat the session is currently on. */
export function suggestForBeat(kind: string, platform: OverlayPlatform, brand: string, beat: StorylineBeat | null, scenario?: string | null): StudioSuggestion {
  const pick = beat?.injects.find(i => (kind === 'news' || kind === 'website') ? i.type === 'news_article' : kind === 'influencer' ? i.type === 'influencer' || i.type === 'social_post' : i.type === 'social_post' || i.type === 'leak')
    ?? beat?.injects[0];
  const claim = firstSentence(pick?.content ?? beat?.narrative ?? scenario ?? `Questions are being raised about ${brand}.`);
  const headline = trim((beat?.title ?? `${brand} under pressure`).toUpperCase(), 80);
  const tickerItems = (beat?.injects ?? []).map(i => trim(firstSentence(i.content), 90));
  const ticker = [`${brand.toUpperCase()}: ${headline}`, ...tickerItems].join('  •  ');
  const handleBase = brand.toLowerCase().replace(/[^a-z]/g, '').slice(0, 10) || 'brand';
  const handle = platform === 'tiktok' || platform === 'instagram' ? `@thetruthabout${handleBase}` : `@${handleBase}watch`;
  const script = kind === 'news'
    ? trim(`Breaking tonight: ${claim} ${brand} has yet to respond.`, 220)
    : trim(`Okay so nobody is talking about this. ${claim} Share before it gets taken down.`, 220);
  const speaker = kind === 'news'
    ? 'A fictional adult news presenter in a suit at a studio desk, hands on the desk, not holding a phone, serious tone, city skyline screen behind.'
    : 'A fictional adult creator filming a selfie video at home, animated and urgent, speaking straight to camera.';
  const caption = trim(`${claim} #${handleBase} #exposed`, 150);
  const brief = trim(`${beat ? `Story point: ${beat.title}. ${beat.narrative} ` : ''}Inject: ${pick?.content ?? claim} Channel: ${pick?.channel ?? kind}.`, 1400);
  return { script, speaker, caption, handle, headline, ticker: trim(ticker, 290), channel: 'NEWS 24', brief };
}
