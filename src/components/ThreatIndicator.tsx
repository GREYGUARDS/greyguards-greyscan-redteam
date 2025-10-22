import { AlertTriangle, AlertCircle, Info, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface ThreatIndicatorProps {
  threatLevel: "low" | "medium" | "high" | "critical";
  threatScore: number;
}

export function ThreatIndicator({ threatLevel, threatScore }: ThreatIndicatorProps) {
  const config = {
    low: {
      icon: Shield,
      color: "text-success",
      bgColor: "bg-success/10",
      borderColor: "border-success/30",
      label: "Low Threat",
    },
    medium: {
      icon: Info,
      color: "text-warning",
      bgColor: "bg-warning/10",
      borderColor: "border-warning/30",
      label: "Medium Threat",
    },
    high: {
      icon: AlertCircle,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
      borderColor: "border-destructive/30",
      label: "High Threat",
    },
    critical: {
      icon: AlertTriangle,
      color: "text-destructive",
      bgColor: "bg-destructive/20",
      borderColor: "border-destructive/50",
      label: "Critical Threat",
    },
  };

  const { icon: Icon, color, bgColor, borderColor, label } = config[threatLevel];

  return (
    <Card className={`${borderColor} ${bgColor}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className={`h-5 w-5 ${color}`} />
          Threat Indicator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className={`text-2xl font-bold ${color}`}>{label}</span>
          <span className={`text-3xl font-bold ${color}`}>{threatScore}/100</span>
        </div>
        <Progress value={threatScore} className="h-2" />
        <p className="text-sm text-muted-foreground">
          Threat score calculated from negative mentions ratio × average post reach
        </p>
      </CardContent>
    </Card>
  );
}
