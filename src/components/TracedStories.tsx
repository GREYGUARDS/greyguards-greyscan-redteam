import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link2, ExternalLink } from "lucide-react";

interface Mention { text?: string; source?: string; date?: Date | string; url?: string; author?: string }

/** Every story listed links to its original publisher so each claim can be checked at source. */
export function TracedStories({ mentions, windowLabel }: { mentions: Mention[]; windowLabel: string }) {
  const seen = new Set<string>();
  const traced = mentions
    .filter((m) => typeof m.url === "string" && /^https?:\/\//.test(m.url) && !seen.has(m.url) && seen.add(m.url))
    .sort((a, b) => new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime())
    .slice(0, 25);
  const untraced = mentions.length - mentions.filter((m) => m.url).length;

  return (
    <Card className="border border-border bg-card">
      <CardHeader className="border-b border-border">
        <CardTitle className="flex items-center gap-2 uppercase tracking-wider">
          <Link2 className="h-5 w-5" /> Traced Stories
        </CardTitle>
        <p className="text-xs text-muted-foreground normal-case">
          Real items collected in the {windowLabel}, newest first, each linked to its original source. GreyScan reports what was
          published; open the link to verify before quoting.{untraced > 0 ? ` ${untraced} further items had no link and are counted but not listed.` : ""}
        </p>
      </CardHeader>
      <CardContent className="pt-4">
        {traced.length === 0 ? (
          <p className="text-sm text-muted-foreground">No linked stories were found in this window. Try a longer window or widen the search.</p>
        ) : (
          <ol className="space-y-3">
            {traced.map((m) => (
              <li key={m.url} className="border-b border-border pb-3 last:border-0">
                <a href={m.url} target="_blank" rel="noopener noreferrer" className="text-sm text-foreground hover:underline inline-flex gap-1">
                  {(m.text || "Untitled").slice(0, 180)} <ExternalLink className="h-3 w-3 mt-1 shrink-0" />
                </a>
                <div className="text-xs text-muted-foreground mt-1">
                  {m.source}{m.author ? ` · ${m.author}` : ""} · {m.date ? new Date(m.date).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : "date unknown"}
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
