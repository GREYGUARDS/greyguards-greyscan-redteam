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
        return "text-danger";
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
      <Card className="border-4 border-border bg-card">
        <CardHeader>
          <CardTitle className="uppercase tracking-wider flex items-center gap-2">
            <Activity className="h-5 w-5 animate-pulse" />
            Emerging Narrative Predictions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground uppercase tracking-wider">
              Analyzing patterns...
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!predictions || predictions.length === 0) {
    return (
      <Card className="border-4 border-border bg-card">
        <CardHeader>
          <CardTitle className="uppercase tracking-wider flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Emerging Narrative Predictions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground uppercase tracking-wider text-sm">
            No emerging narratives detected
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-4 border-border bg-card">
      <CardHeader>
        <CardTitle className="uppercase tracking-wider flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Emerging Narrative Predictions
        </CardTitle>
        <p className="text-xs text-muted-foreground uppercase tracking-widest mt-2">
          AI-Powered Forecast • Early Warning Signals • Growing Patterns
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {predictions.map((prediction, index) => (
            <Collapsible key={index}>
              <div className="border-2 border-border bg-background/50 backdrop-blur-sm">
                <CollapsibleTrigger className="w-full">
                  <div className="p-4 hover:bg-accent/10 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-2xl ${getTrajectoryColor(prediction.trajectory)}`}>
                            {getTrajectoryIcon(prediction.trajectory)}
                          </span>
                          <h3 className="font-semibold uppercase tracking-wide text-sm">
                            {prediction.title}
                          </h3>
                        </div>
                        <div className="flex flex-wrap gap-2 items-center">
                          <Badge variant={getConfidenceVariant(prediction.confidence)} className="uppercase text-xs">
                            {prediction.confidence} confidence
                          </Badge>
                          <Badge variant="outline" className="uppercase text-xs">
                            {prediction.trajectory}
                          </Badge>
                          <span className={`text-xs font-mono ${prediction.mentionTrend > 0 ? 'text-danger' : 'text-success'}`}>
                            {prediction.mentionTrend > 0 ? '+' : ''}{prediction.mentionTrend}% mentions (7d forecast)
                          </span>
                        </div>
                      </div>
                      <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                    </div>
                  </div>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <div className="px-4 pb-4 space-y-3 border-t-2 border-border pt-3">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Early Indicators</p>
                      <p className="text-sm">{prediction.indicators}</p>
                    </div>
                    
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Key Signals</p>
                      <div className="flex flex-wrap gap-2">
                        {prediction.signals.map((signal, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {signal}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <AlertCircle className="h-3 w-3" />
                      <span className="uppercase tracking-wider">
                        Estimated Peak: {new Date(prediction.estimatedEmergence).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          ))}
        </div>

        <div className="mt-6 p-4 bg-accent/20 border-2 border-accent">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            ⚠ Predictive Analysis: These are AI-generated forecasts based on current data patterns. 
            Actual narrative development may vary significantly.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
