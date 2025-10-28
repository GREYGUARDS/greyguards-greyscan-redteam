import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown, TrendingUp, Minus, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface NegativityTrendIndicatorProps {
  currentNegative: number;
  previousNegative: number;
  totalMentions: number;
  negativeBySource: Array<{source: string; count: number; percentage: number}>;
  changeVelocity: number;
  peakNegativeDay?: string;
}

export function NegativityTrendIndicator({ 
  currentNegative, 
  previousNegative, 
  totalMentions,
  negativeBySource,
  changeVelocity,
  peakNegativeDay
}: NegativityTrendIndicatorProps) {
  const negativePercentage = Math.round((currentNegative / totalMentions) * 100);
  const change = currentNegative - previousNegative;
  const changePercentage = previousNegative > 0 
    ? Math.round(((currentNegative - previousNegative) / previousNegative) * 100) 
    : 0;
  const isIncreasing = change > 0;
  const isStable = change === 0;

  const getThreatLevel = () => {
    if (negativePercentage >= 70) return { level: "Critical", color: "text-destructive" };
    if (negativePercentage >= 50) return { level: "High", color: "text-warning" };
    if (negativePercentage >= 30) return { level: "Moderate", color: "text-yellow-500" };
    return { level: "Low", color: "text-green-500" };
  };

  const threat = getThreatLevel();

  // Sort sources by negative count
  const topNegativeSources = [...negativeBySource].sort((a, b) => b.count - a.count).slice(0, 5);

  return (
    <Card className="animate-fade-in border-4 border-border">
      <CardHeader className="border-b-4 border-border bg-secondary">
        <CardTitle className="uppercase tracking-wider flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Negativity Trend Analysis
          {isIncreasing && <TrendingDown className="h-5 w-5 text-muted-foreground" />}
          {!isIncreasing && !isStable && <TrendingUp className="h-5 w-5 text-primary" />}
          {isStable && <Minus className="h-5 w-5 text-muted-foreground" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {/* Main Metrics */}
        <div className="flex items-center justify-between p-4 border-2 border-border bg-secondary">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Current Negative Sentiment</p>
            <p className={`text-5xl font-bold ${threat.color}`}>{negativePercentage}%</p>
            <p className="text-xs text-muted-foreground mt-2">
              {currentNegative} of {totalMentions} mentions
            </p>
          </div>
          <Badge 
            variant={negativePercentage >= 50 ? "destructive" : "secondary"}
            className="text-lg px-6 py-3 uppercase tracking-wider"
          >
            {threat.level} Risk
          </Badge>
        </div>

        {/* Trend Direction with Enhanced Stats */}
        <div className="pt-4 border-t-2 border-border space-y-3">
          <div className="flex items-center gap-3 p-3 bg-muted">
            {isIncreasing && (
              <>
                <TrendingDown className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <span className="text-sm text-muted-foreground font-medium uppercase tracking-wider block">
                    Negative trending up // +{Math.abs(change)} mentions
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {changePercentage > 0 ? '+' : ''}{changePercentage}% change • Velocity: {changeVelocity.toFixed(2)}/day
                  </span>
                </div>
              </>
            )}
            {!isIncreasing && !isStable && (
              <>
                <TrendingUp className="h-5 w-5 text-primary" />
                <div className="flex-1">
                  <span className="text-sm text-primary font-medium uppercase tracking-wider block">
                    Negative trending down // -{Math.abs(change)} mentions
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {changePercentage}% improvement • Velocity: {changeVelocity.toFixed(2)}/day
                  </span>
                </div>
              </>
            )}
            {isStable && (
              <>
                <Minus className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <span className="text-sm text-muted-foreground font-medium uppercase tracking-wider block">
                    Sentiment stable // No change
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Velocity: {changeVelocity.toFixed(2)}/day
                  </span>
                </div>
              </>
            )}
          </div>
          
          {peakNegativeDay && (
            <div className="p-3 bg-muted/50 border-l-4 border-muted-foreground">
              <p className="text-xs text-muted-foreground uppercase tracking-widest">Peak Negative Activity</p>
              <p className="text-sm font-medium">{peakNegativeDay}</p>
            </div>
          )}
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-4 gap-4 pt-4 border-t-2 border-border">
          <div className="text-center p-3 border border-border">
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Current</p>
            <p className="text-2xl font-bold text-muted-foreground">{currentNegative}</p>
          </div>
          <div className="text-center p-3 border border-border">
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Previous</p>
            <p className="text-2xl font-bold">{previousNegative}</p>
          </div>
          <div className="text-center p-3 border border-border">
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Change</p>
            <p className={`text-2xl font-bold ${isIncreasing ? 'text-muted-foreground' : 'text-primary'}`}>
              {change > 0 ? '+' : ''}{change}
            </p>
          </div>
          <div className="text-center p-3 border border-border">
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Total</p>
            <p className="text-2xl font-bold">{totalMentions}</p>
          </div>
        </div>

        {/* Top Negative Sources Breakdown */}
        <div className="pt-4 border-t-2 border-border">
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">Top Negative Sources</p>
          <div className="space-y-2">
            {topNegativeSources.map((source, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 border border-border bg-muted/30">
                <span className="text-sm font-medium uppercase tracking-wider">{source.source}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">{source.count} negative</span>
                  <Badge variant="outline" className="text-xs">
                    {source.percentage.toFixed(1)}%
                  </Badge>
                </div>
              </div>
            ))}
            {topNegativeSources.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No negative mentions detected</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
