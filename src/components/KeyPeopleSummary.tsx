import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp, TrendingDown, ShieldAlert } from "lucide-react";

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

interface KeyPeopleSummaryProps {
  people: Person[];
  mentions: Record<string, PersonMention>;
  narratives: Record<string, PersonNarrative[]>;
}

export const KeyPeopleSummary = ({ people, mentions, narratives }: KeyPeopleSummaryProps) => {
  if (people.length === 0) {
    return null;
  }

  const getSentimentColor = (score: number) => {
    if (score > 20) return "text-success";
    if (score < -20) return "text-destructive";
    return "text-warning";
  };

  const getSentimentIcon = (score: number) => {
    if (score >= 0) return <TrendingUp className={`h-3 w-3 ${getSentimentColor(score)}`} />;
    return <TrendingDown className={`h-3 w-3 ${getSentimentColor(score)}`} />;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "critical": return "bg-destructive text-destructive-foreground";
      case "high": return "bg-destructive/80 text-destructive-foreground";
      case "moderate": return "bg-warning text-warning-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  // Calculate totals
  const totalMentions = Object.values(mentions).reduce((sum, m) => sum + m.mention_count, 0);
  const totalNarratives = Object.values(narratives).reduce((sum, n) => sum + n.length, 0);
  const highRiskNarratives = Object.values(narratives).reduce((sum, n) => 
    sum + n.filter(x => x.severity === 'high' || x.severity === 'critical').length, 0
  );

  return (
    <Card className="border-4 border-border bg-card">
      <CardHeader className="border-b-4 border-border">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 uppercase tracking-wider">
            <Users className="h-5 w-5" />
            Key People Scanned
          </CardTitle>
          <div className="flex gap-2">
            <Badge variant="outline" className="uppercase text-xs">
              {people.length} People
            </Badge>
            <Badge variant="outline" className="uppercase text-xs">
              {totalMentions} Mentions
            </Badge>
            {highRiskNarratives > 0 && (
              <Badge className="bg-destructive text-destructive-foreground uppercase text-xs">
                {highRiskNarratives} High Risk
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {people.map((person) => {
            const personMentions = mentions[person.id] || {
              mention_count: 0,
              sentiment_score: 0,
              positive_count: 0,
              negative_count: 0,
              neutral_count: 0
            };
            const personNarratives = narratives[person.id] || [];
            const highSeverityCount = personNarratives.filter(n => 
              n.severity === 'high' || n.severity === 'critical'
            ).length;

            return (
              <div 
                key={person.id} 
                className="p-3 border border-border rounded-sm bg-secondary/50"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-semibold text-foreground truncate">
                      {person.person_name}
                    </h4>
                    <p className="text-xs text-muted-foreground truncate">{person.person_role}</p>
                  </div>
                  {highSeverityCount > 0 && (
                    <ShieldAlert className="h-4 w-4 text-destructive flex-shrink-0" />
                  )}
                </div>
                
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">Mentions:</span>
                    <span className="font-medium">{personMentions.mention_count}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">Sentiment:</span>
                    {getSentimentIcon(personMentions.sentiment_score)}
                    <span className={`font-medium ${getSentimentColor(personMentions.sentiment_score)}`}>
                      {personMentions.sentiment_score > 0 ? '+' : ''}{personMentions.sentiment_score}
                    </span>
                  </div>
                </div>

                {personNarratives.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {personNarratives.slice(0, 2).map((narrative, idx) => (
                      <Badge 
                        key={idx} 
                        className={`${getSeverityColor(narrative.severity)} text-[10px] uppercase`}
                      >
                        {narrative.narrative_type}
                      </Badge>
                    ))}
                    {personNarratives.length > 2 && (
                      <Badge variant="outline" className="text-[10px]">
                        +{personNarratives.length - 2} more
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
