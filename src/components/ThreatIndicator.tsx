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
        return "glow-danger";
      case "medium":
        return "glow-warning";
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
        <CardTitle className="text-sm font-medium tracking-wide flex items-center gap-2">
          <Shield className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">Threat Assessment</span>
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
                <Badge variant={getBadgeVariant()} className="text-sm px-3 py-1 capitalize">
                  {threatLevel}
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
                  className={`h-full smooth-transition ${threatLevel === "critical" || threatLevel === "high" ? "bg-destructive" : threatLevel === "medium" ? "bg-warning" : "bg-success"}`}
                  style={{ width: `${threatScore}%` }}
                />
              </div>
            </div>
          </div>

          {/* Alert Level */}
          <div className="flex flex-row sm:flex-col items-center justify-between sm:justify-center pt-4 sm:pt-0">
            <div className="sm:text-center">
              <p className="text-xs text-muted-foreground tracking-wide mb-1">Alert Level</p>
              <div className={`px-4 py-2 rounded-sm ${threatLevel === "critical" || threatLevel === "high" ? "border-glow-danger" : threatLevel === "medium" ? "border-glow-warning" : "border-glow-success"} smooth-transition`}>
                <p className={`text-lg sm:text-xl font-semibold ${getColorClass()}`}>
                  {threatLevel === "critical" ? "Immediate" : threatLevel === "high" ? "Urgent" : threatLevel === "medium" ? "Moderate" : "Stable"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}