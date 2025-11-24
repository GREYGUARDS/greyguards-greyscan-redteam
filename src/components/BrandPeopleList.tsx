import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, TrendingUp, AlertTriangle, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  severity: string;
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
  const { toast } = useToast();

  const getSentimentColor = (score: number) => {
    if (score > 20) return "text-success";
    if (score < -20) return "text-danger";
    return "text-warning";
  };

  const getSeverityBadge = (severity: string) => {
    const variants = {
      high: "destructive",
      medium: "default",
      low: "secondary"
    };
    return variants[severity as keyof typeof variants] || "secondary";
  };

  if (people.length === 0) {
    return (
      <Card className="p-8 text-center bg-background/50 backdrop-blur-sm border-border/50">
        <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">No People Discovered Yet</h3>
        <p className="text-muted-foreground">
          Click "Discover Key People" to identify CEOs, board members, and executives associated with this brand.
        </p>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
        const highSeverityCount = personNarratives.filter(n => n.severity === 'high').length;

        return (
          <Card 
            key={person.id} 
            className="p-6 bg-background/50 backdrop-blur-sm border-border/50 hover:bg-background/60 transition-all"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  {person.person_name}
                </h3>
                <p className="text-sm text-muted-foreground">{person.person_role}</p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onRefresh(person.id)}
                disabled={isRefreshing === person.id}
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing === person.id ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Mentions</span>
                <span className="text-lg font-semibold text-foreground">
                  {personMentions.mention_count.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Sentiment</span>
                <div className="flex items-center gap-2">
                  <TrendingUp className={`h-4 w-4 ${getSentimentColor(personMentions.sentiment_score)}`} />
                  <span className={`text-lg font-semibold ${getSentimentColor(personMentions.sentiment_score)}`}>
                    {personMentions.sentiment_score.toFixed(1)}
                  </span>
                </div>
              </div>

              {mdmCount > 0 && (
                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    MDM Narratives
                  </span>
                  <div className="flex gap-2">
                    {highSeverityCount > 0 && (
                      <Badge variant="destructive">{highSeverityCount}</Badge>
                    )}
                    <Badge variant="secondary">{mdmCount}</Badge>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/50">
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">Positive</div>
                  <div className="text-sm font-semibold text-success">
                    {personMentions.positive_count}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">Neutral</div>
                  <div className="text-sm font-semibold text-warning">
                    {personMentions.neutral_count}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">Negative</div>
                  <div className="text-sm font-semibold text-danger">
                    {personMentions.negative_count}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};