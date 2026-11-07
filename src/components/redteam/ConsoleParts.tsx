import { Play, FileText, MessageCircle, Image as ImageIcon } from "lucide-react";

/** Shared building blocks for the Red and Blue team consoles. */

export interface ConsoleInject {
  id: string;
  inject_type: string;
  content: string;
  source: string;
  reach: number;
  sentiment?: string;
  is_aggressive: boolean;
  is_sent: boolean;
  sent_at: string | null;
  created_at?: string;
  created_by?: string;
  video_storage_path?: string | null;
  artefact?: unknown;
  phase?: string | null;
  queue_position?: number | null;
}

export function timeAgo(iso: string | null | undefined, now = Date.now()) {
  if (!iso) return "";
  const s = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

export function clock(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}

export function reachLabel(reach: number) {
  if (reach >= 1_000_000) return `${(reach / 1_000_000).toFixed(1).replace(/\.0$/, "")}M reach`;
  if (reach >= 1000) return `${Math.round(reach / 1000)}K reach`;
  return `${reach} reach`;
}

export function formatLabel(i: Pick<ConsoleInject, "inject_type" | "video_storage_path" | "artefact">) {
  if (i.video_storage_path) return i.inject_type === "news_article" ? "News clip" : "Short video";
  const kind = artefactKind(i.artefact);
  if (kind === "whatsapp" || kind === "telegram") return "Group chat";
  if (kind === "website") return "Website";
  switch (i.inject_type) {
    case "news_article": return "News";
    case "influencer": return "Influencer";
    case "leak": return "Leaked doc";
    case "group_chat": return "Group chat";
    case "amplification": return "Bot network";
    default: return "Post";
  }
}

export function artefactKind(a: unknown): string | null {
  return a && typeof a === "object" && "kind" in a ? String((a as { kind: unknown }).kind) : null;
}

export function firstLine(text: string, max = 70) {
  const line = (text || "").split("\n")[0].trim();
  return line.length > max ? `${line.slice(0, max - 1)}…` : line;
}

export function Meter({ label, value, tone }: { label: string; value: number; tone: "defender" | "threat" }) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="w-24 sm:w-28">
      <div className="flex justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
        <span>{label}</span><span className="text-foreground">{v}%</span>
      </div>
      <div className="mt-1 h-1 bg-muted">
        <div className={`h-full transition-all ${tone === "defender" ? "bg-defender" : "bg-destructive"}`} style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}

export function InjectThumb({ inject, dim = false, className = "h-10 w-[62px]" }: { inject: ConsoleInject; dim?: boolean; className?: string }) {
  const kind = artefactKind(inject.artefact);
  const Icon = inject.video_storage_path ? Play : inject.inject_type === "leak" ? FileText : kind === "whatsapp" || kind === "telegram" || inject.inject_type === "group_chat" ? MessageCircle : kind ? ImageIcon : null;
  return (
    <div className={`${className} shrink-0 border border-border bg-secondary flex items-center justify-center overflow-hidden ${dim ? "opacity-40" : ""}`}>
      {Icon ? <Icon className="h-4 w-4 text-muted-foreground" /> : <span className="px-1 text-[8px] leading-tight text-muted-foreground line-clamp-3">{firstLine(inject.content, 40)}</span>}
    </div>
  );
}

export function PostCard({ source, content, label = "Post", large = false }: { source: string; content: string; label?: string; large?: boolean }) {
  return (
    <div className="border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border bg-secondary px-4 py-2 text-xs">
        <span className="uppercase tracking-wider">{label}</span>
        <span className="text-crimson">FICTIONAL EXERCISE</span>
      </div>
      <div className="p-5">
        <div className="mb-3 flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-secondary text-xs">{(source || "??").replace(/[^a-z0-9]/gi, "").slice(0, 2).toUpperCase()}</span>
          <span className="text-sm font-medium break-words">{source || "Anonymous Source"}</span>
        </div>
        <p className={`whitespace-pre-wrap break-words leading-relaxed ${large ? "text-lg sm:text-xl" : "text-sm"}`}>{content || "Your claim will appear here."}</p>
      </div>
    </div>
  );
}
