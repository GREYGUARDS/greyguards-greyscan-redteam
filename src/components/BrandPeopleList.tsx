import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, TrendingUp, TrendingDown, AlertTriangle, RefreshCw, ShieldAlert } from "lucide-react";

interface Person {
  id: string;
  person_name: string;
  person_role: string;
  discovered_at: string;
}

interface PersonMention {
  mention_count: number;
  sentiment_score: number;
  positive_count: number;
  negative_count: number;
  neutral_count: number;
}

interface PersonNarrative {
  narrative_type: string;
  narrative_description?: string;
  severity: string;
  frequency?: number;
}

interface BrandPeopleListProps {
  people: Person[];
  mentions: Record<string, PersonMention>;
  narratives: Record<string, PersonNarrative[]>;
  onRefresh: (personId: string) => void;
  isRefreshing: string | null;
}

export const BrandPeopleList = ({ 
  people, 
  mentions, 
  narratives, 
  onRefresh,
  isRefreshing 
}: BrandPeopleListProps) => {
  const getSentimentColor = (score: number) => {
    if (score > 20) return "text-success";
    if (score < -20) return "text-destructive";
    return "text-warning";
  };

  const getSentimentIcon = (score: number) => {
    if (score > 0) return <TrendingUp className={`h-4 w-4 ${getSentimentColor(score)}`} />;
    if (score < 0) return <TrendingDown className={`h-4 w-4 ${getSentimentColor(score)}`} />;
    return <TrendingUp className={`h-4 w-4 ${getSentimentColor(score)}`} />;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "critical": return "bg-destructive text-destructive-foreground";
      case "high": return "bg-destructive/80 text-destructive-foreground";
      case "moderate": return "bg-warning text-warning-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getNarrativeTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "disinformation": return "border-destructive text-destructive";
      case "misinformation": return "border-warning text-warning";
      case "malinformation": return "border-primary text-primary";
      default: return "border-muted text-muted-foreground";
    }
  };

  if (people.length === 0) {
    return (
      <Card className="p-6 sm:p-8 text-center bg-card border border-border">
        <Users className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
        <h3 className="text-base font-medium mb-2">No People Discovered Yet</h3>
        <p className="text-sm text-muted-foreground">
          Click "Discover Key People" to identify executives associated with this brand.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {people.map((person) => {
        const personMentions = mentions[person.id] || {
          mention_count: 0,
          sentiment_score: 0,
          positive_count: 0,
          negative_count: 0,
          neutral_count: 0
        };
        const personNarratives = narratives[person.id] || [];
        const mdmCount = personNarratives.length;
        const highSeverityCount = personNarratives.filter(n => 
          n.severity === 'high' || n.severity === 'critical'
        ).length;

        return (
          <Card 
            key={person.id} 
            className="p-4 sm:p-5 border border-border bg-card"
          >
            {/* Header */}
            <div className="flex justify-between items-start gap-3 mb-4">
              <div className="min-w-0 flex-1">
                <h3 className="text-base sm:text-lg font-semibold text-foreground truncate">
                  {person.person_name}
                </h3>
                <p className="text-sm text-muted-foreground truncate">{person.person_role}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {highSeverityCount > 0 && (
                  <Badge className="bg-destructive text-destructive-foreground text-xs hidden sm:flex">
                    <ShieldAlert className="h-3 w-3 mr-1" />
                    {highSeverityCount} High Risk
                  </Badge>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onRefresh(person.id)}
                  disabled={isRefreshing === person.id}
                  className="h-8 w-8 p-0"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing === person.id ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>

            {/* Mobile high risk badge */}
            {highSeverityCount > 0 && (
              <Badge className="bg-destructive text-destructive-foreground text-xs mb-3 sm:hidden">
                <ShieldAlert className="h-3 w-3 mr-1" />
                {highSeverityCount} High Risk
              </Badge>
            )}

            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 p-3 bg-secondary/30 border border-border rounded-sm">
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-semibold">{personMentions.mention_count.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Mentions</div>
              </div>
              <div className="text-center">
                <div className={`text-xl sm:text-2xl font-semibold flex items-center justify-center gap-1 ${getSentimentColor(personMentions.sentiment_score)}`}>
                  {getSentimentIcon(personMentions.sentiment_score)}
                  {personMentions.sentiment_score.toFixed(0)}
                </div>
                <div className="text-xs text-muted-foreground">Sentiment</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-semibold text-success">{personMentions.positive_count}</div>
                <div className="text-xs text-muted-foreground">Positive</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-semibold text-destructive">{personMentions.negative_count}</div>
                <div className="text-xs text-muted-foreground">Negative</div>
              </div>
            </div>

            {/* MDM Narratives */}
            {mdmCount > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  MDM Narratives ({mdmCount})
                </div>
                <div className="space-y-2">
                  {personNarratives.map((narrative, idx) => (
                    <div 
                      key={idx}
                      className="p-3 border border-border bg-secondary/20 rounded-sm"
                    >
                      <div className="flex flex-wrap items-start gap-2 mb-2">
                        <Badge 
                          variant="outline" 
                          className={`${getNarrativeTypeColor(narrative.narrative_type)} text-xs`}
                        >
                          {narrative.narrative_type}
                        </Badge>
                        <Badge className={`${getSeverityColor(narrative.severity)} text-xs`}>
                          {narrative.severity}
                        </Badge>
                      </div>
                      {narrative.narrative_description && (
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {narrative.narrative_description}
                        </p>
                      )}
                      {narrative.frequency && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          Frequency: <span className="text-warning font-medium">{narrative.frequency} mentions</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {mdmCount === 0 && (
              <div className="p-3 border border-success/20 bg-success/5 text-center rounded-sm">
                <p className="text-sm text-success">
                  No active MDM narratives detected
                </p>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
};