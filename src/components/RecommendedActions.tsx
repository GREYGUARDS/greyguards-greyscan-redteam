import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Shield, Megaphone, AlertTriangle, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface RecommendedActionsProps {
  threatLevel: "low" | "medium" | "high" | "critical";
  negativePercentage: number;
  brandName: string;
  sentimentDistribution: { positive: number; neutral: number; negative: number };
  keywords: Array<{ word: string; count: number }>;
}

interface Action {
  priority: "low" | "medium" | "high" | "critical";
  type: "monitor" | "respond" | "debunk" | "counter";
  description: string;
  icon: any;
}

export function RecommendedActions({ 
  threatLevel, 
  negativePercentage, 
  brandName, 
  sentimentDistribution, 
  keywords 
}: RecommendedActionsProps) {
  const [aiRecommendations, setAiRecommendations] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const generateRecommendations = async () => {
    setLoading(true);
    try {
      const sentimentSummary = `${sentimentDistribution.positive}% positive, ${sentimentDistribution.neutral}% neutral, ${sentimentDistribution.negative}% negative`;
      const topTopics = keywords.slice(0, 5).map(k => k.word).join(", ");

      const { data, error } = await supabase.functions.invoke('generate-actions', {
        body: {
          brand: brandName,
          sentimentSummary,
          topTopics,
          riskLevel: threatLevel,
        }
      });

      if (error) throw error;
      
      if (data?.recommendations) {
        setAiRecommendations(data.recommendations);
      }
    } catch (error: any) {
      console.error('Error generating recommendations:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate recommendations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateRecommendations();
  }, [brandName, threatLevel]);

  const getActions = (): Action[] => {
    const actions: Action[] = [];

    // Always monitor
    actions.push({
      priority: "low",
      type: "monitor",
      description: "Continue tracking brand mentions across all platforms and social media channels",
      icon: Eye,
    });

    if (negativePercentage > 20 || threatLevel === "medium") {
      actions.push({
        priority: "medium",
        type: "respond",
        description: "Engage with negative comments and address concerns directly with factual responses",
        icon: Shield,
      });
    }

    if (negativePercentage > 40 || threatLevel === "high") {
      actions.push({
        priority: "high",
        type: "debunk",
        description: "Publish fact-checking content and clarifications to counter misinformation",
        icon: AlertTriangle,
      });
    }

    if (negativePercentage > 60 || threatLevel === "critical") {
      actions.push({
        priority: "critical",
        type: "counter",
        description: "Launch strategic counter-narrative campaign across all channels with amplified messaging",
        icon: Megaphone,
      });
    }

    return actions;
  };

  const actions = getActions();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "border-destructive bg-destructive/10";
      case "high":
        return "border-warning bg-warning/10";
      case "medium":
        return "border-yellow-500 bg-yellow-500/10";
      default:
        return "border-primary bg-primary/10";
    }
  };

  const getPriorityBadgeVariant = (priority: string): "default" | "secondary" | "destructive" => {
    switch (priority) {
      case "critical":
      case "high":
        return "destructive";
      case "medium":
        return "secondary";
      default:
        return "default";
    }
  };

  const getActionTypeColor = (type: string) => {
    switch (type) {
      case "counter":
        return "bg-destructive text-destructive-foreground";
      case "debunk":
        return "bg-warning text-warning-foreground";
      case "respond":
        return "bg-primary text-primary-foreground";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  return (
    <Card className="animate-fade-in border-4 border-border">
      <CardHeader className="border-b-4 border-border bg-secondary">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="uppercase tracking-wider flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Recommended Actions
            </CardTitle>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mt-2">
              Generated by 808080 – AI Narrative Intelligence Advisor
            </p>
          </div>
          <Button
            onClick={generateRecommendations}
            disabled={loading}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Regenerate
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-pulse text-muted-foreground">Generating recommendations...</div>
          </div>
        ) : aiRecommendations ? (
          <div className="prose prose-sm max-w-none dark:prose-invert animate-fade-in">
            <div className="whitespace-pre-wrap text-foreground leading-relaxed">
              {aiRecommendations}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {actions.map((action, index) => {
              const Icon = action.icon;
              return (
                <div
                  key={index}
                  className={`p-6 border-2 ${getPriorityColor(action.priority)}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={getPriorityBadgeVariant(action.priority)} className="uppercase text-xs">
                          {action.priority} Priority
                        </Badge>
                        <Badge className={`uppercase text-xs ${getActionTypeColor(action.type)}`}>
                          {action.type}
                        </Badge>
                      </div>
                      <p className="text-sm leading-relaxed">{action.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
