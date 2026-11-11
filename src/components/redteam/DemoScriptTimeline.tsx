import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Send } from "lucide-react";
import type { Inject } from "@/pages/RedTeam";

interface DemoScriptTimelineProps {
  title: string;
  injects: Inject[];
  durationMinutes: number;
  isActive: boolean;
  onSendInject: (inject: Inject) => void;
}

/** Host view of the exact public-demo script, with no generated alternatives. */
export default function DemoScriptTimeline({ title, injects, durationMinutes, isActive, onSendInject }: DemoScriptTimelineProps) {
  const scale = durationMinutes / 10;
  return <div className="space-y-4">
    <div className="space-y-1">
      <div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-semibold uppercase tracking-wider">{title}</h3><Badge variant="outline">Canonical demo script</Badge></div>
      <p className="text-xs text-muted-foreground">The same nine scripted injects used in the public demo. No AI-generated alternatives.</p>
    </div>
    <ScrollArea className="w-full whitespace-nowrap">
      <div className="flex gap-4 pb-4">
        {injects.map((inject, index) => {
          const atSeconds = Math.round(inject.timestamp * scale);
          return <article key={inject.id} className="w-80 shrink-0 whitespace-normal border-2 border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs text-muted-foreground">{Math.floor(atSeconds / 60)}:{String(atSeconds % 60).padStart(2, "0")}</span>
              <Badge variant="outline" className="text-[10px] uppercase">Inject {index + 1} of {injects.length}</Badge>
            </div>
            <div><p className="text-xs font-medium break-words">{inject.source}</p><p className="mt-2 text-xs text-muted-foreground line-clamp-4">{inject.content}</p></div>
            <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
              <span className="text-[10px] uppercase text-muted-foreground">{inject.demoVideo ? "Video" : inject.visual ? "Graphic" : inject.type.replace(/_/g, " ")}</span>
              <Button size="sm" variant="outline" disabled={!isActive} onClick={() => onSendInject(inject)}><Send className="mr-1 h-3 w-3" />Send</Button>
            </div>
          </article>;
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  </div>;
}
