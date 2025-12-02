import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Twitter, MessageSquare, Newspaper, TrendingUp, Heart, MessageCircle, Share } from "lucide-react";
import { format } from "date-fns";

interface DemoMention {
  text: string;
  source: string;
  date: Date;
  author?: string;
  engagement?: number;
  score?: number;
  title?: string;
  outlet?: string;
}

interface DemoSocialMentionsProps {
  mentions: DemoMention[];
  brandName: string;
}

export const DemoSocialMentions = ({ mentions, brandName }: DemoSocialMentionsProps) => {
  if (!mentions || mentions.length === 0) return null;

  const getSourceIcon = (source: string) => {
    switch (source.toLowerCase()) {
      case "twitter":
        return <Twitter className="h-4 w-4" />;
      case "reddit":
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <Newspaper className="h-4 w-4" />;
    }
  };

  const getSourceColor = (source: string) => {
    switch (source.toLowerCase()) {
      case "twitter":
        return "bg-blue-500/20 text-blue-400 border-blue-500/50";
      case "reddit":
        return "bg-orange-500/20 text-orange-400 border-orange-500/50";
      default:
        return "bg-primary/20 text-primary border-primary/50";
    }
  };

  const formatEngagement = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <Card className="border-4 border-border bg-card">
      <CardHeader className="border-b-4 border-border">
        <CardTitle className="flex items-center gap-2 uppercase tracking-wider">
          <MessageSquare className="h-5 w-5" />
          Live Social Intelligence Feed
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Real-time monitoring of social media mentions and news coverage for {brandName}
        </p>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {mentions.slice(0, 10).map((mention, index) => (
            <div
              key={index}
              className="border-2 border-border bg-secondary/30 p-4 hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-start gap-3">
                {/* Source Icon */}
                <div className={`p-2 rounded border ${getSourceColor(mention.source)}`}>
                  {getSourceIcon(mention.source)}
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {mention.author && (
                      <span className="font-semibold text-sm">
                        {mention.author}
                      </span>
                    )}
                    {mention.outlet && (
                      <span className="font-semibold text-sm">
                        {mention.outlet}
                      </span>
                    )}
                    <Badge 
                      variant="outline" 
                      className={`${getSourceColor(mention.source)} uppercase text-xs`}
                    >
                      {mention.source}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(mention.date), "MMM d, h:mm a")}
                    </span>
                  </div>
                  
                  {/* Title (for news) */}
                  {mention.title && (
                    <h4 className="font-medium mb-1">{mention.title}</h4>
                  )}
                  
                  {/* Text */}
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {mention.text}
                  </p>
                  
                  {/* Engagement Stats */}
                  <div className="flex items-center gap-4 mt-3">
                    {mention.engagement && (
                      <>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Heart className="h-3 w-3" />
                          {formatEngagement(Math.round(mention.engagement * 0.6))}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MessageCircle className="h-3 w-3" />
                          {formatEngagement(Math.round(mention.engagement * 0.15))}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Share className="h-3 w-3" />
                          {formatEngagement(Math.round(mention.engagement * 0.25))}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-warning">
                          <TrendingUp className="h-3 w-3" />
                          {formatEngagement(mention.engagement)} total
                        </span>
                      </>
                    )}
                    {mention.score && (
                      <span className="flex items-center gap-1 text-xs text-warning">
                        <TrendingUp className="h-3 w-3" />
                        {formatEngagement(mention.score)} upvotes
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Analysis Summary */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border-2 border-destructive/30 bg-destructive/5">
            <div className="text-2xl font-bold text-destructive">
              {Math.round(mentions.filter(m => 
                m.text.toLowerCase().includes("scandal") || 
                m.text.toLowerCase().includes("exposed") ||
                m.text.toLowerCase().includes("controversy")
              ).length / mentions.length * 100)}%
            </div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">
              Negative Signal Density
            </div>
          </div>
          <div className="p-4 border-2 border-warning/30 bg-warning/5">
            <div className="text-2xl font-bold text-warning">
              {mentions.reduce((sum, m) => sum + (m.engagement || m.score || 0), 0) > 100000 ? "HIGH" : "MODERATE"}
            </div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">
              Viral Potential
            </div>
          </div>
          <div className="p-4 border-2 border-primary/30 bg-primary/5">
            <div className="text-2xl font-bold">
              {mentions.length}
            </div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">
              Active Threads Tracked
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
