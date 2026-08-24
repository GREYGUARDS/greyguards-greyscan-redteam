import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAccessProfile } from "@/hooks/useAccessProfile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Radar, ExternalLink, Loader2, Search, TrendingUp, History, Globe } from "lucide-react";

interface ProspectSource {
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  channel?: string;
}

interface EvolutionStage {
  horizon: string;
  likelihood: "low" | "medium" | "high";
  development: string;
}

interface Prospect {
  organisation: string;
  entityType?: string;
  sector: string;
  region?: string;
  threatType: string;
  severity: number;
  summary: string;
  approachAngle: string;
  wideSignals?: string[];
  precedent?: string;
  evolution?: EvolutionStage[];
  sources: ProspectSource[];
}

const WINDOWS = [
  { hours: 6, label: "6h" },
  { hours: 12, label: "12h" },
  { hours: 24, label: "24h" },
  { hours: 48, label: "48h" },
  { hours: 72, label: "72h" },
  { hours: 168, label: "7 days" },
];

const REGIONS = [
  { key: "uk", label: "UK & Ireland" },
  { key: "europe", label: "Europe" },
  { key: "middle_east", label: "Middle East" },
  { key: "north_america", label: "North America" },
];

const SCOPES = [
  { key: "brands", label: "Brands & companies" },
  { key: "institutions", label: "Institutions" },
  { key: "governments", label: "Governments & agencies" },
  { key: "international", label: "International bodies (ICRC, UN, NATO)" },
];

const PATTERNS = [
  { key: "disinformation", label: "Disinformation campaigns" },
  { key: "deepfake", label: "Deepfake & synthetic media" },
  { key: "boycott", label: "Coordinated boycott / pile-on" },
  { key: "fraud", label: "Impersonation & scams" },
];

function severityTone(severity: number) {
  if (severity >= 70) return "text-destructive border-destructive/40 bg-destructive/10";
  if (severity >= 40) return "text-primary border-primary/40 bg-primary/10";
  return "text-muted-foreground border-border bg-muted/30";
}

function likelihoodTone(likelihood: string) {
  if (likelihood === "high") return "text-destructive";
  if (likelihood === "medium") return "text-primary";
  return "text-muted-foreground";
}

// Provenance tags — make the sourced vs AI-inferred distinction unmissable
function VerifiedTag({ label = "Verified" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-wider font-medium text-emerald-500/90 border border-emerald-500/30 bg-emerald-500/10 rounded px-1.5 py-0.5">
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
      {label}
    </span>
  );
}

function AssessedTag({ label = "Assessed" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-wider font-medium text-amber-500/90 border border-amber-500/30 bg-amber-500/10 rounded px-1.5 py-0.5">
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
      {label}
    </span>
  );
}

