import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAccessProfile } from "@/hooks/useAccessProfile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Radar, ExternalLink, Loader2, Search } from "lucide-react";

interface ProspectSource {
  title: string;
  url: string;
  source: string;
  publishedAt: string;
}

interface Prospect {
  organisation: string;
  sector: string;
  threatType: string;
  severity: number;
  summary: string;
  approachAngle: string;
  sources: ProspectSource[];
}

const WINDOWS = [6, 12, 24, 48, 72];

const PATTERNS = [
  { key: "disinformation", label: "Disinformation campaigns" },
  { key: "deepfake", label: "Deepfake & synthetic media" },
  { key: "boycott", label: "Coordinated boycott / pile-on" },
  { key: "fraud", label: "Brand impersonation & scams" },
];

function severityTone(severity: number) {
  if (severity >= 70) return "text-destructive border-destructive/40 bg-destructive/10";
  if (severity >= 40) return "text-primary border-primary/40 bg-primary/10";
  return "text-muted-foreground border-border bg-muted/30";
}

export default function ProspectRadar() {
  const access = useAccessProfile();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [windowHours, setWindowHours] = useState(24);
  const [selected, setSelected] = useState<string[]>(PATTERNS.map((p) => p.key));
  const [scanning, setScanning] = useState(false);
  const [prospects, setProspects] = useState<Prospect[] | null>(null);
  const [sweepSummary, setSweepSummary] = useState("");
  const [meta, setMeta] = useState<{ articleCount: number; sweptAt: string } | null>(null);
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    if (access.loading) return;
    if (!access.isAdmin) navigate("/", { replace: true });
  }, [access.loading, access.isAdmin, navigate]);

  const togglePattern = (key: string) =>
    setSelected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  const runSweep = async () => {
    if (selected.length === 0) {
      toast({ title: "Select at least one threat pattern", variant: "destructive" });
      return;
    }
    setScanning(true);
    const { data, error } = await supabase.functions.invoke("prospect-radar-sweep", {
      body: { windowHours, patterns: selected },
    });
    setScanning(false);
    if (error) {
      toast({ title: "Sweep failed", description: error.message, variant: "destructive" });
      return;
    }
    setProspects((data?.prospects || []) as Prospect[]);
    setSweepSummary(data?.sweepSummary || "");
    setMeta({ articleCount: data?.articleCount || 0, sweptAt: data?.sweptAt || new Date().toISOString() });
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
            Private sweep — finds emerging narrative threats first, then names the organisations caught in them. Runs only when you scan.
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
                    key={w}
                    size="sm"
                    variant={windowHours === w ? "default" : "outline"}
                    onClick={() => setWindowHours(w)}
                  >
                    {w}h
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
                    onClick={() => togglePattern(p.key)}
                  >
                    {p.label}
                  </Button>
                ))}
              </div>
            </div>

            <Button onClick={runSweep} disabled={scanning} className="w-full">
              {scanning ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sweeping sources…</>
              ) : (
                <><Search className="h-4 w-4 mr-2" /> Run sweep</>
              )}
            </Button>
          </CardContent>
        </Card>

        {meta && (
          <Card>
            <CardContent className="py-4 space-y-2">
              <div className="flex items-center justify-between text-xs uppercase tracking-wider text-muted-foreground">
                <span>Sweep result</span>
                <span>{meta.articleCount} signals · {new Date(meta.sweptAt).toLocaleString("en-GB")}</span>
              </div>
              {sweepSummary && <p className="text-sm text-foreground/90">{sweepSummary}</p>}
            </CardContent>
          </Card>
        )}

        {prospects && visible.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No qualifying prospects in this window. Try a wider window or more patterns.
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
                      {p.sector || "Sector unknown"} · {p.threatType}
                    </p>
                  </div>
                  <Badge variant="outline" className={`text-xs shrink-0 ${severityTone(p.severity)}`}>
                    {p.severity}/100
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-foreground/90 max-h-[4.5rem] overflow-y-auto">{p.summary}</p>
                {p.approachAngle && (
                  <div className="border border-border rounded p-3 bg-muted/20">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Approach angle</p>
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
                      <span>{s.title} <span className="opacity-60">· {s.source}</span></span>
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
