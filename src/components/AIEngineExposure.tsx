import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, TrendingUp, TrendingDown, Minus, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface EngineRow {
  engine: string;
  narrative?: string;
  riskScore?: number;
  trend?: "Stable" | "Escalating" | "De-escalating";
  sourcesKnown?: string[];
  unavailable?: boolean;
}

const getTrendIcon = (trend: string) => {
  switch (trend) {
    case "Escalating": return <TrendingUp className="h-4 w-4 text-destructive" />;
    case "De-escalating": return <TrendingDown className="h-4 w-4 text-success" />;
    default: return <Minus className="h-4 w-4 text-muted-foreground" />;
  }
};

const getTrendColor = (trend: string) => {
  switch (trend) {
    case "Escalating": return "bg-destructive/10 text-destructive border-destructive/20";
    case "De-escalating": return "bg-success/10 text-success border-success/20";
    default: return "bg-muted text-muted-foreground border-border";
  }
};

// Model risk is returned 0-10; expose it as a percentage so the scale is self-explanatory
const toPercent = (score: number) => Math.max(0, Math.min(100, Math.round(score * 10)));

const getRiskColor = (pct: number) => {
  if (pct >= 80) return "text-destructive";
  if (pct >= 50) return "text-warning";
  return "text-success";
};

const getRiskBar = (pct: number) => {
  if (pct >= 80) return "bg-destructive";
  if (pct >= 50) return "bg-warning";
  return "bg-success";
};

const getRiskLabel = (pct: number) => {
  if (pct >= 80) return "High exposure";
  if (pct >= 50) return "Moderate";
  return "Low";
};


interface AIEngineExposureProps {
  brandName: string;
}

export function AIEngineExposure({ brandName }: AIEngineExposureProps) {
  const [engines, setEngines] = useState<EngineRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [checkedAt, setCheckedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runCheck = async () => {
    if (!brandName) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("check-ai-engines", {
        body: { brand: brandName },
      });
      if (fnError) throw fnError;
      setEngines(data?.engines || []);
      setCheckedAt(data?.checkedAt || new Date().toISOString());
      if (!(data?.engines || []).some((e: EngineRow) => !e.unavailable)) {
        setError("No AI engine responded — try again shortly.");
      }
    } catch (err) {
      console.warn("AI engine check failed:", err);
      setError("AI engine check unavailable right now.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setEngines([]);
    setCheckedAt(null);
    runCheck();
  }, [brandName]);

  return (
    <Card className="border border-border bg-card">
      <CardHeader className="border-b border-border bg-secondary/50 py-3 px-4 sm:px-6 flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-sm font-medium tracking-wide flex items-center gap-2 uppercase">
          <Bot className="h-4 w-4 flex-shrink-0" />
          AI Engine Exposure
        </CardTitle>
        <div className="flex items-center gap-2">
          {checkedAt && (
            <span className="text-[10px] text-muted-foreground hidden sm:inline">
              Live check {new Date(checkedAt).toLocaleTimeString("en-GB")}
            </span>
          )}
          <Button size="sm" variant="outline" onClick={runCheck} disabled={loading} className="h-7 px-2 text-xs">
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading && engines.length === 0 ? (
          <div className="p-6 text-xs text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Querying live AI models about {brandName || "this organisation"}…
          </div>
        ) : engines.length === 0 ? (
          <div className="p-6 text-xs text-muted-foreground">{error || "No AI engine data yet."}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider w-32">Engine</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Narrative Excerpt</th>
                  <th className="text-center p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider w-32">Narrative Risk</th>
                  <th className="text-center p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider w-32">Trend</th>
                </tr>
              </thead>
              <tbody>
                {engines.map((row) => (
                  <tr key={row.engine} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                    <td className="p-3 align-top">
                      <span className="font-semibold text-foreground">{row.engine}</span>
                    </td>
                    {row.unavailable ? (
                      <td className="p-3 text-xs text-muted-foreground" colSpan={3}>
                        No response from this model on the last check.
                      </td>
                    ) : (
                      <>
                        <td className="p-3 max-w-lg align-top">
                          <span className="text-xs text-muted-foreground italic">"{row.narrative}"</span>
                          {row.sourcesKnown && row.sourcesKnown.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {row.sourcesKnown.map((s) => (
                                <Badge key={s} variant="outline" className="text-[10px] font-normal">
                                  {s}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-center align-top">
                          {(() => {
                            const pct = toPercent(row.riskScore ?? 0);
                            return (
                              <div className="flex flex-col items-center gap-1">
                                <span className={`font-mono font-bold text-lg ${getRiskColor(pct)}`}>{pct}%</span>
                                <div className="w-20 h-1.5 bg-muted rounded-sm overflow-hidden">
                                  <div className={`h-full ${getRiskBar(pct)}`} style={{ width: `${pct}%` }} />
                                </div>
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{getRiskLabel(pct)}</span>
                              </div>
                            );
                          })()}
                        </td>

                        <td className="p-3 text-center align-top">
                          <Badge variant="outline" className={`text-xs gap-1 ${getTrendColor(row.trend || "Stable")}`}>
                            {getTrendIcon(row.trend || "Stable")}
                            {row.trend || "Stable"}
                          </Badge>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
