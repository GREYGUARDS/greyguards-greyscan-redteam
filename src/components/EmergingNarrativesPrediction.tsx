import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, AlertCircle, Activity } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

interface EmergingNarrative {
  title: string;
  indicators: string;
  confidence: "low" | "medium" | "high";
  trajectory: "declining" | "stable" | "growing" | "surging";
  signals: string[];
  estimatedEmergence: string;
  mentionTrend: number;
}

interface EmergingNarrativesPredictionProps {
  predictions: EmergingNarrative[];
  isLoading: boolean;
}

export const EmergingNarrativesPrediction = ({ predictions, isLoading }: EmergingNarrativesPredictionProps) => {
  const getTrajectoryIcon = (trajectory: string) => {
    switch (trajectory) {
      case "surging":
        return "↗↗";
      case "growing":
        return "↗";
      case "stable":
        return "→";
      case "declining":
        return "↘";
      default:
        return "→";
    }
  };

  const getTrajectoryColor = (trajectory: string) => {
    switch (trajectory) {
      case "surging":
        return "text-destructive";
      case "growing":
        return "text-warning";
      case "stable":
        return "text-muted-foreground";
      case "declining":
        return "text-success";
      default:
        return "text-muted-foreground";
    }
  };

  const getConfidenceVariant = (confidence: string): "default" | "secondary" | "destructive" => {
    switch (confidence) {
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "secondary";
    }
  };

  if (isLoading) {
    return (
      <Card className="border border-border bg-card">
        <CardHeader className="border-b border-border bg-secondary/50 py-3 px-4 sm:px-6">
          <CardTitle className="text-sm font-medium tracking-wide flex items-center gap-2">
            <Activity className="h-4 w-4 animate-pulse" />
            Emerging Narrative Predictions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-center py-6">
            <div className="text-muted-foreground text-sm">
              Analyzing patterns...
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!predictions || predictions.length === 0) {
    return (
      <Card className="border border-border bg-card">
        <CardHeader className="border-b border-border bg-secondary/50 py-3 px-4 sm:px-6">
          <CardTitle className="text-sm font-medium tracking-wide flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Emerging Narrative Predictions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <p className="text-muted-foreground text-sm">
            No emerging narratives detected
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-border bg-card">
      <CardHeader className="border-b border-border bg-secondary/50 py-3 px-4 sm:px-6">
        <CardTitle className="text-sm font-medium tracking-wide flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Emerging Narrative Predictions
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          AI-Powered Forecast • Early Warning Signals
        </p>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <div className="space-y-3">
          {predictions.map((prediction, index) => (
            <Collapsible key={index}>
              <div className="border border-border bg-background/50 rounded-sm overflow-hidden">
                <CollapsibleTrigger className="w-full">
                  <div className="p-3 sm:p-4 hover:bg-secondary/30 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 text-left min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-xl ${getTrajectoryColor(prediction.trajectory)}`}>
                            {getTrajectoryIcon(prediction.trajectory)}
                          </span>
                          <h3 className="font-medium text-sm truncate">
                            {prediction.title}
                          </h3>
                        </div>
                        <div className="flex flex-wrap gap-1.5 items-center">
                          <Badge variant={getConfidenceVariant(prediction.confidence)} className="text-xs min-w-[50px]">
                            {prediction.confidence}
                          </Badge>
                          <Badge variant="outline" className="text-xs capitalize min-w-[55px]">
                            {prediction.trajectory}
                          </Badge>
                          <span className={`text-xs font-mono ${prediction.mentionTrend > 0 ? 'text-destructive' : 'text-success'}`}>
                            {prediction.mentionTrend > 0 ? '+' : ''}{prediction.mentionTrend}%
                          </span>
                        </div>
                      </div>
                      <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform flex-shrink-0 mt-1" />
                    </div>
                  </div>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <div className="px-3 sm:px-4 pb-4 space-y-3 border-t border-border pt-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Early Indicators</p>
                      <p className="text-sm">{prediction.indicators}</p>
                    </div>
                    
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Key Signals</p>
                      <div className="flex flex-wrap gap-1.5">
                        {prediction.signals.map((signal, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {signal}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <AlertCircle className="h-3 w-3" />
                      <span>
                        Est. Peak: {new Date(prediction.estimatedEmergence).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          ))}
        </div>

        <div className="mt-4 p-3 bg-muted/30 border border-border rounded-sm">
          <p className="text-xs text-muted-foreground">
            Predictive analysis based on current data patterns. Actual development may vary.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};