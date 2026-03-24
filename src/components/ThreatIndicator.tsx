import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Shield, Activity } from "lucide-react";

interface ThreatIndicatorProps {
  threatLevel: "low" | "medium" | "high" | "critical";
  threatScore: number;
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

const getSourceConfidence = (score: number) => {
  if (score >= 70) return "HIGH";
  if (score >= 40) return "MEDIUM";
  return "LOW";
};

const getActorAttribution = (score: number) => {
  if (score >= 80) return "Confirmed State-Adjacent";
  if (score >= 70) return "Probable State-Adjacent";
  if (score >= 50) return "Automated";
  return "Unknown";
};

export function ThreatIndicator({ threatLevel, threatScore }: ThreatIndicatorProps) {
  const getColorClass = () => {
    switch (threatLevel) {
      case "critical": return "text-[hsl(0,72%,51%)]";
      case "high": return "text-[hsl(25,95%,53%)]";
      case "medium": return "text-warning";
      default: return "text-success";
    }
  };

  const getGlowClass = () => {
    switch (threatLevel) {
      case "critical":
      case "high":
        return "glow-danger";
      case "medium":
        return "glow-warning";
      default:
        return "glow-success";
    }
  };

  const getStatusBadgeColor = () => {
    switch (threatLevel) {
      case "critical": return "bg-[hsl(0,72%,51%)]/20 text-[hsl(0,72%,51%)] border-[hsl(0,72%,51%)]/30";
      case "high": return "bg-[hsl(25,95%,53%)]/20 text-[hsl(25,95%,53%)] border-[hsl(25,95%,53%)]/30";
      case "medium": return "bg-warning/20 text-warning border-warning/30";
      case "low": return "bg-[hsl(210,100%,50%)]/20 text-[hsl(210,100%,50%)] border-[hsl(210,100%,50%)]/30";
      default: return "bg-success/20 text-success border-success/30";
    }
  };

  const getIcon = () => {
    switch (threatLevel) {
      case "critical":
      case "high":
        return <AlertTriangle className="h-8 w-8 sm:h-10 sm:w-10" />;
      case "medium":
        return <Activity className="h-8 w-8 sm:h-10 sm:w-10" />;
      default:
        return <Shield className="h-8 w-8 sm:h-10 sm:w-10" />;
    }
  };

  return (
    <Card className="border border-border bg-card">
      <CardHeader className="border-b border-border bg-secondary/50 py-3 px-4 sm:px-6">
        <CardTitle className="text-sm font-medium tracking-wide flex items-center gap-2 uppercase">
          <Shield className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">Narrative Threat Status</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          {/* Status with Circular Gauge */}
          <div className="flex flex-row sm:flex-col items-center justify-between sm:justify-center sm:border-r border-border pb-4 sm:pb-0">
            <div className="flex items-center gap-3 sm:flex-col sm:gap-0">
              <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-muted flex items-center justify-center ${getGlowClass()} mb-0 sm:mb-3`}>
                <div className={`${getColorClass()}`}>
                  {getIcon()}
                </div>
              </div>
              <div className="sm:text-center">
                <p className="text-xs text-muted-foreground tracking-wide mb-1">Status</p>
                <Badge variant="outline" className={`text-sm px-3 py-1.5 min-w-[70px] uppercase tracking-wider font-bold ${getStatusBadgeColor()}`}>
                  {getThreatStatusLabel(threatLevel)}
                </Badge>
              </div>
            </div>
          </div>

          {/* Risk Score */}
          <div className="flex flex-row sm:flex-col items-center justify-between sm:justify-center sm:border-r border-border py-4 sm:py-0 border-y sm:border-y-0 border-border">
            <div className="sm:text-center">
              <p className="text-xs text-muted-foreground tracking-wide mb-1">Risk Score</p>
              <p className={`metric-display ${getColorClass()} smooth-transition`}>{threatScore}</p>
            </div>
            <div className="w-24 sm:w-full sm:max-w-[160px] sm:mt-3">
              <div className="bg-muted h-2 rounded-sm overflow-hidden">
                <div 
                  className={`h-full smooth-transition ${threatLevel === "critical" ? "bg-[hsl(0,72%,51%)]" : threatLevel === "high" ? "bg-[hsl(25,95%,53%)]" : threatLevel === "medium" ? "bg-warning" : "bg-success"}`}
                  style={{ width: `${threatScore}%` }}
                />
              </div>
            </div>
          </div>

          {/* Source Confidence & Actor Attribution */}
          <div className="flex flex-row sm:flex-col items-center justify-between sm:justify-center pt-4 sm:pt-0 gap-3">
            <div className="sm:text-center">
              <p className="text-xs text-muted-foreground tracking-wide mb-1">Source Confidence</p>
              <Badge variant="outline" className="text-xs uppercase tracking-wider">
                {getSourceConfidence(threatScore)}
              </Badge>
            </div>
            <div className="sm:text-center">
              <p className="text-xs text-muted-foreground tracking-wide mb-1">Actor Attribution</p>
              <Badge variant="outline" className="text-xs uppercase tracking-wider">
                {getActorAttribution(threatScore)}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
