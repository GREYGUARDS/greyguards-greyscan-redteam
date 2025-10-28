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
        return "text-foreground";
      case "high":
        return "text-muted-foreground";
      case "medium":
        return "text-foreground";
      default:
        return "text-primary";
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
        return <AlertTriangle className="h-16 w-16" />;
      case "medium":
        return <Activity className="h-16 w-16" />;
      default:
        return <Shield className="h-16 w-16" />;
    }
  };

  return (
    <Card className="border-4 border-border bg-card">
      <CardHeader className="border-b-4 border-border bg-secondary py-4">
        <CardTitle className="uppercase tracking-wider flex items-center gap-2 text-sm">
          <Shield className="h-5 w-5 flex-shrink-0" />
          <span className="truncate">Threat Assessment Matrix</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-8 pb-8">
        <div className="grid grid-cols-3 gap-8">
          <div className="flex flex-col items-center justify-center border-r-2 border-border">
            <div className={`${getColorClass()} mb-4`}>
              {getIcon()}
            </div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Status</p>
            <Badge variant={getBadgeVariant()} className="text-xl px-6 py-2 uppercase tracking-wider">
              {threatLevel}
            </Badge>
          </div>
          <div className="flex flex-col items-center justify-center border-r-2 border-border">
            <p className={`text-6xl font-bold ${getColorClass()} mb-2`}>{threatScore}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-widest">Risk Score</p>
            <div className="mt-4 w-full bg-muted h-2">
              <div 
                className="bg-primary h-full" 
                style={{ width: `${threatScore}%` }}
              />
            </div>
          </div>
          <div className="flex flex-col items-center justify-center">
            <div className="text-center space-y-4">
              <div>
                <p className="text-3xl font-bold">{threatLevel === "critical" ? "IMMEDIATE" : threatLevel === "high" ? "URGENT" : threatLevel === "medium" ? "MODERATE" : "STABLE"}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Alert Level</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
