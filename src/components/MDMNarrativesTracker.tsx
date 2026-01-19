import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingUp, Shield, Info } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface MDMNarrative {
  type: "misinformation" | "disinformation" | "malinformation";
  title: string;
  description: string;
  severity: "low" | "medium" | "high";
  frequency: number;
  firstSeen?: string;
  keywords?: string[];
}

interface MDMNarrativesTrackerProps {
  narratives: MDMNarrative[];
  loading?: boolean;
}

export function MDMNarrativesTracker({ narratives, loading }: MDMNarrativesTrackerProps) {
  const getTypeConfig = (type: string) => {
    switch (type) {
      case "misinformation":
        return {
          label: "Misinformation",
          icon: Info,
          color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
          description: "False info shared without malicious intent"
        };
      case "disinformation":
        return {
          label: "Disinformation",
          icon: AlertTriangle,
          color: "bg-destructive/10 text-destructive border-destructive/20",
          description: "False info deliberately spread to deceive"
        };
      case "malinformation":
        return {
          label: "Malinformation",
          icon: Shield,
          color: "bg-warning/10 text-warning border-warning/20",
          description: "True info used to inflict harm"
        };
      default:
        return {
          label: type,
          icon: Info,
          color: "bg-muted text-muted-foreground border-border",
          description: "Unknown type"
        };
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-destructive/90 text-destructive-foreground";
      case "medium":
        return "bg-warning/90 text-warning-foreground";
      case "low":
        return "bg-success/90 text-success-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const sortedNarratives = [...narratives].sort((a, b) => {
    const severityOrder = { high: 3, medium: 2, low: 1 };
    return (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0);
  });

  const stats = {
    total: narratives.length,
    high: narratives.filter(n => n.severity === "high").length,
    medium: narratives.filter(n => n.severity === "medium").length,
    low: narratives.filter(n => n.severity === "low").length,
    misinformation: narratives.filter(n => n.type === "misinformation").length,
    disinformation: narratives.filter(n => n.type === "disinformation").length,
    malinformation: narratives.filter(n => n.type === "malinformation").length,
  };

  if (loading) {
    return (
      <Card className="border border-border">
        <CardHeader className="border-b border-border bg-secondary/50 py-3 px-4 sm:px-6">
          <CardTitle className="text-sm font-medium tracking-wide flex items-center gap-2">
            <Shield className="h-4 w-4" />
            MDM Narrative Intelligence
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="text-center text-muted-foreground py-8 text-sm">
            Analyzing narratives...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (narratives.length === 0) {
    return (
      <Card className="border border-border">
        <CardHeader className="border-b border-border bg-secondary/50 py-3 px-4 sm:px-6">
          <CardTitle className="text-sm font-medium tracking-wide flex items-center gap-2">
            <Shield className="h-4 w-4" />
            MDM Narrative Intelligence
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="text-center text-muted-foreground py-6">
            <Shield className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No significant MDM narratives detected</p>
            <p className="text-xs mt-1 opacity-70">Positive indicator for brand health</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-border bg-card">
      <CardHeader className="border-b border-border bg-secondary/50 py-3 px-4 sm:px-6">
        <CardTitle className="text-sm font-medium tracking-wide flex items-center gap-2">
          <Shield className="h-4 w-4" />
          MDM Narrative Intelligence
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          Misinformation, Disinformation & Malinformation Analysis
        </p>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 space-y-5">
        {/* Statistics Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-destructive/5 border border-destructive/20 text-center rounded-sm">
            <div className="text-2xl font-semibold text-destructive">{stats.high}</div>
            <div className="text-xs text-muted-foreground mt-0.5">High Severity</div>
          </div>
          <div className="p-3 bg-warning/5 border border-warning/20 text-center rounded-sm">
            <div className="text-2xl font-semibold text-warning">{stats.medium}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Medium</div>
          </div>
          <div className="p-3 bg-success/5 border border-success/20 text-center rounded-sm">
            <div className="text-2xl font-semibold text-success">{stats.low}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Low</div>
          </div>
          <div className="p-3 bg-primary/5 border border-primary/20 text-center rounded-sm">
            <div className="text-2xl font-semibold text-primary">{stats.total}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Total</div>
          </div>
        </div>

        {/* Type Distribution */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="flex items-center gap-3 p-3 border border-border bg-secondary/30 rounded-sm">
            <Info className="h-4 w-4 text-blue-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">Misinformation</div>
            </div>
            <div className="text-xl font-semibold">{stats.misinformation}</div>
          </div>
          <div className="flex items-center gap-3 p-3 border border-border bg-secondary/30 rounded-sm">
            <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">Disinformation</div>
            </div>
            <div className="text-xl font-semibold">{stats.disinformation}</div>
          </div>
          <div className="flex items-center gap-3 p-3 border border-border bg-secondary/30 rounded-sm">
            <Shield className="h-4 w-4 text-warning flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">Malinformation</div>
            </div>
            <div className="text-xl font-semibold">{stats.malinformation}</div>
          </div>
        </div>

        {/* Narratives List */}
        <div>
          <h3 className="text-sm font-medium mb-3">Detected Narratives</h3>
          <Accordion type="single" collapsible className="space-y-2">
            {sortedNarratives.map((narrative, index) => {
              const typeConfig = getTypeConfig(narrative.type);
              const TypeIcon = typeConfig.icon;

              return (
                <AccordionItem
                  key={index}
                  value={`narrative-${index}`}
                  className="border border-border bg-card rounded-sm overflow-hidden"
                >
                  <AccordionTrigger className="px-3 sm:px-4 py-3 hover:no-underline hover:bg-secondary/30">
                    <div className="flex items-center gap-2 sm:gap-3 flex-1 text-left min-w-0">
                      <div className={`p-1.5 rounded-sm ${typeConfig.color} flex-shrink-0`}>
                        <TypeIcon className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate pr-2">{narrative.title}</div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <Badge variant="outline" className={`text-xs min-w-[50px] ${getSeverityColor(narrative.severity)}`}>
                            {narrative.severity}
                          </Badge>
                          <Badge variant="outline" className="text-xs min-w-[45px]">
                            <TrendingUp className="h-3 w-3 mr-1 flex-shrink-0" />
                            {narrative.frequency}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-3 sm:px-4 pt-2 pb-4 border-t border-border">
                    <div className="space-y-3">
                      <div className="bg-secondary/50 p-3 border-l-2 border-primary rounded-sm">
                        <p className="text-sm leading-relaxed">{narrative.description}</p>
                      </div>
                      
                      <div className="flex items-start gap-2 flex-wrap">
                        <Badge variant="outline" className={`text-xs ${typeConfig.color}`}>
                          {typeConfig.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{typeConfig.description}</span>
                      </div>

                      {narrative.keywords && narrative.keywords.length > 0 && (
                        <div>
                          <div className="text-xs text-muted-foreground mb-1.5">Keywords:</div>
                          <div className="flex flex-wrap gap-1.5">
                            {narrative.keywords.map((keyword, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>

        {/* Info Footer */}
        <div className="pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">AI Analysis:</span> Narratives identified using natural language processing.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}