import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface NegativityTrendIndicatorProps {
  currentNegative: number;
  previousNegative: number;
  totalQueries: number;
}

export function NegativityTrendIndicator({ 
  currentNegative, 
  previousNegative, 
  totalQueries 
}: NegativityTrendIndicatorProps) {
  const negativePercentage = Math.round((currentNegative / totalQueries) * 100);
  const change = currentNegative - previousNegative;
  const isIncreasing = change > 0;
  const isStable = change === 0;

  const getThreatLevel = () => {
    if (negativePercentage >= 70) return { level: "Critical", color: "text-destructive" };
    if (negativePercentage >= 50) return { level: "High", color: "text-warning" };
    if (negativePercentage >= 30) return { level: "Moderate", color: "text-yellow-500" };
    return { level: "Low", color: "text-green-500" };
  };

  const threat = getThreatLevel();

  return (
    <Card className="animate-fade-in border-4 border-border">
      <CardHeader className="border-b-4 border-border bg-secondary">
        <CardTitle className="uppercase tracking-wider flex items-center gap-2">
          Negativity Trend Analysis
          {isIncreasing && <TrendingDown className="h-5 w-5 text-muted-foreground" />}
          {!isIncreasing && !isStable && <TrendingUp className="h-5 w-5 text-primary" />}
          {isStable && <Minus className="h-5 w-5 text-muted-foreground" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="flex items-center justify-between p-4 border-2 border-border bg-secondary">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Current Negative Sentiment</p>
            <p className={`text-5xl font-bold ${threat.color}`}>{negativePercentage}%</p>
          </div>
          <Badge 
            variant={negativePercentage >= 50 ? "destructive" : "secondary"}
            className="text-lg px-6 py-3 uppercase tracking-wider"
          >
            {threat.level} Risk
          </Badge>
        </div>

        <div className="pt-4 border-t-2 border-border">
          <div className="flex items-center gap-3 p-3 bg-muted">
            {isIncreasing && (
              <>
                <TrendingDown className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
                  Negative trending up // +{Math.abs(change)} queries
                </span>
              </>
            )}
            {!isIncreasing && !isStable && (
              <>
                <TrendingUp className="h-5 w-5 text-primary" />
                <span className="text-sm text-primary font-medium uppercase tracking-wider">
                  Negative trending down // -{Math.abs(change)} queries
                </span>
              </>
            )}
            {isStable && (
              <>
                <Minus className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
                  Sentiment stable // No change
                </span>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4 border-t-2 border-border">
          <div className="text-center p-3 border border-border">
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Current</p>
            <p className="text-2xl font-bold text-muted-foreground">{currentNegative}</p>
          </div>
          <div className="text-center p-3 border border-border">
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Previous</p>
            <p className="text-2xl font-bold">{previousNegative}</p>
          </div>
          <div className="text-center p-3 border border-border">
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Total</p>
            <p className="text-2xl font-bold">{totalQueries}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
