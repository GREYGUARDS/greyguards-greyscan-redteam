import { Heart, MessageCircle, Share2, Repeat2, Bookmark, Eye, ThumbsUp, Music2 } from 'lucide-react';
import type { ReactNode } from 'react';

export type OverlayPlatform = 'tiktok' | 'instagram' | 'youtube' | 'x' | 'facebook' | 'news';
export interface VideoOverlay {
  platform: OverlayPlatform;
  handle: string; caption: string;
  likes: string; comments: string; shares: string; views: string;
  channel: string; headline: string; ticker: string;
}
export interface EngagementStats { likes: string; comments: string; shares: string; views: string }

export const PLATFORM_LABELS: Record<OverlayPlatform, string> = { tiktok: 'TikTok', instagram: 'Instagram Reels', youtube: 'YouTube Shorts', x: 'X video', facebook: 'Facebook video', news: 'News broadcast' };

/** Random-but-plausible engagement for a given reach level. */
export function suggestStats(level: 'low' | 'medium' | 'viral'): EngagementStats {
  const base = level === 'viral' ? 400000 : level === 'medium' ? 40000 : 3000;
  const n = (f: number) => compact(Math.round(base * f * (0.7 + Math.random() * 0.6)));
  return { views: n(12), likes: n(1), comments: n(0.06), shares: n(0.15) };
}
export function compact(value: number) {
  if (value >= 1e6) return `${(value / 1e6).toFixed(value >= 1e7 ? 0 : 1)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(value >= 1e4 ? 0 : 1)}K`;
  return String(value);
}

const Stat = ({ icon, value }: { icon: ReactNode; value: string }) => value ? <div className="flex flex-col items-center gap-0.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">{icon}<span className="text-[11px] font-semibold">{value}</span></div> : null;

/** Graphics drawn over generated footage: social engagement rail or news lower-third and ticker. */
export function VideoOverlayLayer({ overlay }: { overlay: VideoOverlay }) {
  if (overlay.platform === 'news') {
    return <div className="pointer-events-none absolute inset-0 text-foreground">
      <div className="absolute left-3 top-3 flex items-center gap-2">
        <span className="bg-crimson px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-primary-foreground">{overlay.channel || 'NEWS 24'}</span>
        <span className="flex items-center gap-1 bg-background/80 px-2 py-0.5 text-[10px] font-bold uppercase"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-crimson" />Live</span>
      </div>
      <div className="absolute inset-x-0 bottom-0">
        {overlay.headline && <div className="mx-3 mb-1 flex"><span className="bg-crimson px-2 py-1 text-[10px] font-bold uppercase text-primary-foreground">Breaking</span><span className="flex-1 bg-background/90 px-2 py-1 text-xs font-semibold uppercase leading-tight sm:text-sm">{overlay.headline}</span></div>}
        <div className="flex overflow-hidden bg-foreground text-background">
          <span className="shrink-0 bg-crimson px-2 py-1 text-[10px] font-bold uppercase text-primary-foreground">{overlay.channel || 'NEWS 24'}</span>
          <div className="relative flex-1 overflow-hidden whitespace-nowrap py-1 text-[11px] font-medium"><span className="inline-block animate-[ticker_22s_linear_infinite] pl-[100%]">{overlay.ticker || overlay.headline}</span></div>
        </div>
      </div>
    </div>;
  }
  const likeIcon = overlay.platform === 'facebook' || overlay.platform === 'youtube' ? <ThumbsUp className="h-6 w-6" /> : <Heart className="h-6 w-6 fill-crimson text-crimson" />;
  const shareIcon = overlay.platform === 'x' ? <Repeat2 className="h-6 w-6" /> : <Share2 className="h-6 w-6" />;
  return <div className="pointer-events-none absolute inset-0 text-foreground">
    <span className="absolute left-3 top-3 bg-background/60 px-2 py-0.5 text-[10px] font-bold uppercase">{PLATFORM_LABELS[overlay.platform]}</span>
    {overlay.views && <span className="absolute right-3 top-3 flex items-center gap-1 bg-background/60 px-2 py-0.5 text-[10px] font-semibold"><Eye className="h-3 w-3" />{overlay.views}</span>}
    <div className="absolute bottom-16 right-3 flex flex-col items-center gap-4">
      <Stat icon={likeIcon} value={overlay.likes} />
      <Stat icon={<MessageCircle className="h-6 w-6" />} value={overlay.comments} />
      <Stat icon={shareIcon} value={overlay.shares} />
      {(overlay.platform === 'tiktok' || overlay.platform === 'instagram') && <Bookmark className="h-6 w-6 drop-shadow" />}
    </div>
    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/90 to-transparent p-3 pr-16">
      <p className="text-sm font-bold drop-shadow">{overlay.handle || '@fictional_creator'}</p>
      {overlay.caption && <p className="line-clamp-2 text-xs drop-shadow">{overlay.caption}</p>}
      {overlay.platform === 'tiktok' && <p className="mt-1 flex items-center gap-1 text-[10px] opacity-80"><Music2 className="h-3 w-3" />original sound · {overlay.handle || 'creator'}</p>}
    </div>
  </div>;
}

export function StatsBar({ stats, platform }: { stats: EngagementStats; platform: string }) {
  const share = platform === 'x' ? <Repeat2 className="h-4 w-4" /> : <Share2 className="h-4 w-4" />;
  return <div className="mt-4 flex flex-wrap items-center gap-5 border-t border-border pt-3 text-xs text-muted-foreground">
    <span className="flex items-center gap-1"><MessageCircle className="h-4 w-4" />{stats.comments}</span>
    <span className="flex items-center gap-1">{share}{stats.shares}</span>
    <span className="flex items-center gap-1"><Heart className="h-4 w-4 fill-crimson text-crimson" />{stats.likes}</span>
    {stats.views && <span className="flex items-center gap-1"><Eye className="h-4 w-4" />{stats.views}</span>}
  </div>;
}
