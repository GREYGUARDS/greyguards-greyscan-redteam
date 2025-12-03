import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, Activity, ArrowRight } from "lucide-react";

interface SentimentTrendComparisonProps {
  shortTermSentiment: number;
  longTermSentiment: number;
  trendIcon: string;
  previousSentiment: number;
}

const SentimentTrendComparison = ({ shortTermSentiment, longTermSentiment, trendIcon, previousSentiment }: SentimentTrendComparisonProps) => {
  const difference = shortTermSentiment - longTermSentiment;
  const vsPrevious = shortTermSentiment - previousSentiment;
  const isImproving = difference > 0;
  const isStable = Math.abs(difference) < 2;

  const getTrendIcon = () => {
    if (isStable) return <Minus className="h-4 w-4 text-muted-foreground" />;
    if (isImproving) return <TrendingUp className="h-4 w-4 text-success" />;
    return <TrendingDown className="h-4 w-4 text-destructive" />;
  };

  const getTrendText = () => {
    if (isStable) return "Stable";
    if (isImproving) return "Improving";
    return "Declining";
  };

  const getTrendColor = () => {
    if (isStable) return "text-muted-foreground";
    if (isImproving) return "text-success";
    return "text-destructive";
  };

  return (
    <Card className="border border-border bg-card">
      <CardHeader className="border-b border-border bg-secondary/50 py-3 px-4 sm:px-6">
        <CardTitle className="text-sm font-medium tracking-wide flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Sentiment Trend
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 space-y-4">
        {/* Current vs Long-term Comparison */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Current</p>
            <p className="text-xl sm:text-2xl font-semibold">
              {shortTermSentiment > 0 ? "+" : ""}{shortTermSentiment}
            </p>
            <p className="text-xs text-muted-foreground">This scan</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Previous</p>
            <p className="text-xl sm:text-2xl font-semibold">
              {previousSentiment > 0 ? "+" : ""}{previousSentiment}
            </p>
            <p className="text-xs text-muted-foreground">Last scan</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Average</p>
            <p className="text-xl sm:text-2xl font-semibold">
              {longTermSentiment > 0 ? "+" : ""}{longTermSentiment}
            </p>
            <p className="text-xs text-muted-foreground">10 scans</p>
          </div>
        </div>

        {/* Trend Indicator */}
        <div className="pt-3 border-t border-border">
          <div className="flex items-center gap-2">
            {isStable ? (
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            ) : isImproving ? (
              <TrendingUp className="h-5 w-5 text-success" />
            ) : (
              <TrendingDown className="h-5 w-5 text-destructive" />
            )}
            <div>
              <p className={`font-medium ${getTrendColor()}`}>
                {getTrendText()}
              </p>
              <p className="text-sm text-muted-foreground">
                {vsPrevious > 0 ? "+" : ""}{vsPrevious.toFixed(1)} vs previous
              </p>
            </div>
          </div>
        </div>

        {/* Long-term Context */}
        <div className="pt-3 border-t border-border">
          <div className="flex items-center gap-2">
            {getTrendIcon()}
            <p className="text-sm text-muted-foreground">
              {Math.abs(difference).toFixed(1)} pts {isImproving ? "above" : "below"} avg
            </p>
          </div>
        </div>

        {/* Interpretation */}
        <div className="bg-secondary/50 p-3 rounded-sm border border-border">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Positive scores = favorable sentiment. Compare with historical average to identify trends.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SentimentTrendComparison;
