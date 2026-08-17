import { Inject } from "@/pages/RedTeam";
import {
  Heart,
  MessageCircle,
  Repeat2,
  BadgeCheck,
  ArrowBigUp,
  FileWarning,
  Radio,
  ImageOff,
  Bot,
} from "lucide-react";

interface InjectVisualProps {
  inject: Inject;
}

const initials = (source: string) =>
  source
    .replace(/^@/, "")
    .replace(/\(.*\)/, "")
    .trim()
    .split(/[\s_.-]+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "??";

const compact = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${Math.round(n / 1_000)}K` : String(n);

const hashtags = (content: string) => content.match(/#[\w]+/g)?.slice(0, 3) ?? [];

/**
 * Renders each inject as a platform-styled mock so participants "see"
 * the artefact rather than only reading a description.
 */
const InjectVisual = ({ inject }: InjectVisualProps) => {
  const reach = inject.reach ?? 0;
  const engagement = {
    likes: Math.max(3, Math.round(reach * 0.031)),
    reposts: Math.max(1, Math.round(reach * 0.017)),
    replies: Math.max(1, Math.round(reach * 0.008)),
  };

  if (inject.type === "news_article" || inject.type === "official_response") {
    return (
      <div className="border-2 border-border bg-background">
        <div className="flex items-center justify-between border-b-2 border-border px-4 py-2">
          <span className="text-xs font-semibold uppercase tracking-[0.2em]">{inject.source}</span>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {inject.type === "official_response" ? "Press release" : "Live report"}
          </span>
        </div>
        <div className="p-4">
          <div className="mb-3 flex h-24 items-center justify-center border border-dashed border-border bg-muted/40 text-muted-foreground">
            <ImageOff className="mr-2 h-4 w-4" />
            <span className="text-[10px] uppercase tracking-wider">Wire photo withheld</span>
          </div>
          <p className="text-base font-semibold leading-snug">{inject.content}</p>
          <div className="mt-3 flex items-center gap-3 text-[10px] uppercase tracking-wider text-muted-foreground">
            <span>Audience {compact(reach)}</span>
            <span>·</span>
            <span>Syndicated</span>
          </div>
        </div>
      </div>
    );
  }

  if (inject.type === "leak") {
    return (
      <div className="border-2 border-destructive/60 bg-background">
        <div className="flex items-center gap-2 border-b-2 border-destructive/60 bg-destructive/10 px-4 py-2">
          <FileWarning className="h-4 w-4 text-destructive" />
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-destructive">
            Purported document · {inject.source}
          </span>
        </div>
        <div className="space-y-2 p-4 font-mono text-xs">
          <div className="flex justify-between text-muted-foreground">
            <span>CONFIDENTIAL — INTERNAL</span>
            <span>PAGE 1 / 3</span>
          </div>
          <p className="leading-relaxed">{inject.content}</p>
          <div className="space-y-1 pt-2 opacity-40">
            <div className="h-2 w-full bg-muted" />
            <div className="h-2 w-11/12 bg-muted" />
            <div className="h-2 w-9/12 bg-muted" />
          </div>
          <div className="pt-2 text-[10px] uppercase tracking-wider text-destructive">
            Provenance unverified · metadata stripped
          </div>
        </div>
      </div>
    );
  }

  if (inject.type === "amplification") {
    return (
      <div className="border-2 border-warning/60 bg-background">
        <div className="flex items-center gap-2 border-b-2 border-warning/60 bg-warning/10 px-4 py-2">
          <Radio className="h-4 w-4 text-warning" />
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-warning">
            Amplification telemetry
          </span>
        </div>
        <div className="p-4">
          <p className="text-sm leading-relaxed">{inject.content}</p>
          <div className="mt-4 grid grid-cols-10 gap-1">
            {Array.from({ length: 40 }).map((_, i) => (
              <div
                key={i}
                className={`flex h-6 items-center justify-center border ${
                  i % 3 === 0 ? "border-destructive/70 bg-destructive/20" : "border-border bg-muted/40"
                }`}
              >
                <Bot className="h-3 w-3 text-muted-foreground" />
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-4 text-[10px] uppercase tracking-wider text-muted-foreground">
            <span>Nodes 40+</span>
            <span>Identical copy 68%</span>
            <span>Est. impressions {compact(reach)}</span>
          </div>
        </div>
      </div>
    );
  }

  if (inject.type === "influencer") {
    return (
      <div className="border-2 border-border bg-background p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/20 text-sm font-semibold">
            {initials(inject.source)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1 text-sm font-semibold">
              <span className="truncate">{inject.source}</span>
              <BadgeCheck className="h-4 w-4 shrink-0 text-primary" />
            </div>
            <p className="mt-2 text-sm leading-relaxed">{inject.content}</p>
            <div className="mt-3 flex h-20 items-center justify-center border border-dashed border-border bg-muted/40">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Attached video · {compact(reach)} views
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default: social post mock
  const tags = hashtags(inject.content);
  const isReddit = /^r\//i.test(inject.source) || /reddit/i.test(inject.source);

  return (
    <div className="border-2 border-border bg-background p-4">
      {isReddit ? (
        <div className="flex gap-3">
          <div className="flex w-10 shrink-0 flex-col items-center text-muted-foreground">
            <ArrowBigUp className="h-5 w-5 text-destructive" />
            <span className="text-xs font-semibold">{compact(engagement.likes)}</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {inject.source}
            </div>
            <p className="mt-1 text-sm font-semibold leading-snug">{inject.content}</p>
            <div className="mt-3 flex items-center gap-4 text-[10px] uppercase tracking-wider text-muted-foreground">
              <span className="flex items-center gap-1">
                <MessageCircle className="h-3 w-3" /> {compact(engagement.replies)} comments
              </span>
              <span>Trending in community</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
            {initials(inject.source)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-semibold">{inject.source}</span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">now</span>
            </div>
            <p className="mt-2 text-sm leading-relaxed">{inject.content}</p>
            {tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {tags.map((t) => (
                  <span key={t} className="text-xs text-primary">
                    {t}
                  </span>
                ))}
              </div>
            )}
            <div className="mt-3 flex items-center gap-5 text-[10px] uppercase tracking-wider text-muted-foreground">
              <span className="flex items-center gap-1">
                <MessageCircle className="h-3 w-3" /> {compact(engagement.replies)}
              </span>
              <span className="flex items-center gap-1">
                <Repeat2 className="h-3 w-3" /> {compact(engagement.reposts)}
              </span>
              <span className="flex items-center gap-1">
                <Heart className="h-3 w-3" /> {compact(engagement.likes)}
              </span>
              <span>{compact(reach)} views</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InjectVisual;
