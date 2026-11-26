import profiles from './characterProfiles.json';
/** Reusable fictional cast for exercises. Names are generic so characters can appear in any scenario. */
const stills = import.meta.glob('@/assets/characters/*.asset.json', { eager: true, import: 'default' }) as Record<string, { url: string }>;
const pick = (film: string, labels: string[]) =>
  labels.map((label, i) => ({ label, url: Object.entries(stills).find(([k]) => k.includes(`${film}_`) && k.endsWith(`_${[1, 2, 3].filter(n => !SKIP[film]?.includes(n))[i]}.jpg.asset.json`))?.[1].url ?? '' })).filter(s => s.url);
const SKIP: Record<string, number[]> = { cbbn_pigeebank_female_uk: [2], news_tonight_pharmacore_uk: [3], news_tonight_trustinsure_uk: [3], trustinsure_truth_desk_opening: [2] };

export type CastKind = 'Content creator' | 'Member of the public' | 'Newsreader';
export interface CastMember { id: string; name: string; kind: CastKind; description: string; voice: string; usedIn: string[]; stills: { label: string; url: string }[]; code?: string; group?: string; handle?: string; roles?: string[]; positiveWhen?: string; bestFit?: string; typicalLines?: string }
export interface RadioHost { id: string; name: string; show: string; voice: string; usedIn: string; callers: { name: string; location: string; stance: string }[] }

const EXISTING_CAST: CastMember[] = [
  { id: 'truth-seeker', name: 'The Truth Seeker', kind: 'Content creator', voice: 'Male, 30s, Northern English, angry', description: 'Conspiracy commentator. Baseball cap, glasses, grey T-shirt. Rants at camera and "exposes" documents.', usedIn: ['Pharmacore 1', 'TrustInsure 1', 'PigeeBank 1'], stills: [
    ...pick('pharmacore_greenscreen_opening', ['Green-screen · pointing at document', 'Green-screen · close-up rant', 'Green-screen · to camera']),
    ...pick('trustinsure_truth_desk_opening', ['"THE TRUTH" desk · gesturing', '"THE TRUTH" desk · to camera']),
    ...pick('pigeebank_dim_studio_opening', ['Dark studio · pointing', 'Dark studio · laptop evidence', 'Dark studio · jabbing finger']) ] },
  { id: 'worried-mum', name: 'The Worried Mum', kind: 'Member of the public', voice: 'Female, 30s, Sheffield accent', description: 'Ordinary parent who posts on TikTok. Moves from fear to relief as the story turns.', usedIn: ['Pharmacore 2', 'Pharmacore 9'], stills: [
    ...pick('demo_video_pharmacore', ['In car · tearful', 'In car · holding medicine', 'In car · upset']),
    ...pick('pharmacore_mum_kitchen_followup', ['Kitchen at night · nightie', 'Kitchen at night · talking', 'Kitchen at night · mid shot']) ] },
  { id: 'firefighter', name: 'The Firefighter', kind: 'Member of the public', voice: 'Male, 30s, British', description: 'Trusted local firefighter in uniform, sooty after flood work. Credible community voice.', usedIn: ['TrustInsure 5', 'TrustInsure 9'], stills: pick('trustinsure_firefighter_reaction', ['Flooded street · to camera', 'Flooded street · angry', 'Flooded street · close-up']) },
  { id: 'young-renter', name: 'The Young Renter', kind: 'Member of the public', voice: 'Female, 20s, British', description: 'Young woman on a city street whose rent payment failed. Emotional, relatable.', usedIn: ['PigeeBank 5', 'PigeeBank 9'], stills: pick('pigeebank_rent_street_reaction', ['Street · crying', 'Street · talking', 'Street · close-up']) },
  { id: 'anchor-male', name: 'Senior News Anchor', kind: 'Newsreader', voice: 'Male, 50s, British RP', description: 'Grey suit, red studio. Breaking-news bulletins.', usedIn: ['Pharmacore 8'], stills: pick('news_tonight_pharmacore_uk', ['Studio · wide', 'Studio · close']) },
  { id: 'anchor-female', name: 'Evening News Anchor', kind: 'Newsreader', voice: 'Female, 40s, British', description: 'Burgundy jacket, blue studio. Evening bulletins.', usedIn: ['TrustInsure 8'], stills: pick('news_tonight_trustinsure_uk', ['Studio · wide', 'Studio · close']) },
  { id: 'business-anchor', name: 'Business News Anchor', kind: 'Newsreader', voice: 'Female, 40s, British', description: 'Navy suit, business channel studio. Finance stories.', usedIn: ['PigeeBank 8'], stills: pick('cbbn_pigeebank_female_uk', ['Studio · to camera', 'Studio · close']) },
];

const references = import.meta.glob('@/assets/character-library/*.asset.json', { eager: true, import: 'default' }) as Record<string, { url: string }>;
const coreIds = ['truth-seeker', 'worried-mum', 'firefighter', 'young-renter'];
export const CAST: CastMember[] = [...profiles.map(profile => {
  const id = coreIds[profile.page - 1] ?? profile.code.toLowerCase();
  const existing = EXISTING_CAST.find(c => c.id === id);
  return {
    id, code: profile.code, name: profile.name, handle: profile.handle, group: profile.group,
    kind: (profile.page === 1 || (profile.page >= 5 && profile.page <= 20) ? 'Content creator' : 'Member of the public') as CastKind,
    voice: profile.fields['VOICE AND LOOK'], description: profile.fields['DEFAULT STANCE'], roles: profile.roles,
    positiveWhen: profile.fields['TURNS POSITIVE WHEN'], bestFit: profile.fields['BEST FIT'], typicalLines: profile.fields['TYPICAL LINES'],
    usedIn: existing?.usedIn ?? [],
    stills: [...profile.stills.map(s => ({ label: s.label, url: Object.entries(references).find(([key]) => key.endsWith(`/${s.asset}`))?.[1].url ?? '' })).filter(s => s.url), ...(existing?.stills ?? [])],
  };
}), ...EXISTING_CAST.filter(c => c.kind === 'Newsreader')];

export const RADIO_HOSTS: RadioHost[] = [
  { id: 'geoff', name: 'Geoff Pennington', show: 'The Midday Debate', voice: 'Male, British', usedIn: 'Pharmacore 7', callers: [
    { name: 'Sharon', location: 'Sheffield', stance: 'Angry parent, binned the medicine' }, { name: 'Barry', location: 'Doncaster', stance: 'Second-hand "insider" rumour' }, { name: 'Maureen', location: 'Leeds', stance: 'Demands someone goes to prison' } ] },
  { id: 'gemma', name: 'Gemma Hollis', show: 'Your Money, Your Say', voice: 'Female, British', usedIn: 'TrustInsure 7', callers: [
    { name: 'Gary', location: 'Bolton', stance: 'Loyal customer cancelling' }, { name: 'Asha', location: 'Croydon', stance: 'Real grievance, refused claim' }, { name: 'Pete', location: 'Cardiff', stance: 'Sceptic: "prove it\'s edited"' } ] },
  { id: 'rob', name: 'Rob Keane', show: 'Drive Time Phones', voice: 'Male, British', usedIn: 'PigeeBank 7', callers: [
    { name: 'Jade', location: 'Manchester', stance: 'Moved all her money out' }, { name: 'Simon', location: 'Reading', stance: 'Northern Rock comparison' }, { name: 'Mo', location: 'Glasgow', stance: 'Withdrawing at work right now' } ] },
];
