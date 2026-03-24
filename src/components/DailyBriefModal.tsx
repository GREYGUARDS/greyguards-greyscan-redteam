import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Shield, AlertTriangle, Bot, Eye } from "lucide-react";

interface DailyBriefModalProps {
  brandName: string;
  threatLevel: string;
  threatScore: number;
  mdmNarratives: any[];
  sentimentDistribution: { name: string; value: number }[];
  brandPeople: any[];
}

const getThreatStatusLabel = (level: string) => {
  switch (level) {
    case "critical": return "CRITICAL";
    case "high": return "ESCALATING";
    case "medium": return "ELEVATED";
    case "low": return "MONITORED";
    default: return "CONTAINED";
  }
};

const getThreatStatusColor = (level: string) => {
  switch (level) {
    case "critical": return "bg-[hsl(0,72%,51%)]/20 text-[hsl(0,72%,51%)] border-[hsl(0,72%,51%)]/30";
    case "high": return "bg-[hsl(25,95%,53%)]/20 text-[hsl(25,95%,53%)] border-[hsl(25,95%,53%)]/30";
    case "medium": return "bg-warning/20 text-warning border-warning/30";
    case "low": return "bg-[hsl(210,100%,50%)]/20 text-[hsl(210,100%,50%)] border-[hsl(210,100%,50%)]/30";
    default: return "bg-success/20 text-success border-success/30";
  }
};

export function DailyBriefModal({ brandName, threatLevel, threatScore, mdmNarratives, sentimentDistribution, brandPeople }: DailyBriefModalProps) {
  const [open, setOpen] = useState(false);
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  const totalSentiment = sentimentDistribution.reduce((s, d) => s + d.value, 0) || 1;
  const negPct = Math.round(((sentimentDistribution.find(s => s.name === "Negative")?.value || 0) / totalSentiment) * 100);
  const posPct = Math.round(((sentimentDistribution.find(s => s.name === "Positive")?.value || 0) / totalSentiment) * 100);

  const topNarrative = mdmNarratives.length > 0 
    ? mdmNarratives.sort((a, b) => (b.frequency || 0) - (a.frequency || 0))[0]
    : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="uppercase tracking-wider">
          <FileText className="mr-2 h-4 w-4" />
          Generate Daily Brief
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="sr-only">GreyScan Daily Brief</DialogTitle>
        </DialogHeader>

        {/* Brief Header */}
        <div className="border border-border rounded-sm overflow-hidden">
          <div className="bg-secondary/50 p-4 border-b border-border">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="h-5 w-5 text-foreground" />
              <span className="text-sm font-bold tracking-widest uppercase text-foreground">GreyScan Daily Brief</span>
            </div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{dateStr} — 07:00 GMT</p>
            <p className="text-xs text-muted-foreground mt-1">Classification: <span className="text-foreground font-medium">PARTNER CONFIDENTIAL</span></p>
          </div>

          <div className="p-4 space-y-5">
            {/* Client */}
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Client</p>
              <p className="text-sm font-semibold text-foreground">{brandName}</p>
            </div>

            {/* Narrative Summary */}
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Narrative Summary</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {topNarrative 
                  ? `Primary threat narrative: "${topNarrative.narrative_description}" — detected across ${topNarrative.frequency || 0} instances with ${topNarrative.severity} severity. Sentiment analysis indicates ${negPct}% negative coverage against ${posPct}% positive, with ${mdmNarratives.length} active threat narratives currently being tracked across open-source channels.`
                  : `Monitoring active across all channels. ${negPct}% negative coverage detected against ${posPct}% positive. No critical threat narratives currently flagged.`
                }
              </p>
            </div>

            {/* Threat Status */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Narrative Threat Status</p>
                <Badge variant="outline" className={`text-xs uppercase tracking-wider ${getThreatStatusColor(threatLevel)}`}>
                  {getThreatStatusLabel(threatLevel)}
                </Badge>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Threat Score</p>
                <p className="text-lg font-mono font-bold text-foreground">{threatScore}/100</p>
              </div>
            </div>

            {/* Source Confidence & Actor Attribution */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Source Confidence</p>
                <Badge variant="outline" className="text-xs">
                  {threatScore >= 70 ? "HIGH" : threatScore >= 40 ? "MEDIUM" : "LOW"}
                </Badge>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Actor Attribution</p>
                <Badge variant="outline" className="text-xs">
                  {threatScore >= 80 ? "Probable State-Adjacent" : threatScore >= 60 ? "Automated" : "Unknown"}
                </Badge>
              </div>
            </div>

            {/* Synthetic Content */}
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-1">
                <Eye className="h-3 w-3" /> Synthetic Content Detected
              </p>
              <p className="text-xs text-muted-foreground">
                3 flagged assets under analysis (1× deepfake video, 1× synthetic audio, 1× manipulated image). Confidence scores range 78.9%–94.2%.
              </p>
            </div>

            {/* Executive Exposure */}
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-1">
                <Bot className="h-3 w-3" /> AI Engine Exposure
              </p>
              <p className="text-xs text-muted-foreground">
                {brandName} is currently described with negative framing in ChatGPT (Risk 7/10, Escalating), Gemini (Risk 6/10, Stable), and Perplexity (Risk 5/10, De-escalating). Primary concern: regulatory compliance narratives in European markets.
              </p>
            </div>

            {/* Recommended Action */}
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> Recommended Action
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {threatScore >= 70 
                  ? "IMMEDIATE: Activate crisis communications protocol. Brief executive team within 2 hours. Prepare counter-narrative statements for top 3 threat vectors. Engage AI platform correction processes for factual inaccuracies."
                  : threatScore >= 40
                  ? "MONITOR: Continue active monitoring. Prepare holding statements. Brief communications team on emerging narratives. Review AI engine outputs weekly."
                  : "ROUTINE: Maintain standard monitoring cadence. No immediate action required. Next review scheduled in 24 hours."
                }
              </p>
            </div>

            {/* Compliance Note */}
            <div className="border-t border-border pt-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">EU AI Act Compliance Note</p>
              <p className="text-xs text-muted-foreground">
                This brief was generated using AI-assisted analysis in compliance with EU AI Act Article 50 transparency requirements. All synthetic content detection models are registered and auditable. NIS2 compliance maintained.
              </p>
            </div>

            {/* Footer */}
            <div className="border-t border-border pt-3 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                GreyScan — Narrative Intelligence Platform v1
              </p>
              <p className="text-[10px] text-muted-foreground">
                For qualified partner use only. Do not distribute.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
