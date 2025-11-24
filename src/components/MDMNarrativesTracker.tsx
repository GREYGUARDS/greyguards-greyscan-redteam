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
          color: "bg-blue-500/20 text-blue-500 border-blue-500/30",
          description: "False info shared without malicious intent"
        };
      case "disinformation":
        return {
          label: "Disinformation",
          icon: AlertTriangle,
          color: "bg-danger/20 text-danger border-danger/30",
          description: "False info deliberately spread to deceive"
        };
      case "malinformation":
        return {
          label: "Malinformation",
          icon: Shield,
          color: "bg-warning/20 text-warning border-warning/30",
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
        return "bg-danger text-danger-foreground";
      case "medium":
        return "bg-warning text-warning-foreground";
      case "low":
        return "bg-success text-success-foreground";
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
      <Card className="border-4 border-border animate-pulse">
        <CardHeader className="border-b-4 border-border bg-secondary">
          <CardTitle className="uppercase tracking-wider flex items-center gap-2">
            <Shield className="h-5 w-5" />
            MDM Narrative Intelligence
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground py-8">
            Analyzing narratives using AI...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (narratives.length === 0) {
    return (
      <Card className="border-4 border-border">
        <CardHeader className="border-b-4 border-border bg-secondary">
          <CardTitle className="uppercase tracking-wider flex items-center gap-2">
            <Shield className="h-5 w-5" />
            MDM Narrative Intelligence
          </CardTitle>
          <p className="text-xs text-muted-foreground uppercase tracking-widest mt-2">
            Misinformation, Disinformation, Malinformation Analysis
          </p>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground py-8">
            <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">No significant MDM narratives detected</p>
            <p className="text-xs mt-2">This is a positive indicator for brand health</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-4 border-border bg-card">
      <CardHeader className="border-b-4 border-border bg-secondary">
        <CardTitle className="uppercase tracking-wider flex items-center gap-2">
          <Shield className="h-5 w-5" />
          MDM Narrative Intelligence
        </CardTitle>
        <p className="text-xs text-muted-foreground uppercase tracking-widest mt-2">
          Tracking Misinformation, Disinformation & Malinformation
        </p>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Statistics Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-danger/10 border-2 border-danger/30 text-center">
            <div className="text-3xl font-bold text-danger">{stats.high}</div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mt-1">High Severity</div>
          </div>
          <div className="p-4 bg-warning/10 border-2 border-warning/30 text-center">
            <div className="text-3xl font-bold text-warning">{stats.medium}</div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mt-1">Medium Severity</div>
          </div>
          <div className="p-4 bg-success/10 border-2 border-success/30 text-center">
            <div className="text-3xl font-bold text-success">{stats.low}</div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mt-1">Low Severity</div>
          </div>
          <div className="p-4 bg-primary/10 border-2 border-primary/30 text-center">
            <div className="text-3xl font-bold text-primary">{stats.total}</div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mt-1">Total Narratives</div>
          </div>
        </div>

        {/* Type Distribution */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex items-center gap-3 p-3 border-2 border-border bg-secondary">
            <Info className="h-5 w-5 text-blue-500" />
            <div className="flex-1">
              <div className="text-sm font-semibold">Misinformation</div>
              <div className="text-xs text-muted-foreground">Unintentional false info</div>
            </div>
            <div className="text-2xl font-bold">{stats.misinformation}</div>
          </div>
          <div className="flex items-center gap-3 p-3 border-2 border-border bg-secondary">
            <AlertTriangle className="h-5 w-5 text-danger" />
            <div className="flex-1">
              <div className="text-sm font-semibold">Disinformation</div>
              <div className="text-xs text-muted-foreground">Deliberate deception</div>
            </div>
            <div className="text-2xl font-bold">{stats.disinformation}</div>
          </div>
          <div className="flex items-center gap-3 p-3 border-2 border-border bg-secondary">
            <Shield className="h-5 w-5 text-warning" />
            <div className="flex-1">
              <div className="text-sm font-semibold">Malinformation</div>
              <div className="text-xs text-muted-foreground">Harmful truth</div>
            </div>
            <div className="text-2xl font-bold">{stats.malinformation}</div>
          </div>
        </div>

        {/* Narratives List */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider mb-4">Detected Narratives</h3>
          <Accordion type="single" collapsible className="space-y-2">
            {sortedNarratives.map((narrative, index) => {
              const typeConfig = getTypeConfig(narrative.type);
              const TypeIcon = typeConfig.icon;

              return (
                <AccordionItem
                  key={index}
                  value={`narrative-${index}`}
                  className="border-2 border-border bg-card"
                >
                  <AccordionTrigger className="px-4 hover:no-underline">
                    <div className="flex items-center gap-3 flex-1 text-left">
                      <div className={`p-2 rounded-sm ${typeConfig.color}`}>
                        <TypeIcon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm truncate">{narrative.title}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className={`text-xs uppercase ${getSeverityColor(narrative.severity)}`}>
                            {narrative.severity}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            {narrative.frequency} mentions
                          </Badge>
                          {narrative.firstSeen && (
                            <span className="text-xs text-muted-foreground">
                              Since {narrative.firstSeen}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pt-2 pb-4">
                    <div className="space-y-3">
                      <div className="bg-secondary p-3 border-l-4 border-primary">
                        <p className="text-sm leading-relaxed">{narrative.description}</p>
                      </div>
                      
                      <div className="flex items-start gap-2">
                        <Badge variant="outline" className={`uppercase text-xs ${typeConfig.color}`}>
                          {typeConfig.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{typeConfig.description}</span>
                      </div>

                      {narrative.keywords && narrative.keywords.length > 0 && (
                        <div>
                          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                            Related Keywords:
                          </div>
                          <div className="flex flex-wrap gap-2">
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
        <div className="pt-4 border-t-2 border-border">
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Analysis Powered by AI:</span> Narratives are automatically identified and classified using advanced natural language processing. Monitor frequency trends to detect coordinated information campaigns.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
