import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { useEffect, useRef } from "react";

interface Mention {
  text: string;
  source: string;
  date: Date;
  score?: number;
}

interface MentionsTickerProps {
  mentions: Mention[];
}

export function MentionsTicker({ mentions }: MentionsTickerProps) {
  const tickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ticker = tickerRef.current;
    if (!ticker) return;

    const scrollWidth = ticker.scrollWidth;
    const clientWidth = ticker.clientWidth;
    
    if (scrollWidth <= clientWidth) return;

    let animationId: number;
    let scrollPosition = 0;
    const speed = 0.5; // pixels per frame

    const animate = () => {
      scrollPosition += speed;
      
      if (scrollPosition >= scrollWidth / 2) {
        scrollPosition = 0;
      }
      
      ticker.scrollLeft = scrollPosition;
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [mentions]);

  if (!mentions || mentions.length === 0) {
    return null;
  }

  const getSourceColor = (source: string) => {
    switch (source.toLowerCase()) {
      case "news":
        return "bg-blue-500/20 text-blue-500 border-blue-500/30";
      case "reddit":
        return "bg-orange-500/20 text-orange-500 border-orange-500/30";
      default:
        return "bg-primary/20 text-primary border-primary/30";
    }
  };

  // Duplicate mentions for seamless infinite scroll
  const duplicatedMentions = [...mentions, ...mentions];

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle>Live Mention Feed</CardTitle>
        <p className="text-sm text-muted-foreground">
          Recent brand mentions across monitored sources
        </p>
      </CardHeader>
      <CardContent>
        <div className="relative overflow-hidden">
          <div
            ref={tickerRef}
            className="flex gap-4 overflow-x-hidden whitespace-nowrap"
            style={{ scrollBehavior: "auto" }}
          >
            {duplicatedMentions.map((mention, index) => (
              <div
                key={index}
                className="inline-flex flex-shrink-0 items-start gap-3 p-4 rounded-lg border border-border bg-card/50 backdrop-blur-sm min-w-[400px] max-w-[500px]"
              >
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className={`uppercase text-xs ${getSourceColor(mention.source)}`}
                    >
                      {mention.source}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(mention.date), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm whitespace-normal line-clamp-3 leading-relaxed">
                    {mention.text}
                  </p>
                  {mention.score && mention.score > 10 && (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">Engagement:</span>
                      <Badge variant="secondary" className="text-xs">
                        {mention.score}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* Fade edges for better visual effect */}
          <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-background to-transparent pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-background to-transparent pointer-events-none" />
        </div>
      </CardContent>
    </Card>
  );
}
