import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Shield, Activity } from "lucide-react";

interface ThreatIndicatorProps {
  threatLevel: "low" | "medium" | "high" | "critical";
  threatScore: number;
}

export function ThreatIndicator({ threatLevel, threatScore }: ThreatIndicatorProps) {
  const getColorClass = () => {
    switch (threatLevel) {
      case "critical":
        return "text-destructive";
      case "high":
        return "text-destructive";
      case "medium":
        return "text-warning";
      default:
        return "text-success";
    }
  };

  const getGlowClass = () => {
    switch (threatLevel) {
      case "critical":
      case "high":
        return "glow-danger animate-pulse-glow";
      case "medium":
        return "glow-warning animate-pulse-glow";
      default:
        return "glow-success";
    }
  };

  const getBadgeVariant = (): "default" | "secondary" | "destructive" => {
    switch (threatLevel) {
      case "critical":
      case "high":
        return "destructive";
      case "medium":
        return "secondary";
      default:
        return "default";
    }
  };

  const getIcon = () => {
    switch (threatLevel) {
      case "critical":
      case "high":
        return <AlertTriangle className="h-12 w-12 sm:h-16 sm:w-16" />;
      case "medium":
        return <Activity className="h-12 w-12 sm:h-16 sm:w-16" />;
      default:
        return <Shield className="h-12 w-12 sm:h-16 sm:w-16" />;
    }
  };

  return (
    <Card className="border-4 border-border bg-card animate-fade-in">
      <CardHeader className="border-b-4 border-border bg-secondary py-4">
        <CardTitle className="uppercase tracking-wider flex items-center gap-2 text-sm">
          <Shield className="h-5 w-5 flex-shrink-0" />
          <span className="truncate">Threat Assessment Matrix</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-8 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {/* Status with Circular Gauge */}
          <div className="flex flex-col items-center justify-center md:border-r-2 border-border pb-6 md:pb-0">
            <div className="relative mb-4">
              {/* Circular gauge background */}
              <div className={`w-24 h-24 sm:w-32 sm:h-32 rounded-full border-8 border-muted flex items-center justify-center ${getGlowClass()}`}>
                <div className={`${getColorClass()}`}>
                  {getIcon()}
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Status</p>
            <Badge variant={getBadgeVariant()} className="text-lg sm:text-xl px-4 sm:px-6 py-2 uppercase tracking-wider animate-scale-in">
              {threatLevel}
            </Badge>
          </div>

          {/* Risk Score with Large Display */}
          <div className="flex flex-col items-center justify-center md:border-r-2 border-border pb-6 md:pb-0 border-t md:border-t-0 border-b md:border-b-0 border-border py-6 md:py-0">
            <p className={`metric-display ${getColorClass()} mb-2 smooth-transition`}>{threatScore}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-widest">Risk Score</p>
            <div className="mt-4 w-full max-w-[200px] bg-muted h-3 rounded-sm overflow-hidden">
              <div 
                className={`h-full smooth-transition ${threatLevel === "critical" || threatLevel === "high" ? "bg-destructive glow-danger" : threatLevel === "medium" ? "bg-warning glow-warning" : "bg-success glow-success"}`}
                style={{ width: `${threatScore}%` }}
              />
            </div>
          </div>

          {/* Alert Level */}
          <div className="flex flex-col items-center justify-center pt-6 md:pt-0">
            <div className="text-center space-y-4">
              <div className={`p-4 sm:p-6 rounded-sm ${threatLevel === "critical" || threatLevel === "high" ? "border-glow-danger" : threatLevel === "medium" ? "border-glow-warning" : "border-glow-success"} smooth-transition`}>
                <p className={`text-2xl sm:text-3xl md:text-4xl font-bold ${getColorClass()} animate-pulse-scale`}>
                  {threatLevel === "critical" ? "IMMEDIATE" : threatLevel === "high" ? "URGENT" : threatLevel === "medium" ? "MODERATE" : "STABLE"}
                </p>
                <p className="text-xs text-muted-foreground uppercase tracking-widest mt-2">Alert Level</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
