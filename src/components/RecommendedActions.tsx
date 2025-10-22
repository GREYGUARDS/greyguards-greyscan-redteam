import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, Shield, Megaphone, AlertTriangle } from "lucide-react";

interface RecommendedActionsProps {
  threatLevel: "low" | "medium" | "high" | "critical";
  negativePercentage: number;
}

interface Action {
  priority: "low" | "medium" | "high" | "critical";
  type: "monitor" | "respond" | "debunk" | "counter";
  description: string;
  icon: any;
}

export function RecommendedActions({ threatLevel, negativePercentage }: RecommendedActionsProps) {
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
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle>Recommended Actions</CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          Prioritized response strategy based on current narrative threat level
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <div
              key={index}
              className={`p-4 rounded-lg border-2 ${getPriorityColor(action.priority)} transition-all hover:scale-[1.02]`}
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
      </CardContent>
    </Card>
  );
}
