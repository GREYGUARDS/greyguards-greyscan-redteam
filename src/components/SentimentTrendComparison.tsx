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
    if (isStable) return <Minus className="h-5 w-5 text-muted-foreground" />;
    if (isImproving) return <TrendingUp className="h-5 w-5 text-chart-1" />;
    return <TrendingDown className="h-5 w-5 text-chart-2" />;
  };

  const getTrendText = () => {
    if (isStable) return "Stable";
    if (isImproving) return "Improving";
    return "Declining";
  };

  const getTrendColor = () => {
    if (isStable) return "text-muted-foreground";
    if (isImproving) return "text-chart-1";
    return "text-chart-2";
  };

  return (
    <Card className="border-4 border-border bg-card">
      <CardHeader className="border-b-4 border-border">
        <CardTitle className="flex items-center gap-2 uppercase tracking-wider">
          <Activity className="h-5 w-5" />
          Sentiment Trend Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Current vs Long-term Comparison */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              Current Scan
            </p>
            <p className="text-3xl font-bold">
              {shortTermSentiment > 0 ? "+" : ""}{shortTermSentiment}
            </p>
            <p className="text-xs text-muted-foreground">
              This scan
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              Previous Scan
            </p>
            <p className="text-3xl font-bold">
              {previousSentiment > 0 ? "+" : ""}{previousSentiment}
            </p>
            <p className="text-xs text-muted-foreground">
              Last scan
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              Long-term Avg
            </p>
            <p className="text-3xl font-bold">
              {longTermSentiment > 0 ? "+" : ""}{longTermSentiment}
            </p>
            <p className="text-xs text-muted-foreground">
              Last 10 scans
            </p>
          </div>
        </div>

        {/* Trend Indicator vs Previous Scan */}
        <div className="pt-4 border-t-2 border-border">
          <div className="flex items-center gap-3">
            {isStable ? (
              <ArrowRight className="h-6 w-6 text-muted-foreground" />
            ) : isImproving ? (
              <TrendingUp className="h-6 w-6 text-chart-1" />
            ) : (
              <TrendingDown className="h-6 w-6 text-chart-2" />
            )}
            <div>
              <p className={`font-semibold uppercase tracking-wider ${getTrendColor()}`}>
                {getTrendText()}
              </p>
              <p className="text-sm text-muted-foreground">
                {vsPrevious > 0 ? "+" : ""}{vsPrevious.toFixed(1)} points vs previous scan
              </p>
            </div>
          </div>
        </div>

        {/* Long-term Trend Context */}
        <div className="pt-4 border-t-2 border-border">
          <div className="flex items-center gap-3">
            {getTrendIcon()}
            <div>
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold">vs Long-term:</span> {Math.abs(difference).toFixed(1)} point {isImproving ? "above" : "below"} average
              </p>
            </div>
          </div>
        </div>

        {/* Interpretation Guide */}
        <div className="bg-secondary p-4 rounded-sm border-2 border-border">
          <p className="text-xs font-semibold uppercase tracking-wider mb-2">
            Interpretation
          </p>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
            <li>Positive scores indicate more positive than negative sentiment</li>
            <li>Negative scores indicate more negative than positive sentiment</li>
            <li>Historical average smooths out short-term fluctuations</li>
            <li>Compare both metrics to identify trends and patterns</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default SentimentTrendComparison;
