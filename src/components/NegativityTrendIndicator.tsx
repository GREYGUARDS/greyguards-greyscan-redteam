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
    <Card className="animate-fade-in border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Negativity Trend Analysis
          {isIncreasing && <TrendingDown className="h-5 w-5 text-destructive" />}
          {!isIncreasing && !isStable && <TrendingUp className="h-5 w-5 text-green-500" />}
          {isStable && <Minus className="h-5 w-5 text-muted-foreground" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Current Negative Sentiment</p>
            <p className={`text-3xl font-bold ${threat.color}`}>{negativePercentage}%</p>
          </div>
          <Badge 
            variant={negativePercentage >= 50 ? "destructive" : "secondary"}
            className="text-lg px-4 py-2"
          >
            {threat.level} Risk
          </Badge>
        </div>

        <div className="pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            {isIncreasing && (
              <>
                <TrendingDown className="h-4 w-4 text-destructive" />
                <span className="text-sm text-destructive font-medium">
                  Negative sentiment increasing by {Math.abs(change)} queries
                </span>
              </>
            )}
            {!isIncreasing && !isStable && (
              <>
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-500 font-medium">
                  Negative sentiment decreasing by {Math.abs(change)} queries
                </span>
              </>
            )}
            {isStable && (
              <>
                <Minus className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground font-medium">
                  Sentiment stable
                </span>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
          <div>
            <p className="text-xs text-muted-foreground">Current</p>
            <p className="text-lg font-semibold text-destructive">{currentNegative}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Previous</p>
            <p className="text-lg font-semibold">{previousNegative}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-lg font-semibold">{totalQueries}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
