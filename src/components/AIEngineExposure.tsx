import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface EngineRow {
  engine: string;
  narrative: string;
  riskScore: number;
  trend: "Stable" | "Escalating" | "De-escalating";
}

const getTrendIcon = (trend: string) => {
  switch (trend) {
    case "Escalating": return <TrendingUp className="h-4 w-4 text-destructive" />;
    case "De-escalating": return <TrendingDown className="h-4 w-4 text-success" />;
    default: return <Minus className="h-4 w-4 text-muted-foreground" />;
  }
};

const getTrendColor = (trend: string) => {
  switch (trend) {
    case "Escalating": return "bg-destructive/10 text-destructive border-destructive/20";
    case "De-escalating": return "bg-success/10 text-success border-success/20";
    default: return "bg-muted text-muted-foreground border-border";
  }
};

const getRiskColor = (score: number) => {
  if (score >= 8) return "text-destructive";
  if (score >= 5) return "text-warning";
  return "text-success";
};

interface AIEngineExposureProps {
  brandName: string;
}

export function AIEngineExposure({ brandName }: AIEngineExposureProps) {
  const clientName = brandName || "[CLIENT NAME]";

  const engines: EngineRow[] = [
    {
      engine: "ChatGPT",
      narrative: `${clientName} has been linked in multiple AI-generated summaries to concerns about regulatory compliance in European markets and ongoing investigations by oversight bodies.`,
      riskScore: 7,
      trend: "Escalating",
    },
    {
      engine: "Gemini",
      narrative: `${clientName} is frequently cited in AI responses regarding recent controversy over executive conduct and alleged governance failures, with increasing search-driven amplification.`,
      riskScore: 6,
      trend: "Stable",
    },
    {
      engine: "Perplexity",
      narrative: `${clientName} appears in synthesised answers linking the organisation to industry-wide criticism of lobbying practices and environmental commitments.`,
      riskScore: 5,
      trend: "De-escalating",
    },
  ];

  return (
    <Card className="border border-border bg-card">
      <CardHeader className="border-b border-border bg-secondary/50 py-3 px-4 sm:px-6">
        <CardTitle className="text-sm font-medium tracking-wide flex items-center gap-2 uppercase">
          <Bot className="h-4 w-4 flex-shrink-0" />
          AI Engine Exposure
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider w-28">Engine</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Narrative Excerpt</th>
                <th className="text-center p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider w-24">Risk Score</th>
                <th className="text-center p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider w-32">Trend</th>
              </tr>
            </thead>
            <tbody>
              {engines.map((row) => (
                <tr key={row.engine} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                  <td className="p-3">
                    <span className="font-semibold text-foreground">{row.engine}</span>
                  </td>
                  <td className="p-3 max-w-lg">
                    <span className="text-xs text-muted-foreground italic">"{row.narrative}"</span>
                  </td>
                  <td className="p-3 text-center">
                    <span className={`font-mono font-bold text-lg ${getRiskColor(row.riskScore)}`}>
                      {row.riskScore}/10
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <Badge variant="outline" className={`text-xs gap-1 ${getTrendColor(row.trend)}`}>
                      {getTrendIcon(row.trend)}
                      {row.trend}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
