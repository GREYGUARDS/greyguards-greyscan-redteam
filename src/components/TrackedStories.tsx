import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Newspaper, ExternalLink, TrendingDown, Eye, Calendar } from "lucide-react";
import { format } from "date-fns";

interface TrackedStory {
  id: string;
  headline: string;
  outlet: string;
  published: string;
  sentiment: number;
  reach: number;
  type: string;
  screenshot?: boolean;
}

interface TrackedStoriesProps {
  stories: TrackedStory[];
  brandName: string;
}

export const TrackedStories = ({ stories, brandName }: TrackedStoriesProps) => {
  if (!stories || stories.length === 0) return null;

  const getSentimentColor = (sentiment: number) => {
    if (sentiment >= 0.2) return "text-success";
    if (sentiment >= -0.2) return "text-muted-foreground";
    return "text-destructive";
  };

  const getSentimentLabel = (sentiment: number) => {
    if (sentiment >= 0.2) return "Positive";
    if (sentiment >= -0.2) return "Neutral";
    if (sentiment >= -0.5) return "Negative";
    return "Very Negative";
  };

  const formatReach = (reach: number) => {
    if (reach >= 1000000) return `${(reach / 1000000).toFixed(1)}M`;
    if (reach >= 1000) return `${(reach / 1000).toFixed(0)}K`;
    return reach.toString();
  };

  return (
    <Card className="border-4 border-border bg-card">
      <CardHeader className="border-b-4 border-border">
        <CardTitle className="flex items-center gap-2 uppercase tracking-wider">
          <Newspaper className="h-5 w-5" />
          Tracked Stories & Media Coverage
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          High-impact stories being monitored for {brandName}
        </p>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {stories.map((story) => (
            <div
              key={story.id}
              className="border-2 border-border bg-secondary/30 p-4 hover:bg-secondary/50 transition-colors"
            >
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Story Screenshot Placeholder */}
                {story.screenshot && (
                  <div className="lg:w-48 h-32 bg-muted border-2 border-border flex items-center justify-center flex-shrink-0">
                    <div className="text-center p-4">
                      <Newspaper className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <span className="text-xs text-muted-foreground uppercase tracking-wider">
                        Story Preview
                      </span>
                    </div>
                  </div>
                )}
                
                {/* Story Details */}
                <div className="flex-1 space-y-3">
                  <div>
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h4 className="font-semibold text-lg leading-tight">
                        {story.headline}
                      </h4>
                      <Badge 
                        variant="outline" 
                        className={`${getSentimentColor(story.sentiment)} border-current uppercase text-xs flex-shrink-0`}
                      >
                        {getSentimentLabel(story.sentiment)}
                      </Badge>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {story.outlet}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(story.published), "MMM d, yyyy")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {formatReach(story.reach)} reach
                      </span>
                      <Badge variant="secondary" className="uppercase text-xs">
                        {story.type}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Sentiment Indicator Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground uppercase tracking-wider">
                        Sentiment Impact
                      </span>
                      <span className={getSentimentColor(story.sentiment)}>
                        {(story.sentiment * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all ${
                          story.sentiment >= 0 
                            ? "bg-success" 
                            : "bg-destructive"
                        }`}
                        style={{ 
                          width: `${Math.abs(story.sentiment) * 100}%`,
                          marginLeft: story.sentiment >= 0 ? "50%" : `${50 - Math.abs(story.sentiment) * 50}%`
                        }}
                      />
                    </div>
                  </div>
                  
                  {/* Action Row */}
                  <div className="flex items-center gap-2 pt-2">
                    <Badge 
                      variant="outline" 
                      className="cursor-pointer hover:bg-primary/10 transition-colors"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View Full Article
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className="cursor-pointer hover:bg-primary/10 transition-colors"
                    >
                      <TrendingDown className="h-3 w-3 mr-1" />
                      Track Spread
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Counter-Narrative Recommendations */}
        <div className="mt-6 p-4 border-2 border-warning/30 bg-warning/5">
          <h5 className="font-semibold uppercase tracking-wider text-sm mb-2 flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-warning" />
            Automated Response Recommendations
          </h5>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Prepare official statement addressing key allegations</li>
            <li>• Engage fact-checking organizations for debunking</li>
            <li>• Monitor social amplification patterns for coordinated behavior</li>
            <li>• Brief stakeholders on emerging narrative trajectories</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
