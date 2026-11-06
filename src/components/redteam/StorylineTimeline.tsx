import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { GitBranch, Send } from "lucide-react";
import {
  INJECT_CATEGORY_LABELS,
  type HostedScenarioPack,
  type InjectCategory,
  type StorylineInjectOption,
} from "@/lib/hostedScenarios";

const CATEGORY_STYLES: Record<InjectCategory, string> = {
  public_reaction: "border-primary text-primary",
  press: "border-muted-foreground text-muted-foreground",
  misinformation: "border-warning text-warning",
  disinformation: "border-destructive text-destructive",
  malinformation: "border-crimson text-crimson",
};

interface StorylineTimelineProps {
  pack: HostedScenarioPack;
  /** Session length in minutes — beat offsets are scaled from the 60-minute baseline. */
  durationMinutes: number;
  /** Seconds elapsed since the exercise started (0 before start). */
  elapsedSeconds: number;
  isActive: boolean;
  onSendInject: (inject: StorylineInjectOption) => void;
}

const StorylineTimeline = ({ pack, durationMinutes, elapsedSeconds, isActive, onSendInject }: StorylineTimelineProps) => {
  const scale = durationMinutes / 60;
  const elapsedMinutes = elapsedSeconds / 60;

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold uppercase tracking-wider">{pack.title}</h3>
        <p className="text-xs text-muted-foreground">{pack.narrative}</p>
      </div>

      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-4 pb-4">
          {pack.beats.map((beat, index) => {
            const atMinute = Math.round(beat.offsetMinutes * scale);
            const reached = isActive && elapsedMinutes >= atMinute;
            const isCurrent =
              reached &&
              (index === pack.beats.length - 1 ||
                elapsedMinutes < Math.round(pack.beats[index + 1].offsetMinutes * scale));

            return (
              <div
                key={beat.id}
                className={`w-80 shrink-0 whitespace-normal border-2 bg-card p-4 space-y-3 ${
                  isCurrent ? "border-warning" : reached ? "border-primary/50" : "border-border"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-muted-foreground">
                    {Math.floor(atMinute / 60) > 0 ? `${Math.floor(atMinute / 60)}h ` : ""}
                    {atMinute % 60}m
                  </span>
                  {isCurrent && (
                    <Badge variant="outline" className="border-warning text-warning text-[10px] uppercase">
                      Current beat
                    </Badge>
                  )}
                  {!reached && index > 0 && (
                    <Badge variant="outline" className="text-[10px] uppercase text-muted-foreground">
                      Upcoming
                    </Badge>
                  )}
                </div>

                <div>
                  <p className="font-bold uppercase tracking-wider text-sm">
                    {index + 1}. {beat.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{beat.narrative}</p>
                </div>

                <p className="text-xs border-l-2 border-warning pl-2 text-muted-foreground">
                  <span className="uppercase tracking-wider text-foreground">Host: </span>
                  {beat.instruction}
                </p>

                <div className="space-y-2">
                  {beat.injects.map((inject) => (
                    <div key={inject.label} className="border border-border p-2 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium">{inject.label}</span>
                        <Badge variant="outline" className={`text-[9px] uppercase ${CATEGORY_STYLES[inject.category]}`}>
                          {INJECT_CATEGORY_LABELS[inject.category]}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-2">{inject.content}</p>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] text-muted-foreground">
                          {inject.source} · {inject.channel}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-[10px] uppercase tracking-wider"
                          disabled={!isActive}
                          onClick={() => onSendInject(inject)}
                        >
                          <Send className="h-3 w-3 mr-1" />
                          Send
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {beat.branches.length > 0 && (
                  <div className="space-y-1 border-t border-border pt-2">
                    {beat.branches.map((branch) => (
                      <p key={branch.condition} className="text-[11px] text-muted-foreground flex gap-1.5">
                        <GitBranch className="h-3 w-3 mt-0.5 shrink-0 text-primary" />
                        <span>
                          <span className="text-foreground">If {branch.condition}:</span> {branch.route}
                        </span>
                      </p>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};

export default StorylineTimeline;
