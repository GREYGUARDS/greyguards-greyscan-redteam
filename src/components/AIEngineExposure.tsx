import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, TrendingUp, TrendingDown, Minus, Loader2, RefreshCw, ExternalLink, ShieldAlert, ShieldCheck } from "lucide-react";
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

interface StoryRow {
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  angle?: string;
  mdmRisk?: number | null;
  mdmType?: "Misinformation" | "Disinformation" | "Malinformation" | "None";
  verifiable?: boolean;
  note?: string;
  assessed?: boolean;
}

const WINDOWS = [1, 6, 12, 24] as const;


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
  const [stories, setStories] = useState<StoryRow[]>([]);
  const [storySummary, setStorySummary] = useState<string>("");
  const [windowHours, setWindowHours] = useState<number>(6);
  const [loading, setLoading] = useState(false);
  const [storiesLoading, setStoriesLoading] = useState(false);
  const [checkedAt, setCheckedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runCheck = useCallback(async (hours: number, mode: "all" | "stories" = "all") => {
    if (!brandName) return;
    if (mode === "all") setLoading(true);
    setStoriesLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("check-ai-engines", {
        body: { brand: brandName, windowHours: hours, mode },
      });
      if (fnError) throw fnError;
      if (mode === "all") {
        setEngines(data?.engines || []);
        if (!(data?.engines || []).some((e: EngineRow) => !e.unavailable)) {
          setError("No AI engine responded — try again shortly.");
        }
      }
      setStories(data?.stories || []);
      setStorySummary(data?.storySummary || "");
      setCheckedAt(data?.checkedAt || new Date().toISOString());
    } catch (err) {
      console.warn("AI engine check failed:", err);
      setError("AI engine check unavailable right now.");
    } finally {
      setLoading(false);
      setStoriesLoading(false);
    }
  }, [brandName]);

  useEffect(() => {
    setEngines([]);
    setStories([]);
    setStorySummary("");
    setCheckedAt(null);
    runCheck(windowHours, "all");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandName]);

  const selectWindow = (hours: number) => {
    setWindowHours(hours);
    runCheck(hours, "stories");
  };

  const flagged = stories.filter((s) => (s.mdmRisk ?? 0) >= 40);

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
          <Button size="sm" variant="outline" onClick={() => runCheck(windowHours, "all")} disabled={loading} className="h-7 px-2 text-xs">
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
                          <div className="relative max-h-[4.5rem] overflow-y-auto pr-1 rounded border border-border/40 bg-secondary/20 p-2">
                            <span className="text-xs text-muted-foreground italic leading-relaxed block">"{row.narrative}"</span>
                          </div>
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

        {/* Verifiable, linkable stories behind the AI narratives */}
        <div className="border-t border-border">
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-6 py-3 bg-secondary/30">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Verifiable Stories &amp; Emerging MDM
            </span>
            <div className="flex items-center gap-1">
              {WINDOWS.map((h) => (
                <Button
                  key={h}
                  size="sm"
                  variant={windowHours === h ? "default" : "outline"}
                  onClick={() => selectWindow(h)}
                  disabled={storiesLoading}
                  className="h-7 px-2 text-[11px] font-mono"
                >
                  {h}h
                </Button>
              ))}
            </div>
          </div>

          {storySummary && (
            <p className="px-4 sm:px-6 py-3 text-xs text-muted-foreground border-b border-border/50">
              {storySummary}
            </p>
          )}

          {storiesLoading ? (
            <div className="p-6 text-xs text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Scraping and assessing stories from the last {windowHours}h…
            </div>
          ) : stories.length === 0 ? (
            <div className="p-6 text-xs text-muted-foreground">
              No published stories about {brandName || "this organisation"} in the last {windowHours}h. Try a wider window.
            </div>
          ) : (
            <>
              <div className="px-4 sm:px-6 py-2 flex flex-wrap gap-3 text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border/50">
                <span>{stories.length} stories</span>
                <span>{stories.filter((s) => s.verifiable).length} verifiable</span>
                <span className={flagged.length > 0 ? "text-destructive" : undefined}>{flagged.length} MDM-flagged</span>
              </div>
              <ul className="divide-y divide-border/50">
                {stories.map((s) => {
                  const risk = s.mdmRisk ?? 0;
                  return (
                    <li key={s.url} className="p-4 sm:px-6 hover:bg-secondary/20 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <a
                            href={s.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-foreground hover:text-primary inline-flex items-start gap-1"
                          >
                            <span>{s.title}</span>
                            <ExternalLink className="h-3 w-3 mt-1 flex-shrink-0 opacity-60" />
                          </a>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-wider">
                            <span>{s.source}</span>
                            <span>{new Date(s.publishedAt).toLocaleString("en-GB")}</span>
                            {s.verifiable ? (
                              <span className="inline-flex items-center gap-1 text-success">
                                <ShieldCheck className="h-3 w-3" /> Verifiable
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-warning">
                                <ShieldAlert className="h-3 w-3" /> Needs verification
                              </span>
                            )}
                          </div>
                          {s.angle && <p className="mt-2 text-xs text-muted-foreground italic">{s.angle}</p>}
                          {s.note && <p className="mt-1 text-xs text-muted-foreground">{s.note}</p>}
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <span className={`font-mono font-bold text-sm ${getRiskColor(risk)}`}>
                            {s.mdmRisk === null || s.mdmRisk === undefined ? "—" : `${risk}%`}
                          </span>
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">MDM risk</span>
                          {s.mdmType && s.mdmType !== "None" && (
                            <Badge variant="outline" className="text-[10px] font-normal border-destructive/30 text-destructive">
                              {s.mdmType}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
