import { CheckCircle2, XCircle, Loader2, Radar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { APIStatus } from "@/components/APIStatusPanel";

export type ScanPhase = "sources" | "aggregating" | "sentiment" | "narratives";

const PHASE_LABELS: Record<ScanPhase, string> = {
  sources: "Querying open-source intelligence feeds",
  aggregating: "Aggregating & de-duplicating mentions",
  sentiment: "Running sentiment & keyword analysis",
  narratives: "Modelling narrative threats",
};

const PHASE_ORDER: ScanPhase[] = ["sources", "aggregating", "sentiment", "narratives"];

interface ScanProgressProps {
  brandName: string;
  apiStatuses: APIStatus[];
  phase: ScanPhase;
}

export function ScanProgress({ brandName, apiStatuses, phase }: ScanProgressProps) {
  const total = apiStatuses.length || 1;
  const settled = apiStatuses.filter((a) => a.status === "success" || a.status === "failed").length;
  const succeeded = apiStatuses.filter((a) => a.status === "success").length;
  const mentions = apiStatuses.reduce((sum, a) => sum + (a.count || 0), 0);

  const phaseIndex = PHASE_ORDER.indexOf(phase);
  // Source fetching accounts for 70% of the bar, remaining phases share the rest
  const sourcePct = (settled / total) * 70;
  const phasePct = phaseIndex > 0 ? 70 + phaseIndex * 10 : sourcePct;
  const pct = Math.min(99, Math.round(Math.max(sourcePct, phasePct)));

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-success/5 pointer-events-none" />
      <div className="absolute top-10 left-10 w-40 h-40 bg-primary/10 blur-3xl animate-pulse-glow pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-48 h-48 bg-destructive/10 blur-3xl animate-pulse-glow pointer-events-none" style={{ animationDelay: "1s" }} />

      <Card className="w-full max-w-2xl border-4 border-border bg-card relative z-10 animate-scale-in">
        <CardHeader className="border-b-4 border-border bg-secondary space-y-1">
          <CardTitle className="flex items-center gap-2 uppercase tracking-wider text-base">
            <Radar className="h-5 w-5 animate-pulse text-primary" />
            Scanning {brandName || "target"}
          </CardTitle>
          <p className="text-[11px] text-muted-foreground uppercase tracking-widest">
            {PHASE_LABELS[phase]}
          </p>
        </CardHeader>
        <CardContent className="p-5 space-y-5">
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] uppercase tracking-widest text-muted-foreground">
              <span>
                {settled}/{total} sources
              </span>
              <span className="text-foreground font-medium">{pct}%</span>
            </div>
            <div className="h-2 w-full bg-secondary border border-border overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500 ease-out"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
              <span>{succeeded} responding</span>
              <span>{mentions} mentions collected</span>
            </div>
          </div>

          {/* Phase checklist */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {PHASE_ORDER.map((p, i) => {
              const done = i < phaseIndex;
              const active = i === phaseIndex;
              return (
                <div
                  key={p}
                  className={`border p-2 text-[10px] uppercase tracking-wider flex items-center gap-1.5 ${
                    active
                      ? "border-primary/60 bg-primary/10 text-foreground"
                      : done
                        ? "border-success/40 text-success"
                        : "border-border text-muted-foreground opacity-60"
                  }`}
                >
                  {done ? (
                    <CheckCircle2 className="h-3 w-3 shrink-0" />
                  ) : active ? (
                    <Loader2 className="h-3 w-3 shrink-0 animate-spin" />
                  ) : (
                    <span className="h-3 w-3 shrink-0 border border-current" />
                  )}
                  <span className="truncate">{p}</span>
                </div>
              );
            })}
          </div>

          {/* Live source list */}
          <div className="max-h-64 overflow-y-auto border border-border divide-y divide-border">
            {apiStatuses.map((api) => (
              <div key={api.name} className="flex items-center justify-between px-3 py-2 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  {api.status === "loading" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />
                  ) : api.status === "success" ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                  ) : api.status === "failed" ? (
                    <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
                  ) : (
                    <span className="h-3.5 w-3.5 border border-border shrink-0" />
                  )}
                  <span className={`truncate ${api.status === "loading" ? "text-muted-foreground" : ""}`}>
                    {api.name}
                  </span>
                </div>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground shrink-0">
                  {api.status === "loading"
                    ? "Querying"
                    : api.status === "success"
                      ? `${api.count} hits`
                      : api.status === "failed"
                        ? "No data"
                        : "Queued"}
                </span>
              </div>
            ))}
          </div>

          <p className="text-[10px] text-muted-foreground text-center uppercase tracking-widest">
            Slow sources time out automatically — results build as feeds respond
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
