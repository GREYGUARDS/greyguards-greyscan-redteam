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
    if (negativePercentage >= 70) return { level: "Critical", color: "text-destructive", glow: "glow-danger animate-pulse-glow" };
    if (negativePercentage >= 50) return { level: "High", color: "text-warning", glow: "glow-warning animate-pulse-glow" };
    if (negativePercentage >= 30) return { level: "Moderate", color: "text-warning", glow: "glow-warning" };
    return { level: "Low", color: "text-success", glow: "glow-success" };
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
        {/* Main Metrics with Circular Gauge */}
        <div className="flex flex-col md:flex-row items-center justify-between p-6 border-2 border-border bg-secondary smooth-transition hover-glow-primary gap-6 md:gap-0">
          <div className="flex-1 w-full">
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Current Negative Sentiment</p>
            <p className={`metric-display ${threat.color} animate-scale-in`}>{negativePercentage}%</p>
            <p className="text-sm text-muted-foreground mt-3">
              <span className="font-semibold">{currentNegative}</span> of <span className="font-semibold">{totalMentions}</span> mentions
            </p>
            <div className="mt-4 w-full bg-muted h-4 rounded-sm overflow-hidden">
              <div 
                className={`h-full ${threat.glow} smooth-transition`}
                style={{ 
                  width: `${negativePercentage}%`,
                  background: `hsl(var(--${negativePercentage >= 70 ? 'destructive' : negativePercentage >= 50 ? 'warning' : 'success'}))`
                }}
              />
            </div>
          </div>
          <div className="md:ml-8">
            {/* Circular Badge */}
            <div className={`w-24 h-24 sm:w-32 sm:h-32 rounded-full border-8 ${threat.glow} flex items-center justify-center`}>
              <Badge 
                variant={negativePercentage >= 50 ? "destructive" : "secondary"}
                className="text-base sm:text-lg px-3 sm:px-4 py-2 uppercase tracking-wider animate-pulse-scale"
              >
                {threat.level}
              </Badge>
            </div>
          </div>
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

        {/* Statistics Grid with Animations */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t-2 border-border">
          <div className="text-center p-4 border-2 border-border bg-muted/30 smooth-transition hover:scale-105 animate-fade-in">
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Current</p>
            <p className="text-3xl font-bold text-destructive">{currentNegative}</p>
          </div>
          <div className="text-center p-4 border-2 border-border bg-muted/30 smooth-transition hover:scale-105 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Previous</p>
            <p className="text-3xl font-bold">{previousNegative}</p>
          </div>
          <div className="text-center p-4 border-2 border-border bg-muted/30 smooth-transition hover:scale-105 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Change</p>
            <p className={`text-3xl font-bold ${isIncreasing ? 'text-destructive' : 'text-success'}`}>
              {change > 0 ? '+' : ''}{change}
            </p>
          </div>
          <div className="text-center p-4 border-2 border-border bg-muted/30 smooth-transition hover:scale-105 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Total</p>
            <p className="text-3xl font-bold text-primary">{totalMentions}</p>
          </div>
        </div>

        {/* Top Negative Sources Breakdown with Progress Bars */}
        <div className="pt-4 border-t-2 border-border">
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-4">Top Negative Sources</p>
          <div className="space-y-3">
            {topNegativeSources.map((source, idx) => (
              <div key={idx} className="p-3 border-2 border-border bg-muted/30 smooth-transition hover:border-primary animate-slide-in-left" style={{ animationDelay: `${idx * 0.1}s` }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold uppercase tracking-wider">{source.source}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground font-semibold">{source.count} negative</span>
                    <Badge variant="destructive" className="text-xs font-bold">
                      {source.percentage.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
                <div className="w-full bg-muted h-2 rounded-sm overflow-hidden">
                  <div 
                    className="h-full bg-destructive glow-danger smooth-transition"
                    style={{ width: `${source.percentage}%` }}
                  />
                </div>
              </div>
            ))}
            {topNegativeSources.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6 animate-fade-in">No negative mentions detected</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