export default function ProspectRadar() {
  const access = useAccessProfile();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [windowHours, setWindowHours] = useState(24);
  const [selected, setSelected] = useState<string[]>(PATTERNS.map((p) => p.key));
  const [regions, setRegions] = useState<string[]>(["uk"]);
  const [scopes, setScopes] = useState<string[]>(SCOPES.map((s) => s.key));
  const [scanning, setScanning] = useState(false);
  const [prospects, setProspects] = useState<Prospect[] | null>(null);
  const [sweepSummary, setSweepSummary] = useState("");
  const [meta, setMeta] = useState<{
    articleCount: number;
    sweptAt: string;
    channelCounts?: { press: number; global: number; social: number };
  } | null>(null);
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    if (access.loading) return;
    if (!access.isAdmin) navigate("/", { replace: true });
  }, [access.loading, access.isAdmin, navigate]);

  const toggle = (
    key: string,
    list: string[],
    setList: (v: string[]) => void,
  ) => setList(list.includes(key) ? list.filter((k) => k !== key) : [...list, key]);

  const runSweep = async () => {
    if (selected.length === 0) {
      toast({ title: "Select at least one threat pattern", variant: "destructive" });
      return;
    }
    if (regions.length === 0) {
      toast({ title: "Select at least one region", variant: "destructive" });
      return;
    }
    if (scopes.length === 0) {
      toast({ title: "Select at least one entity type", variant: "destructive" });
      return;
    }
    setScanning(true);
    const { data, error } = await supabase.functions.invoke("prospect-radar-sweep", {
      body: { windowHours, patterns: selected, regions, scopes },
    });
    setScanning(false);
    if (error) {
      toast({ title: "Sweep failed", description: error.message, variant: "destructive" });
      return;
    }
    setProspects((data?.prospects || []) as Prospect[]);
    setSweepSummary(data?.sweepSummary || "");
    setMeta({
      articleCount: data?.articleCount || 0,
      sweptAt: data?.sweptAt || new Date().toISOString(),
      channelCounts: data?.channelCounts,
    });
    setDismissed([]);
  };

  if (access.loading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground text-sm uppercase tracking-wider">Loading…</div>;
  }

  const visible = (prospects || []).filter((p) => !dismissed.includes(p.organisation));

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="mb-2">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <h1 className="text-2xl md:text-3xl font-semibold uppercase tracking-wider flex items-center gap-2">
            <Radar className="h-6 w-6 text-primary" /> Prospect Radar
          </h1>
          <p className="text-sm text-muted-foreground">
            Private sweep — press, global media and social signals across your chosen regions, assessed for emerging narrative
            threats against brands, institutions, governments and international bodies. Runs only when you scan.
          </p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Sweep configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Time window</p>
              <div className="flex flex-wrap gap-2">
                {WINDOWS.map((w) => (
                  <Button
                    key={w.hours}
                    size="sm"
                    variant={windowHours === w.hours ? "default" : "outline"}
                    onClick={() => setWindowHours(w.hours)}
                  >
                    {w.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Regions</p>
              <div className="flex flex-wrap gap-2">
                {REGIONS.map((r) => (
                  <Button
                    key={r.key}
                    size="sm"
                    variant={regions.includes(r.key) ? "default" : "outline"}
                    onClick={() => toggle(r.key, regions, setRegions)}
                  >
                    {r.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Entity types</p>
              <div className="flex flex-wrap gap-2">
                {SCOPES.map((s) => (
                  <Button
                    key={s.key}
                    size="sm"
                    variant={scopes.includes(s.key) ? "default" : "outline"}
                    onClick={() => toggle(s.key, scopes, setScopes)}
                  >
                    {s.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Threat patterns</p>
              <div className="flex flex-wrap gap-2">
                {PATTERNS.map((p) => (
                  <Button
                    key={p.key}
                    size="sm"
                    variant={selected.includes(p.key) ? "default" : "outline"}
                    onClick={() => toggle(p.key, selected, setSelected)}
                  >
                    {p.label}
                  </Button>
                ))}
              </div>
            </div>

            <Button onClick={runSweep} disabled={scanning} className="w-full">
              {scanning ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sweeping press, global media & social…</>
              ) : (
                <><Search className="h-4 w-4 mr-2" /> Run sweep</>
              )}
            </Button>
            {scanning && (
              <p className="text-xs text-muted-foreground text-center">
                A wide sweep across several regions can take up to a minute — roughly a week of manual OSINT.
              </p>
            )}
          </CardContent>
        </Card>

        {meta && (
          <Card>
            <CardContent className="py-4 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                <span>Sweep result</span>
                <span>{meta.articleCount} signals · {new Date(meta.sweptAt).toLocaleString("en-GB")}</span>
              </div>
              {meta.channelCounts && (
                <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                  <Badge variant="outline" className="text-[10px]">Press {meta.channelCounts.press}</Badge>
                  <Badge variant="outline" className="text-[10px]">Global media {meta.channelCounts.global}</Badge>
                  <Badge variant="outline" className="text-[10px]">Social {meta.channelCounts.social}</Badge>
                </div>
              )}
              {sweepSummary && <p className="text-sm text-foreground/90">{sweepSummary}</p>}
            </CardContent>
          </Card>
        )}

        {prospects && visible.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No qualifying prospects in this window. Try a wider window, more regions or more patterns.
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          {visible.map((p) => (
            <Card key={p.organisation}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base font-semibold">{p.organisation}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {[p.entityType, p.sector || "Sector unknown", p.region, p.threatType].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <Badge variant="outline" className={`text-xs ${severityTone(p.severity)}`}>
                      {p.severity}/100
                    </Badge>
                    <VerifiedTag label="Sourced" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Summary</span>
                    <AssessedTag />
                  </div>
                  <p className="text-sm text-foreground/90 max-h-[4.5rem] overflow-y-auto">{p.summary}</p>
                </div>

                {p.evolution && p.evolution.length > 0 && (
                  <div className="border border-border rounded p-3 bg-muted/20 space-y-2">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Likely narrative evolution</span>
                      <AssessedTag />
                    </p>
                    {p.evolution.map((e, i) => (
                      <div key={i} className="text-sm flex gap-2">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground w-20 shrink-0 pt-1">
                          {e.horizon}
                        </span>
                        <span className="flex-1">
                          <span className={`text-[10px] uppercase tracking-wider mr-2 ${likelihoodTone(e.likelihood)}`}>
                            {e.likelihood}
                          </span>
                          {e.development}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {p.precedent && (
                  <div className="border border-border rounded p-3 bg-muted/10">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-2">
                      <span className="flex items-center gap-1"><History className="h-3 w-3" /> Precedent</span>
                      <AssessedTag />
                    </p>
                    <p className="text-sm max-h-[4.5rem] overflow-y-auto">{p.precedent}</p>
                  </div>
                )}

                {p.wideSignals && p.wideSignals.length > 0 && (
                  <div className="border border-border rounded p-3 bg-muted/10">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-2">
                      <span className="flex items-center gap-1"><Globe className="h-3 w-3" /> Wider spread — beyond our APIs</span>
                      <AssessedTag />
                    </p>
                    <ul className="text-sm space-y-1 max-h-[6rem] overflow-y-auto">
                      {p.wideSignals.map((s, i) => (
                        <li key={i} className="text-foreground/90">· {s}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {p.approachAngle && (
                  <div className="border border-border rounded p-3 bg-muted/20">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-2">
                      <span>Approach angle</span>
                      <AssessedTag />
                    </p>
                    <p className="text-sm">{p.approachAngle}</p>
                  </div>
                )}

                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Verifiable sources</p>
                  {p.sources.map((s) => (
                    <a
                      key={s.url}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-2 text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                      <ExternalLink className="h-3 w-3 mt-0.5 shrink-0" />
                      <span>
                        {s.title}{" "}
                        <span className="opacity-60">· {s.source}{s.channel ? ` · ${s.channel}` : ""}</span>
                      </span>
                    </a>
                  ))}
                </div>
                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/?brand=${encodeURIComponent(p.organisation)}`)}
                  >
                    Full GreyScan
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setDismissed((d) => [...d, p.organisation])}>
                    Dismiss
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
